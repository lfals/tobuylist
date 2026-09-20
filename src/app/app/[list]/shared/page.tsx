import { ListPageShell } from "@/components/lists/list-page-shell"

export default async function SharedListPage({ params }: { params: Promise<{ list: string }> }) {
	const param = await params
	return <ListPageShell listId={param.list} route="saved-list" showImage={false} />
}
