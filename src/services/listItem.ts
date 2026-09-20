"use server"

import db from "@/db/drizzle"
import { listItemInsertSchema, listItemsTable } from "@/db/schema"
import { centsFromInput } from "@/lib/money"
import { storeFromUrl } from "@/lib/storeFromUrl"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { resolveItemImage } from "./itemImage"

export const createListItem = async (listId: string, data: z.infer<typeof listItemInsertSchema>) => {
	if (data.link && !data.store) {
		data.store = storeFromUrl(data.link)
	}

	if (data.imageUrl === "") {
		data.imageUrl = await resolveItemImage(data.name)
	}

	const price = typeof data.price === "number" ? data.price : centsFromInput(String(data.price ?? ""))
	const listItem = await db.insert(listItemsTable).values({ ...data, price, listId }).returning()

	revalidatePath(`/app/${listId}`)
	return listItem
}

export const deleteListItem = async (item: { id: number; listId: string }) => {
	await db.delete(listItemsTable).where(eq(listItemsTable.id, item.id))
	revalidatePath(`/app/${item.listId}`)
}

export const editListItem = async (listId: string, data: z.infer<typeof listItemInsertSchema>) => {
	if (data.link && !data.store) {
		data.store = storeFromUrl(data.link)
	}

	const price = typeof data.price === "number" ? data.price : centsFromInput(String(data.price ?? ""))
	const listItem = await db.update(listItemsTable).set({ ...data, price }).where(eq(listItemsTable.id, data.id!)).returning()

	revalidatePath(`/app/${listId}`)
	return listItem
}

export const markListItem = async (listId: string, itemId: number, isActive: number) => {
	await db.update(listItemsTable).set({ isActive }).where(eq(listItemsTable.id, itemId))
	revalidatePath(`/app/${listId}`)
}

export const reorderListItem = async (items: { id: number; order: number }[]) => {
	await db.transaction(async (tx) => {
		for (const item of items) {
			await tx.update(listItemsTable).set({ order: item.order }).where(eq(listItemsTable.id, item.id))
		}
	})
}
