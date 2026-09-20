"use server"

import db from "@/db/drizzle"
import { listItemInsertSchema, listItemsTable } from "@/db/schema"
import { centsFromInput } from "@/lib/money"
import { storeFromUrl } from "@/lib/storeFromUrl"
import { resolveWriteAccess } from "@/services/listLoad"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { resolveItemImage } from "./itemImage"

function centsOf(price: unknown) {
	return typeof price === "number" ? price : centsFromInput(String(price ?? ""))
}

async function requireItemWrite(listId: string, action: "add" | "edit" | "reorder") {
	const capabilities = await resolveWriteAccess(listId)
	const allowed =
		action === "add"
			? capabilities?.canAddItem
			: action === "reorder"
				? capabilities?.canReorder
				: capabilities?.canEditItem

	if (!allowed) {
		throw new Error("Unauthorized")
	}

	return capabilities
}

export const createListItem = async (listId: string, data: z.infer<typeof listItemInsertSchema>) => {
	await requireItemWrite(listId, "add")

	if (data.link && !data.store) {
		data.store = storeFromUrl(data.link)
	}

	if (data.imageUrl === "") {
		data.imageUrl = await resolveItemImage(data.name)
	}

	const listItem = await db.insert(listItemsTable).values({ ...data, price: centsOf(data.price), listId }).returning()

	revalidatePath(`/app/${listId}`)
	return listItem
}

export const deleteListItem = async (item: { id: number; listId: string }) => {
	await requireItemWrite(item.listId, "edit")
	await db.delete(listItemsTable).where(eq(listItemsTable.id, item.id))
	revalidatePath(`/app/${item.listId}`)
}

export const editListItem = async (listId: string, data: z.infer<typeof listItemInsertSchema>) => {
	await requireItemWrite(listId, "edit")

	if (data.link && !data.store) {
		data.store = storeFromUrl(data.link)
	}

	const listItem = await db
		.update(listItemsTable)
		.set({ ...data, price: centsOf(data.price) })
		.where(eq(listItemsTable.id, data.id!))
		.returning()

	revalidatePath(`/app/${listId}`)
	return listItem
}

export const markListItem = async (listId: string, itemId: number, isActive: number) => {
	await requireItemWrite(listId, "edit")
	await db.update(listItemsTable).set({ isActive }).where(eq(listItemsTable.id, itemId))
	revalidatePath(`/app/${listId}`)
}

export const reorderListItem = async (items: { id: number; order: number }[]) => {
	if (items.length === 0) {
		return
	}

	const first = items[0]
	const existing = await db.select({ listId: listItemsTable.listId }).from(listItemsTable).where(eq(listItemsTable.id, first.id)).limit(1)
	if (!existing.length) {
		throw new Error("Unauthorized")
	}

	await requireItemWrite(existing[0].listId, "reorder")

	await db.transaction(async (tx) => {
		for (const item of items) {
			await tx.update(listItemsTable).set({ order: item.order }).where(eq(listItemsTable.id, item.id))
		}
	})
}
