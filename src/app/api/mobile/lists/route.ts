import db from "@/db/drizzle"
import { listItemsTable, listsTable, sharedListsTable } from "@/db/schema"
import { json, readJson, requireApiUserId, route } from "@/lib/mobile-api"
import { eq, sql } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import { z } from "zod"

const activeTotalSql = sql<number>`coalesce(sum(case when ${listItemsTable.isActive} = 1 then ${listItemsTable.price} * ${listItemsTable.quantity} else 0 end), 0)`
const itemCountSql = sql<number>`count(${listItemsTable.id})`

const listColumns = {
	id: listsTable.id,
	name: listsTable.name,
	description: listsTable.description,
	isActive: listsTable.isActive,
	public: listsTable.public,
	totalValue: activeTotalSql,
	items: itemCountSql,
}

function normalize<T extends { totalValue: unknown; items: unknown }>(row: T) {
	return { ...row, totalValue: Number(row.totalValue ?? 0), items: Number(row.items ?? 0) }
}

/** Lista do usuário (com totais) e listas salvas de outras pessoas. */
export const GET = route(async () => {
	const userId = await requireApiUserId()

	const [own, saved] = await Promise.all([
		db
			.select(listColumns)
			.from(listsTable)
			.leftJoin(listItemsTable, eq(listItemsTable.listId, listsTable.id))
			.where(eq(listsTable.userId, userId))
			.groupBy(listsTable.id),
		db
			.select(listColumns)
			.from(sharedListsTable)
			.innerJoin(listsTable, eq(sharedListsTable.listId, listsTable.id))
			.leftJoin(listItemsTable, eq(listItemsTable.listId, listsTable.id))
			.where(eq(sharedListsTable.userId, userId))
			.groupBy(listsTable.id),
	])

	const lists = own.map(normalize)
	const activeLists = lists.filter((list) => list.isActive)

	return json({
		lists,
		savedLists: saved.map(normalize),
		totals: {
			value: activeLists.reduce((sum, list) => sum + list.totalValue, 0),
			items: activeLists.reduce((sum, list) => sum + list.items, 0),
			lists: activeLists.length,
		},
	})
})

const createSchema = z.object({
	name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres.").max(50),
	description: z.string().trim().max(50).optional(),
})

export const POST = route(async (request) => {
	const userId = await requireApiUserId()
	const body = createSchema.parse(await readJson(request))

	const [list] = await db
		.insert(listsTable)
		.values({ name: body.name, description: body.description || null, userId, id: randomUUID() })
		.returning()

	return json({ list }, { status: 201 })
})
