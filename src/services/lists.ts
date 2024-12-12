'use server'

import db from "@/db/drizzle";
import { listItemsTable, listsTable } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createList(list: typeof listsTable.$inferInsert) {
    const newList = await db.insert(listsTable).values(list).returning()
    return newList[0]
}

export async function deleteList(listId: number) {
    await db.delete(listsTable).where(eq(listsTable.id, listId))
    await db.delete(listItemsTable).where(eq(listItemsTable.listId, listId))
    revalidatePath('/app')
}

export async function changeListVisibility(listId: number, isActive: 0 | 1) {
    await db.update(listsTable).set({ isActive }).where(eq(listsTable.id, listId))
    revalidatePath('/app')
    return
}

export async function getAll() {
    const user = await currentUser()
    const lists = await db.select().from(listsTable).where(eq(listsTable.userId, user?.id!))
    return lists;
}

export const getListDetails = async (listId: number) => {
    const list = await db.select().from(listsTable).where(eq(listsTable.id, listId))
    const listItems = await db.select().from(listItemsTable).where(eq(listItemsTable.listId, listId))
    const totalValue = listItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
    return { ...list[0], items: listItems, totalValue }
}


export async function getListDashboard() {
    const user = await currentUser()
    const lists = await db.select().from(listsTable).where(eq(listsTable.userId, user?.id!))


    return lists
}