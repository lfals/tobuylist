'use server'

import db from "@/db/drizzle";
import { listItemsTable, listsTable, sharedListsTable } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from 'node:crypto'

export async function editList(list: Omit<typeof listsTable.$inferInsert, 'id' | 'userId'>, listId: string) {
    const user = await currentUser()
    await db.update(listsTable).set({ ...list }).where(and(eq(listsTable.id, listId), eq(listsTable.userId, user?.id!)))
    revalidatePath(`/app/${listId}`)
    revalidatePath(`/app`)
    return
}

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
    if (!list.length) {
        redirect('/app')
    }
    const listItems = await db.select().from(listItemsTable).where(eq(listItemsTable.listId, list[0].id)).orderBy(listItemsTable.order, listItemsTable.isActive)
    const listItemsTotal = await db.select().from(listItemsTable).where(and(eq(listItemsTable.listId, listId), eq(listItemsTable.isActive, 1)))
    const totalValue = listItemsTotal.reduce((acc, item) => acc + item.price * item.quantity, 0)
    return { ...list[0], items: listItems, totalValue }
}


export async function getListDashboard() {
    const user = await currentUser()
    const lists = await db.select().from(listsTable).where(and(eq(listsTable.userId, user?.id!), eq(listsTable.isActive, 1)))
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



    return newList
}


export async function duplicateList(listId: string) {
    const list = await getListDetails(listId)
    const newList = await createList({ ...list, name: `${list.name} - Copia` })

    const newListItems = list.items.map(item => {
        const { id, ...rest } = item
        return { ...rest, listId: newList.id }
    })
    await db.insert(listItemsTable).values(newListItems)


    revalidatePath(`/app`)
    redirect(`/app/${newList.id}`)
}

export async function shareList(listId: string, isPublic: boolean) {
    await db.update(listsTable).set({ public: isPublic ? 1 : 0, shared: 1 }).where(eq(listsTable.id, listId))
    revalidatePath(`/app/${listId}`)
    revalidatePath(`/app`)
}

export async function getSharedList(listId: string) {

    const list = await db.select().from(listsTable).where(and(eq(listsTable.id, listId), eq(listsTable.shared, 1)))
    if (!list.length) {
        redirect('/app')
    }
    const listItems = await db.select().from(listItemsTable).where(and(eq(listItemsTable.listId, list[0].id))).orderBy(asc(listItemsTable.order))
    const listItemsTotal = await db.select().from(listItemsTable).where(and(eq(listItemsTable.listId, listId), eq(listItemsTable.isActive, 1)))
    const totalValue = listItemsTotal.reduce((acc, item) => acc + item.price * item.quantity, 0)
    return { ...list[0], items: listItems, totalValue }

}

export async function saveList(listId: string) {
    const user = await currentUser()
    await db.insert(sharedListsTable).values({ id: randomUUID(), listId, userId: user?.id! })

    revalidatePath(`/app/${listId}`)
    revalidatePath(`/app`)
    revalidatePath(`/app/${listId}/shared`)
    redirect(`/app/${listId}/shared`)
}

export async function getSharedLists() {
    const user = await currentUser()
    const sharedLists = await db.select().from(sharedListsTable).where(eq(sharedListsTable.userId, user?.id!))
    const lists = await db.select().from(listsTable).where(inArray(listsTable.id, sharedLists.map(item => item.listId)))
    return lists
}

export async function duplicateSharedList(listId: string) {
    const list = await getSharedList(listId)
    const newList = await createList({ ...list, name: `${list.name} - Copia` })

    const newListItems = list.items.map(item => {
        const { id, ...rest } = item
        return { ...rest, listId: newList.id }
    })
    await db.insert(listItemsTable).values(newListItems)


    revalidatePath(`/app`)
    redirect(`/app/${newList.id}`)
}

export async function deleteSharedList(listId: string) {
    await db.delete(sharedListsTable).where(eq(sharedListsTable.listId, listId))

    revalidatePath(`/app`)
    revalidatePath(`/app/${listId}/shared`)
    revalidatePath(`/app/${listId}`)
}

export const getSharedListDetails = async (listId: string) => {
    const user = await currentUser()

    const sharedList = await db.select().from(sharedListsTable).where(and(eq(sharedListsTable.listId, listId), eq(sharedListsTable.userId, user?.id!)))
    if (!sharedList.length) {
        redirect('/app')
    }
    const list = await db.select().from(listsTable).where(eq(listsTable.id, sharedList[0].listId))
    if (!list.length) {
        redirect('/app')
    }
    const listItems = await db.select().from(listItemsTable).where(eq(listItemsTable.listId, list[0].id)).orderBy(asc(listItemsTable.order))
    const listItemsTotal = await db.select().from(listItemsTable).where(and(eq(listItemsTable.listId, listId), eq(listItemsTable.isActive, 1)))
    const totalValue = listItemsTotal.reduce((acc, item) => acc + item.price * item.quantity, 0)
    return { ...list[0], items: listItems, totalValue }
}
