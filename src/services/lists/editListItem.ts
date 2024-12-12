'use server'

import db from "@/db/drizzle"
import { listItemInsertSchema, listItemsTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export const editListItem = async (listId: number, data: z.infer<typeof listItemInsertSchema>) => {


    if (data.link && !data.store) {
        data.store = new URL(data.link).hostname.replace("www.", "").split(".")[0]
    }

    const listItem = await db.update(listItemsTable).set({ ...data, price: Number(data.price) }).where(eq(listItemsTable.id, data.id!)).returning()

    revalidatePath(`/app/${listId}`)
    return listItem
}

