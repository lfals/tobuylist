import { Suspense } from "react";

import { getListItems, getListSummary, getSharedListItems, getSharedListSummary } from "@/services/lists-queries";
import { redirect } from "next/navigation";
import Header from "@/components/lists/header";
import Items from "@/components/lists/items";
import { ListHeaderSkeleton, ListItemsSkeleton } from "@/components/lists/list-skeletons";

async function ListHeader({ listId, isShared }: { listId: string; isShared: boolean }) {
    const list = isShared ? await getSharedListSummary(listId) : await getListSummary(listId)
    if (!list) {
        redirect("/app")
    }
    return <Header list={list} isShared={isShared} />
}

async function ListItems({ listId, isShared }: { listId: string; isShared: boolean }) {
    const items = isShared ? await getSharedListItems(listId) : await getListItems(listId)
    if (!items) {
        redirect("/app")
    }
    return <Items items={items} listId={listId} canEdit={!isShared} />
}

export default async function ListPage({ params, searchParams }: { params: Promise<{ list: string }>, searchParams: Promise<{ share: string }> }) {
    const [param, search] = await Promise.all([params, searchParams])

    if (search.share && search.share !== "true") {
        redirect("/app")
    }

    const isShared = search.share === "true"
    if (isShared) {
        void getSharedListSummary(param.list)
        void getSharedListItems(param.list)
    } else {
        void getListSummary(param.list)
        void getListItems(param.list)
    }

    return (
        <div className="flex flex-col gap-10">
            <Suspense fallback={<ListHeaderSkeleton />}>
                <ListHeader listId={param.list} isShared={isShared} />
            </Suspense>
            <div className="flex flex-col gap-4">
                <Suspense fallback={<ListItemsSkeleton />}>
                    <ListItems listId={param.list} isShared={isShared} />
                </Suspense>
            </div>
        </div>
    );
}
