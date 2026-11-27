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
import { GripIcon, ImageOffIcon, MoreHorizontalIcon } from "lucide-react"
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
	onImageError?: (item: ListItemRecord) => void
	dragHandle?: ReactNode
}

export function itemCardClassName(item: ListItemRecord, showImage: boolean, canEdit: boolean) {
	// Colunas: [alça de arrastar] [imagem] conteúdo [menu]; alça e menu só existem quando dá para editar.
	const columns = {
		"edit-image": "grid-cols-[min-content_min-content_1fr_min-content]",
		"edit-noimage": "grid-cols-[min-content_1fr_min-content]",
		"view-image": "grid-cols-[min-content_1fr]",
		"view-noimage": "grid-cols-[1fr]",
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
	onImageError,
	dragHandle,
}: ItemCardProps) {
	const tCommon = useTranslations("Common")
	const locale = useLocale()
	const addedAt = formatAddedDate(item.createdAt, locale)

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
				<h1>
					{formatViewNumber(item.price.toString())} (x{item.quantity})
				</h1>
				{addedAt ? (
					<p className="text-xs text-muted-foreground">{tCommon("addedOn", { date: addedAt })}</p>
				) : null}
			</div>
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
