import Items from "@/components/lists/items"
import { ListHeaderSkeleton, ListItemsSkeleton } from "@/components/lists/list-skeletons"
import SharedHeader from "@/components/lists/shared/shared-header"
import { loadListItemsForRoute, loadListSummaryView } from "@/services/lists"
import { redirect } from "next/navigation"
import { Suspense } from "react"

async function SharedListHeader({ listId }: { listId: string }) {
	const view = await loadListSummaryView(listId, "saved-list")
	if (!view) {
		redirect("/app")
	}
	return <SharedHeader list={view.list} capabilities={view.capabilities} />
}

async function SharedListItems({ listId }: { listId: string }) {
	const [view, items] = await Promise.all([
		loadListSummaryView(listId, "saved-list"),
		loadListItemsForRoute(listId, "saved-list"),
	])
	if (!view || !items) {
		redirect("/app")
	}
	return <Items items={items} listId={listId} capabilities={view.capabilities} showImage={false} />
}

export default async function SharedListPage({ params }: { params: Promise<{ list: string }> }) {
	const param = await params
	void loadListSummaryView(param.list, "saved-list")
	void loadListItemsForRoute(param.list, "saved-list")

	return (
		<div className="flex flex-col gap-10">
			<Suspense fallback={<ListHeaderSkeleton />}>
				<SharedListHeader listId={param.list} />
			</Suspense>
			<div className="flex flex-col gap-4">
				<Suspense fallback={<ListItemsSkeleton />}>
					<SharedListItems listId={param.list} />
				</Suspense>
			</div>
		</div>
	)
}
