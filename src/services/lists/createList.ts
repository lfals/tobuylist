'use server'

import db from "@/db/drizzle";
import { listsTable } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function createList(list: typeof listsTable.$inferInsert) {
    const newList = await db.insert(listsTable).values(list).returning()
    revalidatePath('/app')
    return newList[0]
}