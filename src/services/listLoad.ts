import db from "@/db/drizzle"
import { listItemsTable, listsTable, sharedListsTable } from "@/db/schema"
import { getCurrentUser, requireUserId } from "@/lib/current-user"
import { listCapabilities, listRelationship, type ListRoute } from "@/lib/listAccess"
import { activeTotalSql, totalCents } from "@/lib/listTotal"
import type { ListDashboard, ListDetails, ListItemRecord, ListSummary, SidebarList } from "@/types/list"
import { and, eq, sql } from "drizzle-orm"
import { cache } from "react"

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

const summaryById = cache(async (listId: string): Promise<ListSummary | null> => {
	const rows = await db
		.select({
			...listSummaryColumns,
			totalValue: activeTotalSql,
		})
		.from(listsTable)
		.leftJoin(listItemsTable, eq(listItemsTable.listId, listsTable.id))
		.where(eq(listsTable.id, listId))
		.groupBy(listsTable.id, listsTable.name, listsTable.description, listsTable.public, listsTable.userId)
		.limit(1)

	return rows[0] ? toSummary(rows[0]) : null
})

async function hasSavedBookmark(listId: string, userId: string) {
	const bookmark = await db
		.select({ listId: sharedListsTable.listId })
		.from(sharedListsTable)
		.where(and(eq(sharedListsTable.listId, listId), eq(sharedListsTable.userId, userId)))
		.limit(1)
	return bookmark.length > 0
}

async function capabilitiesForList(listId: string, listOwnerId: string, isPublic: boolean) {
	const user = await getCurrentUser()
	const isOwner = Boolean(user?.id && listOwnerId === user.id)
	const isSaved = !isOwner && user?.id ? await hasSavedBookmark(listId, user.id) : false
	return listCapabilities({
		relationship: listRelationship({ isOwner, isSaved }),
		isPublic,
	})
}

export const loadSummary = cache(async (listId: string, route: ListRoute): Promise<ListSummary | null> => {
	if (!(await listIsVisible(listId, route))) {
		return null
	}
	return summaryById(listId)
})

export const loadItems = cache(async (listId: string, route: ListRoute): Promise<ListItemRecord[] | null> => {
	if (!(await listIsVisible(listId, route))) {
		return null
	}

	return db
		.select()
		.from(listItemsTable)
		.where(eq(listItemsTable.listId, listId))
		.orderBy(listItemsTable.order, listItemsTable.isActive)
})

export const loadDetails = cache(async (listId: string, route: ListRoute): Promise<ListDetails | null> => {
	if (!(await listIsVisible(listId, route))) {
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

	return {
		list,
		capabilities: await capabilitiesForList(listId, list.userId, Boolean(list.public)),
	}
})

export async function resolveWriteAccess(listId: string) {
	await requireUserId()
	const list = await db
		.select({ userId: listsTable.userId, public: listsTable.public })
		.from(listsTable)
		.where(eq(listsTable.id, listId))
		.limit(1)

	if (!list.length) {
		return null
	}

	return capabilitiesForList(listId, list[0].userId, Boolean(list[0].public))
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
