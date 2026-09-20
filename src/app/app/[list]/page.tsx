import { Suspense } from "react"

import Header from "@/components/lists/header"
import Items from "@/components/lists/items"
import { ListHeaderSkeleton, ListItemsSkeleton } from "@/components/lists/list-skeletons"
import { listRouteFromSearch, type ListRoute } from "@/lib/listAccess"
import { loadListItemsForRoute, loadListSummaryView } from "@/services/lists"
import { redirect } from "next/navigation"

async function ListHeader({ listId, route }: { listId: string; route: ListRoute }) {
	const view = await loadListSummaryView(listId, route)
	if (!view) {
		redirect("/app")
	}
	return <Header list={view.list} capabilities={view.capabilities} />
}

async function ListItems({ listId, route }: { listId: string; route: ListRoute }) {
	const [view, items] = await Promise.all([
		loadListSummaryView(listId, route),
		loadListItemsForRoute(listId, route),
	])
	if (!view || !items) {
		redirect("/app")
	}
	return <Items items={items} listId={listId} capabilities={view.capabilities} />
}

export default async function ListPage({
	params,
	searchParams,
}: {
	params: Promise<{ list: string }>
	searchParams: Promise<{ share: string }>
}) {
	const [param, search] = await Promise.all([params, searchParams])
	const route = listRouteFromSearch(search.share)
	if (route === "invalid") {
		redirect("/app")
	}

	void loadListSummaryView(param.list, route)
	void loadListItemsForRoute(param.list, route)

	return (
		<div className="flex flex-col gap-10">
			<Suspense fallback={<ListHeaderSkeleton />}>
				<ListHeader listId={param.list} route={route} />
			</Suspense>
			<div className="flex flex-col gap-4">
				<Suspense fallback={<ListItemsSkeleton />}>
					<ListItems listId={param.list} route={route} />
				</Suspense>
			</div>
		</div>
	)
}
