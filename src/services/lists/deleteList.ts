'use server'

import db from "@/db/drizzle";
import { listsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";


export async function deleteList(listId: number) {
    await db.delete(listsTable).where(eq(listsTable.id, listId))
    revalidatePath('/app')
}