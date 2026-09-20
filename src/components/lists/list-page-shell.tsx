import Header from "@/components/lists/header"
import Items from "@/components/lists/items"
import { ListHeaderSkeleton, ListItemsSkeleton } from "@/components/lists/list-skeletons"
import type { ListRoute } from "@/lib/listAccess"
import { loadItems, loadSummaryView } from "@/services/listLoad"
import { redirect } from "next/navigation"
import { Suspense } from "react"

async function ListHeader({
	listId,
	route,
	showImageUrl,
}: {
	listId: string
	route: ListRoute
	showImageUrl: boolean
}) {
	const view = await loadSummaryView(listId, route)
	if (!view) {
		redirect("/app")
	}
	return <Header list={view.list} capabilities={view.capabilities} showImageUrl={showImageUrl} />
}

async function ListItemsBlock({
	listId,
	route,
	showImage,
}: {
	listId: string
	route: ListRoute
	showImage: boolean
}) {
	const [view, items] = await Promise.all([loadSummaryView(listId, route), loadItems(listId, route)])
	if (!view || !items) {
		redirect("/app")
	}
	return <Items items={items} listId={listId} capabilities={view.capabilities} showImage={showImage} />
}

export function ListPageShell({
	listId,
	route,
	showImage = true,
}: {
	listId: string
	route: ListRoute
	showImage?: boolean
}) {
	void loadSummaryView(listId, route)
	void loadItems(listId, route)

	return (
		<div className="flex flex-col gap-10">
			<Suspense fallback={<ListHeaderSkeleton />}>
				<ListHeader listId={listId} route={route} showImageUrl={showImage} />
			</Suspense>
			<div className="flex flex-col gap-4">
				<Suspense fallback={<ListItemsSkeleton />}>
					<ListItemsBlock listId={listId} route={route} showImage={showImage} />
				</Suspense>
			</div>
		</div>
	)
}
