"use client"

import { Reorder } from "framer-motion"
import { getListDetails } from "@/services/lists"
import Body from "./body"
import { useEffect, useState } from "react"
import { reorderListItem } from "@/services/listItem"

export default function Items({ data }: { data: Awaited<ReturnType<typeof getListDetails>> }) {
    const [items, setItems] = useState(data?.items)
    const [debouncedItems, setDebouncedItems] = useState(items)



    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (JSON.stringify(items) !== JSON.stringify(debouncedItems)) {
                const updatedItems = items.map((item, index) => ({
                    ...item,
                    order: index
                }))
                await reorderListItem(updatedItems)
                setDebouncedItems(updatedItems)
            }
        }, 1000)

        return () => clearTimeout(timeoutId)
    }, [items])



    return (
        <>
            <Reorder.Group values={items} onReorder={setItems} className="flex flex-col gap-4">
                {items.map((item) => (
                    <Body item={item} key={item.id} isPublic={Boolean(data.public)} />
                ))}
            </Reorder.Group>
        </>
    )
}