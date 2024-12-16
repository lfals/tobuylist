'use server'

import db from "@/db/drizzle";
import { listItemsTable, listsTable } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from 'node:crypto'

export async function createList(list: Omit<typeof listsTable.$inferInsert, 'id' | 'userId'>) {
    const user = await currentUser()
    const uuid = randomUUID()
    const newList = await db.insert(listsTable).values({ ...list, userId: user?.id!, id: uuid }).returning()
    revalidatePath('/app')
    return newList[0]
}

export async function deleteList(listId: string) {
    await db.delete(listsTable).where(eq(listsTable.id, listId))
    await db.delete(listItemsTable).where(eq(listItemsTable.listId, listId))
    revalidatePath('/app')
}

export async function changeListVisibility(listId: string, isActive: 0 | 1) {
    await db.update(listsTable).set({ isActive }).where(eq(listsTable.id, listId))
    revalidatePath('/app')
    return
}

export async function getAll() {
    const user = await currentUser()
    const lists = await db.select().from(listsTable).where(eq(listsTable.userId, user?.id!))
    return lists;
}

export const getListDetails = async (listId: string) => {
    const user = await currentUser()

    const list = await db.select().from(listsTable).where(and(eq(listsTable.id, listId), eq(listsTable.userId, user?.id!)))
    const listItems = await db.select().from(listItemsTable).where(eq(listItemsTable.listId, listId))
    const totalValue = listItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
    return { ...list[0], items: listItems, totalValue }
}


export async function getListDashboard() {
    const user = await currentUser()
    const lists = await db.select().from(listsTable).where(eq(listsTable.userId, user?.id!))
    const newList = {
        lists: [] as { list: typeof listsTable.$inferSelect, totalValue: number, items: number }[],
        totalValue: 0,
        items: 0
    }
    for (const list of lists) {
        const listItems = await db.select({
            value: listItemsTable.price,
            quantity: listItemsTable.quantity
        }).from(listItemsTable).where(eq(listItemsTable.listId, list.id))
        const totalValue = listItems.reduce((acc, item) => acc + item.value * item.quantity, 0)
        newList.lists.push({ list, totalValue, items: listItems.length })
        newList.totalValue += totalValue
        newList.items += listItems.length
    }


    console.log(newList)

    return newList
}