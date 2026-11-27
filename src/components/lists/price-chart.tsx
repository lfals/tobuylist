"use client"

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatNumber } from "@/lib/format-number"
import type { PricePoint } from "@/lib/price-history"
import { useLocale } from "next-intl"
import { useId, useMemo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

type Props = {
	points: PricePoint[]
	/** Até onde o preço atual vale (última checagem): a área é estendida até aqui. */
	endAt: number
	label: string
	sourceLabels: Record<PricePoint["source"], string>
	priceLabel: string
}

type Datum = { t: number; price: number; source: PricePoint["source"]; synthetic?: boolean }

/**
 * Area Chart do shadcn/ui (recharts). Usa `stepAfter`: o preço vale até a próxima mudança, então ligar os
 * pontos em diagonal mostraria variações que nunca existiram.
 */
export function PriceChart({ points, endAt, label, sourceLabels, priceLabel }: Props) {
	const locale = useLocale()
	const gradientId = useId().replace(/:/g, "")

	const formatters = useMemo(
		() => ({
			axisDate: new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }),
			dateTime: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }),
			// Sem "R$" nos eixos: o rótulo com símbolo quebrava em duas linhas. O tooltip mostra o valor completo.
			axisPrice: new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
		}),
		[locale],
	)

	const { data, domain } = useMemo(() => {
		const series: Datum[] = points.map((point) => ({ t: point.checkedAt, price: point.price, source: point.source }))
		const last = series[series.length - 1]
		if (endAt > last.t) {
			series.push({ ...last, t: endAt, synthetic: true })
		}
		const prices = series.map((datum) => datum.price)
		const min = Math.min(...prices)
		const max = Math.max(...prices)
		const pad = (max - min || Math.max(1, max * 0.1)) * 0.2
		return { data: series, domain: [Math.max(0, min - pad), max + pad] as [number, number] }
	}, [points, endAt])

	const config = { price: { label: priceLabel, color: "hsl(var(--chart-1))" } } satisfies ChartConfig

	return (
		<ChartContainer config={config} className="aspect-auto h-[220px] w-full min-w-0" aria-label={label} role="img">
			<AreaChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 4 }}>
				<defs>
					<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="var(--color-price)" stopOpacity={0.8} />
						<stop offset="95%" stopColor="var(--color-price)" stopOpacity={0.1} />
					</linearGradient>
				</defs>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="t"
					type="number"
					scale="time"
					domain={["dataMin", "dataMax"]}
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					minTickGap={32}
					tickFormatter={(value: number) => formatters.axisDate.format(value)}
				/>
				<YAxis
					domain={domain}
					width={72}
					tickLine={false}
					axisLine={false}
					tickMargin={4}
					tickCount={3}
					tickFormatter={(value: number) => formatters.axisPrice.format(value / 100)}
				/>
				<ChartTooltip
					cursor={false}
					content={
						<ChartTooltipContent
							indicator="line"
							labelFormatter={(_, payload) => {
								const datum = payload?.[0]?.payload as Datum | undefined
								return datum ? formatters.dateTime.format(datum.t) : ""
							}}
							formatter={(value, _name, item) => (
								<div className="flex w-full items-center justify-between gap-4">
									<span className="text-muted-foreground">{sourceLabels[(item.payload as Datum).source]}</span>
									<span className="font-mono font-medium tabular-nums text-foreground">
										{formatNumber(String(value))}
									</span>
								</div>
							)}
						/>
					}
				/>
				<Area
					dataKey="price"
					type="stepAfter"
					fill={`url(#${gradientId})`}
					stroke="var(--color-price)"
					strokeWidth={2}
					isAnimationActive={false}
					dot={({ cx, cy, payload, key }) =>
						payload.synthetic ? (
							<g key={key} />
						) : (
							<circle key={key} cx={cx} cy={cy} r={3} fill="var(--color-price)" />
						)
					}
					activeDot={{ r: 5 }}
				/>
			</AreaChart>
		</ChartContainer>
	)
}
