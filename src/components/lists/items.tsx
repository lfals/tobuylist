"use client"

import type { ListCapabilities } from "@/lib/listAccess"
import { reorderListItem } from "@/services/listItem"
import type { ListWithItems } from "@/services/lists"
import { Reorder } from "framer-motion"
import { useEffect, useState } from "react"
import ItemRow from "./item-row"

export default function Items({
	data,
	capabilities,
	showImage = true,
}: {
	data: ListWithItems
	capabilities: ListCapabilities
	showImage?: boolean
}) {
	const [items, setItems] = useState(data.items)
	const [debouncedItems, setDebouncedItems] = useState(data.items)

	useEffect(() => {
		const timeoutId = setTimeout(async () => {
			if (!capabilities.canReorder) {
				return
			}
			if (JSON.stringify(items) !== JSON.stringify(debouncedItems)) {
				const updatedItems = items.map((item, index) => ({
					id: item.id,
					order: index,
				}))
				await reorderListItem(updatedItems)
				setDebouncedItems(items)
			}
		}, 1000)

		return () => clearTimeout(timeoutId)
	}, [capabilities.canReorder, debouncedItems, items])

	useEffect(() => {
		setItems(data.items)
		setDebouncedItems(data.items)
	}, [data])

	return (
		<Reorder.Group values={items} onReorder={capabilities.canReorder ? setItems : () => undefined} className="flex flex-col gap-4">
			{items.map((item) => (
				<ItemRow item={item} key={item.id} capabilities={capabilities} showImage={showImage} />
			))}
		</Reorder.Group>
	)
}
