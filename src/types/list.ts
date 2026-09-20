import type { listItemsTable, listsTable } from "@/db/schema"

export type ListRecord = typeof listsTable.$inferSelect
export type ListItemRecord = typeof listItemsTable.$inferSelect

export type ListDetails = ListRecord & {
	items: ListItemRecord[]
	totalValue: number
}

export type ListSummary = {
	id: string
	name: string
	description: string | null
	public: number
	userId: string
	totalValue: number
}

export type SidebarList = {
	id: string
	name: string
	isActive: number
}

export type DashboardListCard = {
	id: string
	name: string
	description: string | null
	totalValue: number
	items: number
}

export type ListDashboard = {
	lists: DashboardListCard[]
	totalValue: number
	items: number
}
