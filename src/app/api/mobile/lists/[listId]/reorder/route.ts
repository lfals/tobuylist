import db from "@/db/drizzle"
import { listItemsTable } from "@/db/schema"
import { json, readJson, requireApiUserId, requireEditableList, route } from "@/lib/mobile-api"
import { and, eq } from "drizzle-orm"
import { z } from "zod"

type Context = { params: Promise<{ listId: string }> }

const schema = z.object({
	items: z.array(z.object({ id: z.number().int(), order: z.number().int().min(0) })).max(500),
})

export const POST = route<Context>(async (request, { params }) => {
	const userId = await requireApiUserId()
	const { listId } = await params
	await requireEditableList(listId, userId)

	const { items } = schema.parse(await readJson(request))
	await Promise.all(
		items.map((item) =>
			db
				.update(listItemsTable)
				.set({ order: item.order })
				.where(and(eq(listItemsTable.id, item.id), eq(listItemsTable.listId, listId))),
		),
	)

	return json({ ok: true })
})
