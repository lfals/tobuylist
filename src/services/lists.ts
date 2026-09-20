'use server'

import db from "@/db/drizzle";
import { listItemsTable, listsTable, sharedListsTable } from "@/db/schema";
import { listCapabilities, type ListRoute } from "@/lib/listAccess";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
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

export type ListWithItems = typeof listsTable.$inferSelect & {
    items: (typeof listItemsTable.$inferSelect)[]
    totalValue: number
}

async function withItems(list: typeof listsTable.$inferSelect): Promise<ListWithItems> {
    const items = await db.select().from(listItemsTable).where(eq(listItemsTable.listId, list.id)).orderBy(listItemsTable.order, listItemsTable.isActive)
    const totalValue = items
        .filter((item) => item.isActive === 1)
        .reduce((acc, item) => acc + item.price * item.quantity, 0)
    return { ...list, items, totalValue }
}

export async function loadList(listId: string, route: ListRoute): Promise<ListWithItems | null> {
    const user = await currentUser()

    if (route === "owner") {
        const list = await db.select().from(listsTable).where(and(eq(listsTable.id, listId), eq(listsTable.userId, user?.id!)))
        if (!list.length) {
            return null
        }
        return withItems(list[0])
    }

    if (route === "share-link") {
        const list = await db.select().from(listsTable).where(and(eq(listsTable.id, listId), eq(listsTable.shared, 1)))
        if (!list.length) {
            return null
        }
        return withItems(list[0])
    }

    const bookmark = await db.select().from(sharedListsTable).where(and(eq(sharedListsTable.listId, listId), eq(sharedListsTable.userId, user?.id!)))
    if (!bookmark.length) {
        return null
    }
    const list = await db.select().from(listsTable).where(eq(listsTable.id, bookmark[0].listId))
    if (!list.length) {
        return null
    }
    return withItems(list[0])
}

export async function loadListView(listId: string, route: ListRoute) {
    const list = await loadList(listId, route)
    if (!list) {
        return null
    }
    const user = await currentUser()
    return {
        list,
        capabilities: listCapabilities({
            route,
            isOwner: list.userId === user?.id,
            isPublic: Boolean(list.public),
        }),
    }
}

export async function getListDashboard() {
    const user = await currentUser()
    const lists = await db.select().from(listsTable).where(and(eq(listsTable.userId, user?.id!), eq(listsTable.isActive, 1)))
    const empty = {
        lists: [] as { list: typeof listsTable.$inferSelect, totalValue: number, items: number }[],
        totalValue: 0,
        items: 0,
    }
    if (!lists.length) {
        return empty
    }

    const listItems = await db.select({
        listId: listItemsTable.listId,
        value: listItemsTable.price,
        quantity: listItemsTable.quantity,
    }).from(listItemsTable).where(inArray(listItemsTable.listId, lists.map((list) => list.id)))

    return lists.reduce((acc, list) => {
        const rows = listItems.filter((item) => item.listId === list.id)
        const totalValue = rows.reduce((sum, item) => sum + item.value * item.quantity, 0)
        acc.lists.push({ list, totalValue, items: rows.length })
        acc.totalValue += totalValue
        acc.items += rows.length
        return acc
    }, empty)
}


export async function duplicateList(listId: string) {
    const list = await loadList(listId, "owner")
    if (!list) {
        redirect("/app")
    }
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
    if (!sharedLists.length) {
        return []
    }
    return db.select().from(listsTable).where(inArray(listsTable.id, sharedLists.map(item => item.listId)))
}

export async function duplicateSharedList(listId: string) {
    const list = await loadList(listId, "share-link")
    if (!list) {
        redirect("/app")
    }
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

