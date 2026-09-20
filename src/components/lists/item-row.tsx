"use client"

import type { ListItemRecord } from "@/types/list"
import { Reorder, useDragControls } from "framer-motion"
import { memo } from "react"
import { GripIcon, ItemCardBody, itemCardClassName, type ItemCardProps } from "./item-card"

function ItemRowComponent(props: ItemCardProps) {
	const controls = useDragControls()

	return (
		<Reorder.Item
			value={props.item}
			dragListener={false}
			dragControls={props.canEdit ? controls : undefined}
			className={itemCardClassName(props.item, props.showImage ?? true)}
		>
			<ItemCardBody
				{...props}
				dragHandle={
					<div
						onPointerDown={(event) => controls.start(event)}
						className="flex items-center justify-center hover:cursor-grab"
					>
						<GripIcon size={16} />
					</div>
				}
			/>
		</Reorder.Item>
	)
}

export const ItemRow = memo(ItemRowComponent)

export function ReorderableItemList({
	items,
	onReorder,
	...rowProps
}: {
	items: ListItemRecord[]
	onReorder: (items: ListItemRecord[]) => void
} & Omit<ItemCardProps, "item">) {
	return (
		<Reorder.Group values={items} onReorder={onReorder} className="flex flex-col gap-4">
			{items.map((item) => (
				<ItemRow key={item.id} item={item} {...rowProps} />
			))}
		</Reorder.Group>
	)
}
