"use server"

import db from "@/db/drizzle"
import { listItemsTable, listsTable } from "@/db/schema"
import { eq } from "drizzle-orm"

export const getListDetails = async (listId: number) => {
    const list = await db.select().from(listsTable).where(eq(listsTable.id, listId))
    const listItems = await db.select().from(listItemsTable).where(eq(listItemsTable.listId, listId))
    const totalValue = listItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
    return { ...list[0], items: listItems, totalValue }
}   