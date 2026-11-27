import db from "@/db/drizzle"
import { itemLinksTable, listItemsTable, listsTable } from "@/db/schema"
import { json, requireApiUserId, requireList, route } from "@/lib/mobile-api"
import { attachLinks } from "@/services/item-links"
import { eq } from "drizzle-orm"
import { randomUUID } from "node:crypto"

type Context = { params: Promise<{ listId: string }> }

/** Duplica uma lista própria ou uma lista salva (cópia fica como lista própria). */
export const POST = route<Context>(async (_request, { params }) => {
	const userId = await requireApiUserId()
	const { listId } = await params
	const { list } = await requireList(listId, userId)

	const items = await attachLinks(await db.select().from(listItemsTable).where(eq(listItemsTable.listId, listId)))

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
		const created = await db
			.insert(listItemsTable)
			.values(items.map(({ id: _id, links: _links, ...rest }) => ({ ...rest, listId: copy.id })))
			.returning({ id: listItemsTable.id })

		const links = items.flatMap((item, index) =>
			item.links.map(({ id: _id, itemId: _itemId, ...rest }) => ({ ...rest, itemId: created[index].id })),
		)
		if (links.length > 0) {
			await db.insert(itemLinksTable).values(links)
		}
	}

	return json({ list: copy }, { status: 201 })
})
