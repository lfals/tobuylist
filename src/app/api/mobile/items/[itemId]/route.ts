import db from "@/db/drizzle"
import { listItemsTable } from "@/db/schema"
import { itemInputSchema } from "@/lib/mobile-items"
import { json, parseId, readJson, requireApiUserId, requireEditableItem, route } from "@/lib/mobile-api"
import { reconcileEdit } from "@/lib/price-refresh"
import { storeFromUrl } from "@/lib/storeFromUrl"
import { eq } from "drizzle-orm"
import { z } from "zod"

type Context = { params: Promise<{ itemId: string }> }

const patchSchema = itemInputSchema.partial().extend({
	isActive: z.union([z.literal(0), z.literal(1)]).optional(),
})

export const PATCH = route<Context>(async (request, { params }) => {
	const userId = await requireApiUserId()
	const itemId = parseId((await params).itemId, "item")
	const { item: before } = await requireEditableItem(itemId, userId)

	const data = patchSchema.parse(await readJson(request))
	const store = data.store || (data.link ? storeFromUrl(data.link) : undefined)

	const values = {
		...(data.name !== undefined ? { name: data.name } : {}),
		...(data.link !== undefined ? { link: data.link || null } : {}),
		...(data.store !== undefined || store !== undefined ? { store: store || null } : {}),
		...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl || null } : {}),
		...(data.price !== undefined ? { price: data.price } : {}),
		...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
		...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
	}

	const [updated] = await db.update(listItemsTable).set(values).where(eq(listItemsTable.id, itemId)).returning()
	const item = await reconcileEdit(itemId, before, updated)

	return json({ item })
})

export const DELETE = route<Context>(async (_request, { params }) => {
	const userId = await requireApiUserId()
	const itemId = parseId((await params).itemId, "item")
	await requireEditableItem(itemId, userId)

	await db.delete(listItemsTable).where(eq(listItemsTable.id, itemId))
	return json({ ok: true })
})
