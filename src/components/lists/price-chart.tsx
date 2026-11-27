"use client"

import { formatNumber } from "@/lib/format-number"
import type { PricePoint } from "@/lib/price-history"
import { cn } from "@/lib/utils"
import { useLocale } from "next-intl"
import { useEffect, useMemo, useRef, useState } from "react"

const HEIGHT = 220
const PAD = { top: 16, right: 16, bottom: 28, left: 72 }

type Props = {
	points: PricePoint[]
	/** Até onde o preço atual vale (última checagem): a linha é estendida até aqui. */
	endAt: number
	selectedId: number | null
	onSelect: (id: number) => void
	label: string
}

/**
 * Gráfico em degraus: o preço vale até a próxima mudança, então ligar os pontos em diagonal mostraria
 * variações que nunca existiram. Pontos clicáveis (ou arrastando o dedo/mouse) mostram o detalhe fora do SVG.
 */
export function PriceChart({ points, endAt, selectedId, onSelect, label }: Props) {
	const locale = useLocale()
	const wrapper = useRef<HTMLDivElement>(null)
	const [width, setWidth] = useState(520)

	useEffect(() => {
		const node = wrapper.current
		if (!node) {
			return
		}
		const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)))
		observer.observe(node)
		return () => observer.disconnect()
	}, [])

	const geometry = useMemo(() => {
		const prices = points.map((point) => point.price)
		const min = Math.min(...prices)
		const max = Math.max(...prices)
		const spread = max - min || Math.max(1, max * 0.1)
		const yMin = min - spread * 0.15
		const yMax = max + spread * 0.15
		const start = points[0].checkedAt
		const end = Math.max(endAt, points.at(-1)!.checkedAt, start + 1)
		const innerW = width - PAD.left - PAD.right
		const innerH = HEIGHT - PAD.top - PAD.bottom

		const x = (time: number) => PAD.left + ((time - start) / (end - start)) * innerW
		const y = (price: number) => PAD.top + (1 - (price - yMin) / (yMax - yMin)) * innerH

		let path = `M ${x(points[0].checkedAt)} ${y(points[0].price)}`
		for (let index = 1; index < points.length; index++) {
			path += ` H ${x(points[index].checkedAt)} V ${y(points[index].price)}`
		}
		path += ` H ${x(end)}`

		return { x, y, path, min, max, start, end }
	}, [points, endAt, width])

	const dateFormat = useMemo(() => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }), [locale])

	function pickNearest(clientX: number) {
		const box = wrapper.current?.getBoundingClientRect()
		if (!box) {
			return
		}
		const target = clientX - box.left
		let best = points[0]
		for (const point of points) {
			if (Math.abs(geometry.x(point.checkedAt) - target) < Math.abs(geometry.x(best.checkedAt) - target)) {
				best = point
			}
		}
		onSelect(best.id)
	}

	const yTicks = geometry.min === geometry.max ? [geometry.min] : [geometry.min, geometry.max]

	return (
		<div ref={wrapper} className="w-full touch-pan-y select-none">
			<svg
				role="img"
				aria-label={label}
				width={width}
				height={HEIGHT}
				onPointerDown={(event) => pickNearest(event.clientX)}
				onPointerMove={(event) => event.buttons > 0 && pickNearest(event.clientX)}
			>
				{yTicks.map((price) => (
					<g key={price}>
						<line
							x1={PAD.left}
							x2={width - PAD.right}
							y1={geometry.y(price)}
							y2={geometry.y(price)}
							className="stroke-neutral-200 dark:stroke-neutral-700"
							strokeDasharray="4 4"
						/>
						<text
							x={PAD.left - 8}
							y={geometry.y(price)}
							textAnchor="end"
							dominantBaseline="middle"
							className="fill-neutral-500 text-[11px]"
						>
							{formatNumber(String(price))}
						</text>
					</g>
				))}
				<text x={PAD.left} y={HEIGHT - 8} className="fill-neutral-500 text-[11px]">
					{dateFormat.format(geometry.start)}
				</text>
				<text x={width - PAD.right} y={HEIGHT - 8} textAnchor="end" className="fill-neutral-500 text-[11px]">
					{dateFormat.format(geometry.end)}
				</text>
				<path d={geometry.path} fill="none" strokeWidth={2} strokeLinejoin="round" className="stroke-emerald-500" />
				{points.map((point) => {
					const selected = point.id === selectedId
					return (
						<circle
							key={point.id}
							cx={geometry.x(point.checkedAt)}
							cy={geometry.y(point.price)}
							r={selected ? 6 : 4}
							className={cn(
								"stroke-white dark:stroke-neutral-900",
								selected ? "fill-emerald-600" : "fill-emerald-500",
							)}
							strokeWidth={2}
						/>
					)
				})}
			</svg>
		</div>
	)
}
