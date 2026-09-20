import db from "@/db/drizzle"
import { listItemsTable, listsTable, sharedListsTable } from "@/db/schema"
import { getCurrentUser, requireUserId } from "@/lib/current-user"
import {
	listCapabilities,
	listRelationship,
	routeForRelationship,
	type ListRoute,
} from "@/lib/listAccess"
import { totalCents } from "@/lib/listTotal"
import type { ListDashboard, ListDetails, ListItemRecord, ListSummary, SidebarList } from "@/types/list"
import { and, eq, sql } from "drizzle-orm"
import { cache } from "react"

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

async function listIsVisible(listId: string, route: ListRoute) {
	if (route === "owner") {
		const userId = await requireUserId()
		const rows = await db
			.select({ id: listsTable.id })
			.from(listsTable)
			.where(and(eq(listsTable.id, listId), eq(listsTable.userId, userId)))
			.limit(1)
		return rows.length > 0
	}

	if (route === "share-link") {
		const rows = await db
			.select({ id: listsTable.id })
			.from(listsTable)
			.where(and(eq(listsTable.id, listId), eq(listsTable.shared, 1)))
			.limit(1)
		return rows.length > 0
	}

	const userId = await requireUserId()
	const rows = await db
		.select({ listId: sharedListsTable.listId })
		.from(sharedListsTable)
		.where(and(eq(sharedListsTable.listId, listId), eq(sharedListsTable.userId, userId)))
		.limit(1)
	return rows.length > 0
}

const loadSummaryQuery = cache(async (listId: string, route: ListRoute): Promise<ListSummary | null> => {
	if (route === "owner") {
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
		return rows[0] ? toSummary(rows[0]) : null
	}

	if (route === "share-link") {
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
		return rows[0] ? toSummary(rows[0]) : null
	}

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
	return rows[0] ? toSummary(rows[0]) : null
})

export const loadSummary = loadSummaryQuery

export const loadItems = cache(async (listId: string, route: ListRoute): Promise<ListItemRecord[] | null> => {
	const visible = await listIsVisible(listId, route)
	if (!visible) {
		return null
	}

	return db
		.select()
		.from(listItemsTable)
		.where(eq(listItemsTable.listId, listId))
		.orderBy(listItemsTable.order, listItemsTable.isActive)
})

export const loadDetails = cache(async (listId: string, route: ListRoute): Promise<ListDetails | null> => {
	const visible = await listIsVisible(listId, route)
	if (!visible) {
		return null
	}

	const [list, items] = await Promise.all([
		db.select().from(listsTable).where(eq(listsTable.id, listId)).limit(1),
		db
			.select()
			.from(listItemsTable)
			.where(eq(listItemsTable.listId, listId))
			.orderBy(listItemsTable.order, listItemsTable.isActive),
	])

	if (!list.length) {
		return null
	}

	return { ...list[0], items, totalValue: totalCents(items) }
})

export const loadSummaryView = cache(async (listId: string, route: ListRoute) => {
	const list = await loadSummary(listId, route)
	if (!list) {
		return null
	}

	const user = await getCurrentUser()
	return {
		list,
		capabilities: listCapabilities({
			route,
			isOwner: list.userId === user?.id,
			isPublic: Boolean(list.public),
		}),
	}
})

export async function resolveWriteAccess(listId: string) {
	const userId = await requireUserId()
	const list = await db
		.select({ userId: listsTable.userId, public: listsTable.public })
		.from(listsTable)
		.where(eq(listsTable.id, listId))
		.limit(1)

	if (!list.length) {
		return null
	}

	const isOwner = list[0].userId === userId
	let isSaved = false
	if (!isOwner) {
		const bookmark = await db
			.select({ listId: sharedListsTable.listId })
			.from(sharedListsTable)
			.where(and(eq(sharedListsTable.listId, listId), eq(sharedListsTable.userId, userId)))
			.limit(1)
		isSaved = bookmark.length > 0
	}

	const relationship = listRelationship({ isOwner, isSaved })
	return listCapabilities({
		route: routeForRelationship(relationship),
		isOwner,
		isPublic: Boolean(list[0].public),
	})
}

export const getAll = cache(async (): Promise<SidebarList[]> => {
	const userId = await requireUserId()
	return db.select(sidebarListColumns).from(listsTable).where(eq(listsTable.userId, userId))
})

export const getSharedLists = cache(async (): Promise<SidebarList[]> => {
	const userId = await requireUserId()
	return db
		.select(sidebarListColumns)
		.from(sharedListsTable)
		.innerJoin(listsTable, eq(sharedListsTable.listId, listsTable.id))
		.where(eq(sharedListsTable.userId, userId))
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
