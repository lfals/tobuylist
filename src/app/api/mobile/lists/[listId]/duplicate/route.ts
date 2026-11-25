import db from "@/db/drizzle"
import { listItemsTable, listsTable } from "@/db/schema"
import { json, requireApiUserId, requireList, route } from "@/lib/mobile-api"
import { eq } from "drizzle-orm"
import { randomUUID } from "node:crypto"

type Context = { params: Promise<{ listId: string }> }

/** Duplica uma lista própria ou uma lista salva (cópia fica como lista própria). */
export const POST = route<Context>(async (_request, { params }) => {
	const userId = await requireApiUserId()
	const { listId } = await params
	const { list } = await requireList(listId, userId)

	const items = await db.select().from(listItemsTable).where(eq(listItemsTable.listId, listId))

	const [copy] = await db
		.insert(listsTable)
		.values({
			id: randomUUID(),
			userId,
			name: `${list.name} - Copia`,
			description: list.description,
			isActive: list.isActive,
		})
		.returning()

	if (items.length > 0) {
		await db.insert(listItemsTable).values(
			items.map(({ id: _id, ...rest }) => ({ ...rest, listId: copy.id })),
		)
	}

	return json({ list: copy }, { status: 201 })
})
