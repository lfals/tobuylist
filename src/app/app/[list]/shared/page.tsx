import Items from "@/components/lists/items"
import { ListHeaderSkeleton, ListItemsSkeleton } from "@/components/lists/list-skeletons"
import SharedHeader from "@/components/lists/shared/shared-header"
import { getSharedListDetailsItems, getSharedListDetailsSummary } from "@/services/lists-queries"
import { redirect } from "next/navigation"
import { Suspense } from "react"

async function SharedListHeader({ listId }: { listId: string }) {
    const list = await getSharedListDetailsSummary(listId)
    if (!list) {
        redirect("/app")
    }
    return <SharedHeader list={list} />
}

async function SharedListItems({ listId }: { listId: string }) {
    const [summary, items] = await Promise.all([
        getSharedListDetailsSummary(listId),
        getSharedListDetailsItems(listId),
    ])
    if (!summary || !items) {
        redirect("/app")
    }
    return <Items items={items} listId={listId} canEdit={Boolean(summary.public)} showImage={false} />
}

export default async function SharedListPage({ params }: { params: Promise<{ list: string }> }) {
    const param = await params
    void getSharedListDetailsSummary(param.list)
    void getSharedListDetailsItems(param.list)

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
