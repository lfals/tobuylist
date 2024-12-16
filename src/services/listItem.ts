'use server'

import db from "@/db/drizzle"
import { listItemInsertSchema, listItemsTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export const createListItem = async (listId: string, data: z.infer<typeof listItemInsertSchema>) => {


    if (data.link && !data.store) {
        data.store = new URL(data.link).hostname
    }

    const listItem = await db.insert(listItemsTable).values({ ...data, price: Number(data.price), listId }).returning()

    revalidatePath(`/app/${listId}`)
    return listItem
}


export const deleteListItem = async (item: any) => {
    await db.delete(listItemsTable).where(eq(listItemsTable.id, item.id))
    revalidatePath(`/app/${item.listId}`)
}


export const editListItem = async (listId: string, data: z.infer<typeof listItemInsertSchema>) => {

    if (data.link && !data.store) {
        data.store = new URL(data.link).hostname.replace("www.", "").split(".")[0]
    }

    const listItem = await db.update(listItemsTable).set({ ...data, price: Number(data.price.replace("R$ ", "").replace(",", "").replace(".", "")) }).where(eq(listItemsTable.id, data.id!)).returning()

    revalidatePath(`/app/${listId}`)
    return listItem
}

