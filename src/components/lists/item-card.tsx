"use client"

import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatViewNumber } from "@/lib/format-number"
import { cn } from "@/lib/utils"
import type { ListItemRecord } from "@/types/list"
import { GripIcon, ImageOffIcon, LineChartIcon, MoreHorizontalIcon } from "lucide-react"
import { useTranslations } from "next-intl"
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
	onImageError?: (item: ListItemRecord) => void
	dragHandle?: ReactNode
}

export function itemCardClassName(item: ListItemRecord, showImage: boolean) {
	return cn(
		"cv-auto grid gap-4 bg-white dark:bg-neutral-900 p-4 rounded-md",
		showImage
			? "grid-cols-[min-content_min-content_1fr_min-content]"
			: "grid-cols-[min-content_1fr_min-content]",
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
	onImageError,
	dragHandle,
}: ItemCardProps) {
	const tCommon = useTranslations("Common")
	const tPrice = useTranslations("PriceHistory")
	const hasChange = item.originalPrice != null && item.originalPrice !== item.price
	const isCheaper = hasChange && item.price < (item.originalPrice ?? 0)

	return (
		<>
			{canEdit ? dragHandle : null}
			{showImage ? (
				<div className="h-full aspect-square rounded-sm flex items-center justify-center">
					{item.imageUrl ? (
						<Image
							src={item.imageUrl}
							onError={() => onImageError?.(item)}
							alt={item.name.slice(0, 10)}
							width={80}
							height={80}
						/>
					) : (
						<div className="bg-gray-200 h-full aspect-square rounded-sm flex items-center justify-center">
							<ImageOffIcon />
						</div>
					)}
				</div>
			) : null}
			<div className="flex flex-col gap-2 select-none min-w-0">
				<div className="flex flex-col">
					<h1 className="font-bold truncate">{item.name}</h1>
					<a href={item.link ?? "#"} target="_blank" className="flex items-center gap-2">
						{item.link ? (
							<Image
								src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${item.link}&size=24#refinements`}
								alt={item.name}
								width={16}
								height={16}
							/>
						) : null}
						<p>{item.store ?? <>&nbsp;</>}</p>
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
		<div className={itemCardClassName(props.item, props.showImage ?? true)}>
			<ItemCardBody {...props} />
		</div>
	)
}

export const StaticItemRow = memo(StaticItemRowComponent)
export { GripIcon }
