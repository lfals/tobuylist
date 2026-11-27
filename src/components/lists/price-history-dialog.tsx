"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatNumber } from "@/lib/format-number"
import { historySignature, type PriceHistoryPayload } from "@/lib/price-history"
import type { ListItemRecord } from "@/types/list"
import { BellRingIcon, Loader2Icon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useCallback, useEffect, useMemo, useState } from "react"
import { PriceChart } from "./price-chart"

/** Enquanto a tela está aberta, confere de tempos em tempos se o refresh em segundo plano trouxe preço novo. */
const POLL_MS = 10_000

type Props = {
	item: ListItemRecord | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

async function loadHistory(itemId: number, signal?: AbortSignal): Promise<PriceHistoryPayload> {
	const response = await fetch(`/api/mobile/items/${itemId}/price-history`, { cache: "no-store", signal })
	if (!response.ok) {
		throw new Error(String(response.status))
	}
	return response.json()
}

function PriceHistoryBody({ item }: { item: ListItemRecord }) {
	const t = useTranslations("PriceHistory")
	const locale = useLocale()
	const [data, setData] = useState<PriceHistoryPayload | null>(null)
	const [pending, setPending] = useState<PriceHistoryPayload | null>(null)
	const [failed, setFailed] = useState(false)

	const show = useCallback((payload: PriceHistoryPayload) => {
		setData(payload)
		setPending(null)
		setFailed(false)
	}, [])

	const load = useCallback(() => {
		setFailed(false)
		loadHistory(item.id).then(show, () => setFailed(true))
	}, [item.id, show])

	useEffect(() => {
		const controller = new AbortController()
		loadHistory(item.id, controller.signal).then(show, (error) => {
			if (!controller.signal.aborted) {
				setFailed(true)
				console.error(error)
			}
		})
		return () => controller.abort()
	}, [item.id, show])

	const shownSignature = data ? historySignature(data) : null
	useEffect(() => {
		if (!shownSignature) {
			return
		}
		const timer = setInterval(() => {
			if (document.visibilityState !== "visible") {
				return
			}
			loadHistory(item.id)
				.then((latest) => setPending(historySignature(latest) === shownSignature ? null : latest))
				.catch(() => {})
		}, POLL_MS)
		return () => clearInterval(timer)
	}, [item.id, shownSignature])

	const formatters = useMemo(
		() => ({
			relative: new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
		}),
		[locale],
	)

	function relativeTime(time: number) {
		const minutes = Math.round((time - Date.now()) / 60_000)
		if (Math.abs(minutes) < 60) {
			return formatters.relative.format(minutes, "minute")
		}
		const hours = Math.round(minutes / 60)
		if (Math.abs(hours) < 48) {
			return formatters.relative.format(hours, "hour")
		}
		return formatters.relative.format(Math.round(hours / 24), "day")
	}

	if (failed && !data) {
		return (
			<div className="flex flex-col items-start gap-3 p-4">
				<p className="text-sm">{t("error")}</p>
				<Button variant="outline" onClick={load}>
					{t("retry")}
				</Button>
			</div>
		)
	}

	if (!data) {
		return (
			<div className="flex items-center gap-2 p-4 text-sm text-neutral-500">
				<Loader2Icon size={16} className="animate-spin" />
				{t("loading")}
			</div>
		)
	}

	const { points } = data
	const prices = points.map((point) => point.price)
	const lowest = Math.min(...prices)
	const highest = Math.max(...prices)
	const reference = data.item.originalPrice ?? points[0].price
	const changePct = reference > 0 ? ((data.item.price - reference) / reference) * 100 : 0
	const sourceLabel = { initial: t("sourceInitial"), manual: t("sourceManual"), scrape: t("sourceScrape") }

	return (
		<div className="flex min-w-0 flex-col gap-4 p-4 pt-0 sm:p-0">
			{pending ? (
				<Alert>
					<BellRingIcon size={16} />
					<AlertTitle>{t("newPrices")}</AlertTitle>
					<AlertDescription>
						<Button size="sm" className="mt-1" onClick={() => show(pending)}>
							{t("refresh")}
						</Button>
					</AlertDescription>
				</Alert>
			) : null}

			<div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
				<Stat label={t("current")} value={formatNumber(String(data.item.price))} strong />
				<Stat label={t("lowest")} value={formatNumber(String(lowest))} />
				<Stat label={t("highest")} value={formatNumber(String(highest))} />
				<Stat
					label={t("change")}
					value={`${changePct > 0 ? "+" : ""}${changePct.toFixed(1)}%`}
					tone={changePct < 0 ? "down" : changePct > 0 ? "up" : undefined}
				/>
			</div>

			<PriceChart
				points={points}
				endAt={data.item.priceCheckedAt ?? points.at(-1)!.checkedAt}
				label={t("chartLabel", { name: data.item.name })}
				sourceLabels={sourceLabel}
				priceLabel={t("current")}
			/>

			{points.length < 2 ? <p className="text-sm text-neutral-500">{t("empty")}</p> : null}
			{!data.item.hasLink ? <p className="text-sm text-neutral-500">{t("noLink")}</p> : null}
			{data.item.hasLink && data.item.priceCheckStatus === "failed" ? (
				<p className="text-sm text-amber-600 dark:text-amber-400">{t("failed")}</p>
			) : null}
			{data.item.hasLink ? (
				<p className="text-xs text-neutral-500">
					{data.item.priceCheckedAt
						? t("updated", { time: relativeTime(data.item.priceCheckedAt) })
						: t("neverChecked")}
				</p>
			) : null}
		</div>
	)
}

function Stat({
	label,
	value,
	strong,
	tone,
}: {
	label: string
	value: string
	strong?: boolean
	tone?: "up" | "down"
}) {
	return (
		<div className="flex flex-col">
			<span className="text-xs text-neutral-500">{label}</span>
			<span
				className={
					tone === "down"
						? "font-semibold text-emerald-600 dark:text-emerald-400"
						: tone === "up"
							? "font-semibold text-red-600 dark:text-red-400"
							: strong
								? "text-base font-bold"
								: "font-semibold"
				}
			>
				{value}
			</span>
		</div>
	)
}

export function PriceHistoryDialog({ item, open, onOpenChange }: Props) {
	const isMobile = useIsMobile()
	const t = useTranslations("PriceHistory")
	// `key` zera o estado (e o polling) ao trocar de item.
	const body = item && open ? <PriceHistoryBody key={item.id} item={item} /> : null

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={onOpenChange}>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>{t("title")}</DrawerTitle>
						{item ? <p className="line-clamp-2 break-words text-sm text-neutral-500">{item.name}</p> : null}
					</DrawerHeader>
					{body}
				</DrawerContent>
			</Drawer>
		)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange} modal>
			<DialogContent className="overflow-hidden sm:max-w-[600px] [&>*]:min-w-0">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					{item ? <p className="line-clamp-2 break-words text-sm text-neutral-500">{item.name}</p> : null}
				</DialogHeader>
				{body}
			</DialogContent>
		</Dialog>
	)
}
