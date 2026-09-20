import Header from "@/components/lists/header"
import Items from "@/components/lists/items"
import { ListHeaderSkeleton, ListItemsSkeleton } from "@/components/lists/list-skeletons"
import { loadItems, loadSummaryView } from "@/services/listLoad"
import { redirect } from "next/navigation"
import { Suspense } from "react"

async function SharedListHeader({ listId }: { listId: string }) {
	const view = await loadSummaryView(listId, "saved-list")
	if (!view) {
		redirect("/app")
	}
	return <Header list={view.list} capabilities={view.capabilities} showImageUrl={false} />
}

async function SharedListItems({ listId }: { listId: string }) {
	const [view, items] = await Promise.all([
		loadSummaryView(listId, "saved-list"),
		loadItems(listId, "saved-list"),
	])
	if (!view || !items) {
		redirect("/app")
	}
	return <Items items={items} listId={listId} capabilities={view.capabilities} showImage={false} />
}

export default async function SharedListPage({ params }: { params: Promise<{ list: string }> }) {
	const param = await params
	void loadSummaryView(param.list, "saved-list")
	void loadItems(param.list, "saved-list")

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
