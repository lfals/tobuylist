"use client"

import { deleteListItem, editListItem, getItemImage, markListItem, reorderListItem } from "@/services/listItem"
import type { ListItemRecord } from "@/types/list"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { DeleteItemDialog, EditItemDialog } from "./item-dialogs"
import { StaticItemRow } from "./item-card"

const ReorderableItemList = dynamic(() =>
	import("./item-row").then((mod) => mod.ReorderableItemList),
)

function orderSignature(items: ListItemRecord[]) {
	return items.map((item) => item.id).join(",")
}

export default function Items({
	items: initialItems,
	listId,
	canEdit,
	showImage = true,
}: {
	items: ListItemRecord[]
	listId: string
	canEdit: boolean
	showImage?: boolean
}) {
	const [items, setItems] = useState(initialItems)
	const [editingItem, setEditingItem] = useState<ListItemRecord | null>(null)
	const [deletingItem, setDeletingItem] = useState<ListItemRecord | null>(null)
	const lastSavedOrder = useRef(orderSignature(initialItems))
	const persistTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
	const [, startMarking] = useTransition()

	useEffect(() => {
		setItems(initialItems)
		lastSavedOrder.current = orderSignature(initialItems)
	}, [initialItems])

	const handleMark = useCallback((current: ListItemRecord) => {
		startMarking(async () => {
			await markListItem(listId, current.id, current.isActive ? 0 : 1)
		})
	}, [listId, startMarking])

	const handleImageError = useCallback((current: ListItemRecord) => {
		void (async () => {
			const imageUrl = await getItemImage(current.name, true)
			await editListItem(listId, {
				...current,
				price: String(current.price),
				imageUrl,
			})
		})()
	}, [listId])

	function handleReorder(nextItems: ListItemRecord[]) {
		setItems(nextItems)
		if (!canEdit) {
			return
		}

		clearTimeout(persistTimer.current)
		persistTimer.current = setTimeout(() => {
			const signature = orderSignature(nextItems)
			if (signature === lastSavedOrder.current) {
				return
			}
			lastSavedOrder.current = signature
			void reorderListItem(nextItems.map((item, index) => ({ id: item.id, order: index })))
		}, 1000)
	}

	const rowProps = {
		canEdit,
		showImage,
		onEdit: setEditingItem,
		onDelete: setDeletingItem,
		onMark: handleMark,
		onImageError: showImage ? handleImageError : undefined,
	}

	return (
		<>
			{canEdit ? (
				<ReorderableItemList items={items} onReorder={handleReorder} {...rowProps} />
			) : (
				<div className="flex flex-col gap-4">
					{items.map((item) => (
						<StaticItemRow key={item.id} item={item} {...rowProps} />
					))}
				</div>
			)}
			{canEdit ? (
				<>
					<EditItemDialog
						item={editingItem}
						listId={listId}
						open={Boolean(editingItem)}
						showImageUrl={showImage}
						onOpenChange={(open) => {
							if (!open) {
								setEditingItem(null)
							}
						}}
					/>
					<DeleteItemDialog
						item={deletingItem}
						open={Boolean(deletingItem)}
						onOpenChange={(open) => {
							if (!open) {
								setDeletingItem(null)
							}
						}}
					/>
				</>
			) : null}
		</>
	)
}
