import Items from "@/components/lists/items"
import SharedHeader from "@/components/lists/shared/shared-header"
import { loadListView } from "@/services/lists"
import { redirect } from "next/navigation"

export default async function SharedListPage({ params }: { params: Promise<{ list: string }> }) {
	const param = await params
	const view = await loadListView(param.list, "saved-list")
	if (!view) {
		redirect("/app")
	}

	return (
		<div className="flex flex-col gap-10">
			<SharedHeader data={view.list} capabilities={view.capabilities} />
			<div className="flex flex-col gap-4">
				<Items data={view.list} capabilities={view.capabilities} showImage={false} />
			</div>
		</div>
	)
}
