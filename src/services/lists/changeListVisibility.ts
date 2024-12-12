'use server'

import db from "@/db/drizzle";
import { listsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function changeListVisibility(listId: number, isActive: 0 | 1) {
    await db.update(listsTable).set({ isActive }).where(eq(listsTable.id, listId))
    revalidatePath('/app')
    return
}