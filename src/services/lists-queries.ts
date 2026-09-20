import db from "@/db/drizzle"
import { listItemsTable, listsTable, sharedListsTable } from "@/db/schema"
import { requireUserId } from "@/lib/current-user"
import type { ListDashboard, ListDetails, ListItemRecord, ListSummary, SidebarList } from "@/types/list"
import { and, asc, eq, sql } from "drizzle-orm"
import { cache } from "react"

function totalFromItems(items: { price: number; quantity: number; isActive: number }[]) {
	let total = 0
	for (const item of items) {
		if (item.isActive) {
			total += item.price * item.quantity
		}
	}
	return total
}

const activeTotalSql = sql<number>`coalesce(sum(case when ${listItemsTable.isActive} = 1 then ${listItemsTable.price} * ${listItemsTable.quantity} else 0 end), 0)`
const itemCountSql = sql<number>`count(${listItemsTable.id})`

const listSummaryColumns = {
	id: listsTable.id,
	name: listsTable.name,
	description: listsTable.description,
	public: listsTable.public,
	userId: listsTable.userId,
}

const sidebarListColumns = {
	id: listsTable.id,
	name: listsTable.name,
	isActive: listsTable.isActive,
}

function toSummary(row: ListSummary): ListSummary {
	return {
		id: row.id,
		name: row.name,
		description: row.description,
		public: row.public,
		userId: row.userId,
		totalValue: Number(row.totalValue ?? 0),
	}
}

export const getAll = cache(async (): Promise<SidebarList[]> => {
	const userId = await requireUserId()
	return db.select(sidebarListColumns).from(listsTable).where(eq(listsTable.userId, userId))
})

export const getListSummary = cache(async (listId: string): Promise<ListSummary | null> => {
	const userId = await requireUserId()
	const rows = await db
		.select({
			...listSummaryColumns,
			totalValue: activeTotalSql,
		})
		.from(listsTable)
		.leftJoin(listItemsTable, eq(listItemsTable.listId, listsTable.id))
		.where(and(eq(listsTable.id, listId), eq(listsTable.userId, userId)))
		.groupBy(listsTable.id, listsTable.name, listsTable.description, listsTable.public, listsTable.userId)
		.limit(1)

	if (!rows.length) {
		return null
	}

	return toSummary(rows[0])
})

export const getListItems = cache(async (listId: string): Promise<ListItemRecord[] | null> => {
	const userId = await requireUserId()
	const [owned, items] = await Promise.all([
		db
			.select({ id: listsTable.id })
			.from(listsTable)
			.where(and(eq(listsTable.id, listId), eq(listsTable.userId, userId)))
			.limit(1),
		db
			.select()
			.from(listItemsTable)
			.where(eq(listItemsTable.listId, listId))
			.orderBy(listItemsTable.order, listItemsTable.isActive),
	])

	if (!owned.length) {
		return null
	}

	return items
})

export const getListDetails = cache(async (listId: string): Promise<ListDetails | null> => {
	const userId = await requireUserId()
	const [list, items] = await Promise.all([
		db
			.select()
			.from(listsTable)
			.where(and(eq(listsTable.id, listId), eq(listsTable.userId, userId)))
			.limit(1),
		db
			.select()
			.from(listItemsTable)
			.where(eq(listItemsTable.listId, listId))
			.orderBy(listItemsTable.order, listItemsTable.isActive),
	])

	if (!list.length) {
		return null
	}

	return { ...list[0], items, totalValue: totalFromItems(items) }
})

export const getListDashboard = cache(async (): Promise<ListDashboard> => {
	const userId = await requireUserId()
	const lists = await db
		.select({
			id: listsTable.id,
			name: listsTable.name,
			description: listsTable.description,
			totalValue: activeTotalSql,
			items: itemCountSql,
		})
		.from(listsTable)
		.leftJoin(listItemsTable, eq(listItemsTable.listId, listsTable.id))
		.where(and(eq(listsTable.userId, userId), eq(listsTable.isActive, 1)))
		.groupBy(listsTable.id, listsTable.name, listsTable.description)

	const dashboardLists = lists.map((list) => ({
		...list,
		totalValue: Number(list.totalValue ?? 0),
		items: Number(list.items ?? 0),
	}))

	let totalValue = 0
	let items = 0
	for (const card of dashboardLists) {
		totalValue += card.totalValue
		items += card.items
	}

	return { lists: dashboardLists, totalValue, items }
})

export const getSharedListSummary = cache(async (listId: string): Promise<ListSummary | null> => {
	const rows = await db
		.select({
			...listSummaryColumns,
			totalValue: activeTotalSql,
		})
		.from(listsTable)
		.leftJoin(listItemsTable, eq(listItemsTable.listId, listsTable.id))
		.where(and(eq(listsTable.id, listId), eq(listsTable.shared, 1)))
		.groupBy(listsTable.id, listsTable.name, listsTable.description, listsTable.public, listsTable.userId)
		.limit(1)

	if (!rows.length) {
		return null
	}

	return toSummary(rows[0])
})

export const getSharedListItems = cache(async (listId: string): Promise<ListItemRecord[] | null> => {
	const [shared, items] = await Promise.all([
		db
			.select({ id: listsTable.id })
			.from(listsTable)
			.where(and(eq(listsTable.id, listId), eq(listsTable.shared, 1)))
			.limit(1),
		db
			.select()
			.from(listItemsTable)
			.where(eq(listItemsTable.listId, listId))
			.orderBy(asc(listItemsTable.order)),
	])

	if (!shared.length) {
		return null
	}

	return items
})

export const getSharedList = cache(async (listId: string): Promise<ListDetails | null> => {
	const [list, items] = await Promise.all([
		db
			.select()
			.from(listsTable)
			.where(and(eq(listsTable.id, listId), eq(listsTable.shared, 1)))
			.limit(1),
		db
			.select()
			.from(listItemsTable)
			.where(eq(listItemsTable.listId, listId))
			.orderBy(asc(listItemsTable.order)),
	])

	if (!list.length) {
		return null
	}

	return { ...list[0], items, totalValue: totalFromItems(items) }
})

export const getSharedLists = cache(async (): Promise<SidebarList[]> => {
	const userId = await requireUserId()
	const rows = await db
		.select(sidebarListColumns)
		.from(sharedListsTable)
		.innerJoin(listsTable, eq(sharedListsTable.listId, listsTable.id))
		.where(eq(sharedListsTable.userId, userId))

	return rows
})

export const getSharedListDetailsSummary = cache(async (listId: string): Promise<ListSummary | null> => {
	const userId = await requireUserId()
	const rows = await db
		.select({
			...listSummaryColumns,
			totalValue: activeTotalSql,
		})
		.from(sharedListsTable)
		.innerJoin(listsTable, eq(sharedListsTable.listId, listsTable.id))
		.leftJoin(listItemsTable, eq(listItemsTable.listId, listsTable.id))
		.where(and(eq(sharedListsTable.listId, listId), eq(sharedListsTable.userId, userId)))
		.groupBy(listsTable.id, listsTable.name, listsTable.description, listsTable.public, listsTable.userId)
		.limit(1)

	if (!rows.length) {
		return null
	}

	return toSummary(rows[0])
})

export const getSharedListDetailsItems = cache(async (listId: string): Promise<ListItemRecord[] | null> => {
	const userId = await requireUserId()
	const [sharedList, items] = await Promise.all([
		db
			.select({ listId: sharedListsTable.listId })
			.from(sharedListsTable)
			.where(and(eq(sharedListsTable.listId, listId), eq(sharedListsTable.userId, userId)))
			.limit(1),
		db
			.select()
			.from(listItemsTable)
			.where(eq(listItemsTable.listId, listId))
			.orderBy(asc(listItemsTable.order)),
	])

	if (!sharedList.length) {
		return null
	}

	return items
})
