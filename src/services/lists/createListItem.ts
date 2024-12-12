'use server'

import db from "@/db/drizzle"
import { listItemInsertSchema, listItemsTable } from "@/db/schema"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export const createListItem = async (listId: number, data: z.infer<typeof listItemInsertSchema>) => {


    if (data.link && !data.store) {
        data.store = new URL(data.link).hostname
    }

    const listItem = await db.insert(listItemsTable).values({ ...data, price: Number(data.price), listId }).returning()

    revalidatePath(`/app/${listId}`)
    return listItem
}

