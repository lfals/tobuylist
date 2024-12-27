"use client"

import { Reorder } from "framer-motion"
import { getListDetails, getSharedListDetails } from "@/services/lists"
import Body from "./body"
import { useEffect, useState } from "react"
import { reorderListItem } from "@/services/listItem"

export default function Items({ data }: { data: Awaited<ReturnType<typeof getListDetails>> | Awaited<ReturnType<typeof getSharedListDetails>> }) {
    const [items, setItems] = useState(data?.items)
    const [debouncedItems, setDebouncedItems] = useState(items)


    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (JSON.stringify(items) !== JSON.stringify(debouncedItems)) {
                const updatedItems = items.map((item, index) => ({
                    ...item,
                    order: index
                }))
                console.log(updatedItems)
                await reorderListItem(updatedItems)
                setDebouncedItems(updatedItems)
            }
        }, 1000)

        return () => clearTimeout(timeoutId)
    }, [items])

    useEffect(() => {
        setItems(data?.items)
    }, [data])



    return (
        <>
            <Reorder.Group values={items} onReorder={setItems} className="flex flex-col gap-4">
                {items.map((item) => (
                    <Body item={item} key={item.id} />
                ))}
            </Reorder.Group>
        </>
    )
}