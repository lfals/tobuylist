'use server'

import db from "@/db/drizzle"
import { listItemsTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export const deleteListItem = async (item: any) => {
    await db.delete(listItemsTable).where(eq(listItemsTable.id, item.id))
    revalidatePath(`/app/${item.listId}`)
}