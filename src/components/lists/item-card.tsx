"use client"

import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatAddedDate } from "@/lib/format-date"
import { formatViewNumber } from "@/lib/format-number"
import { cn } from "@/lib/utils"
import type { ListItemRecord } from "@/types/list"
import { GripIcon, ImageOffIcon, LineChartIcon, MoreHorizontalIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import Image from "next/image"
import type { ReactNode } from "react"
import { memo } from "react"

export type ItemCardProps = {
	item: ListItemRecord
	canEdit: boolean
	showImage?: boolean
	onEdit: (item: ListItemRecord) => void
	onDelete: (item: ListItemRecord) => void
	onMark: (item: ListItemRecord) => void
	onHistory: (item: ListItemRecord) => void
	onOpenLinks: (item: ListItemRecord) => void
	onImageError?: (item: ListItemRecord) => void
	dragHandle?: ReactNode
}

export function itemCardClassName(item: ListItemRecord, showImage: boolean, canEdit: boolean) {
	// Colunas: [alça de arrastar] [imagem] conteúdo [ações]. A alça só existe para quem edita; as ações
	// (histórico de preço, e o menu para quem edita) existem sempre. `minmax(0, 1fr)` deixa o texto encolher.
	const columns = {
		"edit-image": "grid-cols-[min-content_min-content_minmax(0,1fr)_min-content]",
		"edit-noimage": "grid-cols-[min-content_minmax(0,1fr)_min-content]",
		"view-image": "grid-cols-[min-content_minmax(0,1fr)_min-content]",
		"view-noimage": "grid-cols-[minmax(0,1fr)_min-content]",
	}[`${canEdit ? "edit" : "view"}-${showImage ? "image" : "noimage"}` as const]

	return cn(
		"cv-auto grid gap-4 bg-white dark:bg-neutral-900 p-4 rounded-md",
		columns,
		item.isActive ? "" : "opacity-50",
	)
}

export function ItemCardBody({
	item,
	canEdit,
	showImage = true,
	onEdit,
	onDelete,
	onMark,
	onHistory,
	onOpenLinks,
	onImageError,
	dragHandle,
}: ItemCardProps) {
	const tCommon = useTranslations("Common")
	const tPrice = useTranslations("PriceHistory")
	const hasChange = item.originalPrice != null && item.originalPrice !== item.price
	const isCheaper = hasChange && item.price < (item.originalPrice ?? 0)
	const locale = useLocale()
	const addedAt = formatAddedDate(item.createdAt, locale)
	const tLinks = useTranslations("ItemLinks")
	const storeCount = item.links.length
	const openLinks = () => onOpenLinks(item)

	return (
		<>
			{canEdit ? dragHandle : null}
			{showImage ? (
				<div className="size-20 sm:size-[104px] self-center rounded-sm flex items-center justify-center cursor-pointer" onClick={openLinks}>
					{item.imageUrl ? (
						<Image
							src={item.imageUrl}
							onError={() => onImageError?.(item)}
							alt={item.name.slice(0, 10)}
							width={104}
							height={104}
							className="size-full object-cover rounded-sm"
						/>
					) : (
						<div className="bg-gray-200 size-full rounded-sm flex items-center justify-center">
							<ImageOffIcon />
						</div>
					)}
				</div>
			) : null}
			{/* A área toda abre o modal com o mouse; para teclado e leitor de tela o nome é um botão de verdade. */}
			<div className="flex flex-col gap-2 select-none min-w-0 cursor-pointer" onClick={openLinks}>
				<div className="flex flex-col">
					<h1 className="font-bold truncate">
						<button type="button" title={tLinks("viewLinks")} className="block w-full truncate text-left" onClick={openLinks}>
							{item.name}
						</button>
					</h1>
					<a href={item.link ?? "#"} target="_blank" className="flex items-center gap-2 min-w-0" onClick={(event) => event.stopPropagation()}>
						{item.link ? (
							<Image
								src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(item.link)}&size=24#refinements`}
								alt={item.name}
								width={16}
								height={16}
							/>
						) : null}
						<p className="truncate">
							{item.store ?? <>&nbsp;</>}
							{storeCount > 1 ? <span className="text-muted-foreground"> · {tLinks("stores", { count: storeCount })}</span> : null}
						</p>
					</a>
				</div>
				<h1 className="flex flex-wrap items-baseline gap-x-2">
					{hasChange ? (
						<s
							className="text-sm text-neutral-500"
							title={tPrice("originalPrice", { price: formatViewNumber(String(item.originalPrice)) })}
						>
							{formatViewNumber(String(item.originalPrice))}
						</s>
					) : null}
					<span
						className={cn(
							hasChange && "font-bold",
							hasChange && (isCheaper ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"),
						)}
					>
						{formatViewNumber(item.price.toString())}
					</span>
					<span>(x{item.quantity})</span>
				</h1>
				{addedAt ? (
					<p className="text-xs text-muted-foreground">{tCommon("addedOn", { date: addedAt })}</p>
				) : null}
			</div>
			<div className="flex items-center gap-1">
				<Button
					size="icon"
					variant="ghost"
					aria-label={tPrice("open")}
					title={tPrice("open")}
					onClick={() => onHistory(item)}
				>
					<LineChartIcon size={16} />
				</Button>
				{canEdit ? (
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<Button size="icon" variant="ghost">
								<MoreHorizontalIcon size={16} />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onClick={() => onMark(item)}>
								{item.isActive ? tCommon("disable") : tCommon("enable")}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onEdit(item)}>{tCommon("edit")}</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onDelete(item)}>{tCommon("delete")}</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
			</div>
		</>
	)
}

function StaticItemRowComponent(props: ItemCardProps) {
	return (
		<div className={itemCardClassName(props.item, props.showImage ?? true, props.canEdit)}>
			<ItemCardBody {...props} />
		</div>
	)
}

export const StaticItemRow = memo(StaticItemRowComponent)
export { GripIcon }
