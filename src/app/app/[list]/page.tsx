import Header from "@/components/lists/header"
import Items from "@/components/lists/items"
import { listRouteFromSearch } from "@/lib/listAccess"
import { loadListView } from "@/services/lists"
import { redirect } from "next/navigation"

export default async function ListPage({
	params,
	searchParams,
}: {
	params: Promise<{ list: string }>
	searchParams: Promise<{ share: string }>
}) {
	const param = await params
	const search = await searchParams
	const route = listRouteFromSearch(search.share)
	if (route === "invalid") {
		redirect("/app")
	}

	const view = await loadListView(param.list, route)
	if (!view) {
		redirect("/app")
	}

	return (
		<div className="flex flex-col gap-10">
			<Header data={view.list} capabilities={view.capabilities} />
			<div className="flex flex-col gap-4">
				<Items data={view.list} capabilities={view.capabilities} />
			</div>
		</div>
	)
}
