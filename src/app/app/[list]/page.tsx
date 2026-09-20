import { ListPageShell } from "@/components/lists/list-page-shell"
import { listRouteFromSearch } from "@/lib/listAccess"
import { redirect } from "next/navigation"

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

	return <ListPageShell listId={param.list} route={route} />
}
