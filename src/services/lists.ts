'use server'

import db from "@/db/drizzle";
import { listItemsTable, listsTable, sharedListsTable } from "@/db/schema";
import { requireUserId } from "@/lib/current-user";
import { getListDetails, getSharedList } from "@/services/lists-queries";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from 'node:crypto'

export async function editList(list: Omit<typeof listsTable.$inferInsert, 'id' | 'userId'>, listId: string) {
    const userId = await requireUserId()
    await db.update(listsTable).set({ ...list }).where(and(eq(listsTable.id, listId), eq(listsTable.userId, userId)))
    revalidatePath(`/app/${listId}`)
    revalidatePath(`/app`)
    return
}

export async function createList(list: Omit<typeof listsTable.$inferInsert, 'id' | 'userId'>) {
    const userId = await requireUserId()
    const uuid = randomUUID()
    const newList = await db.insert(listsTable).values({ ...list, userId, id: uuid }).returning()
    revalidatePath('/app')
    return newList[0]
}

export async function deleteList(listId: string) {
    const userId = await requireUserId()
    await Promise.all([
        db.delete(listsTable).where(and(eq(listsTable.id, listId), eq(listsTable.userId, userId))),
        db.delete(listItemsTable).where(eq(listItemsTable.listId, listId)),
    ])
    revalidatePath('/app')
}

export async function changeListVisibility(listId: string, isActive: 0 | 1) {
    const userId = await requireUserId()
    await db.update(listsTable).set({ isActive }).where(and(eq(listsTable.id, listId), eq(listsTable.userId, userId)))
    revalidatePath('/app')
    return
}

export async function duplicateList(listId: string) {
    const list = await getListDetails(listId)
    if (!list) {
        redirect('/app')
    }
    const newList = await createList({
        name: `${list.name} - Copia`,
        description: list.description,
        isActive: list.isActive,
        public: list.public,
        shared: list.shared,
    })

    const newListItems = list.items.map(item => {
        const { id, ...rest } = item
        return { ...rest, listId: newList.id }
    })
    if (newListItems.length > 0) {
        await db.insert(listItemsTable).values(newListItems)
    }

    revalidatePath(`/app`)
    redirect(`/app/${newList.id}`)
}

export async function shareList(listId: string, isPublic: boolean) {
    const userId = await requireUserId()
    await db.update(listsTable).set({ public: isPublic ? 1 : 0, shared: 1 }).where(and(eq(listsTable.id, listId), eq(listsTable.userId, userId)))
    revalidatePath(`/app/${listId}`)
    revalidatePath(`/app`)
}

export async function saveList(listId: string) {
    const userId = await requireUserId()
    await db.insert(sharedListsTable).values({ id: randomUUID(), listId, userId })

    revalidatePath(`/app/${listId}`)
    revalidatePath(`/app`)
    revalidatePath(`/app/${listId}/shared`)
    redirect(`/app/${listId}/shared`)
}

export async function duplicateSharedList(listId: string) {
    const list = await getSharedList(listId)
    if (!list) {
        redirect('/app')
    }
    const newList = await createList({
        name: `${list.name} - Copia`,
        description: list.description,
        isActive: list.isActive,
        public: list.public,
        shared: list.shared,
    })

    const newListItems = list.items.map(item => {
        const { id, ...rest } = item
        return { ...rest, listId: newList.id }
    })
    if (newListItems.length > 0) {
        await db.insert(listItemsTable).values(newListItems)
    }

    revalidatePath(`/app`)
    redirect(`/app/${newList.id}`)
}

export async function deleteSharedList(listId: string) {
    const userId = await requireUserId()
    await db.delete(sharedListsTable).where(and(eq(sharedListsTable.listId, listId), eq(sharedListsTable.userId, userId)))

    revalidatePath(`/app`)
    revalidatePath(`/app/${listId}/shared`)
    revalidatePath(`/app/${listId}`)
}