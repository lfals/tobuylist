'use server'

import db from "@/db/drizzle";
import { listItemsTable, listsTable } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
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


    return lists
}