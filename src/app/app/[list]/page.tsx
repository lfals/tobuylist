import { Suspense } from "react";

import { getListItems, getListSummary } from "@/services/lists-queries";
import { redirect } from "next/navigation";
import Header from "@/components/lists/header";
import Items from "@/components/lists/items";
import { ListHeaderSkeleton, ListItemsSkeleton } from "@/components/lists/list-skeletons";

async function ListHeader({ listId }: { listId: string }) {
    const list = await getListSummary(listId)
    if (!list) {
        redirect("/app")
    }
    return <Header list={list} />
}

async function ListItems({ listId }: { listId: string }) {
    const items = await getListItems(listId)
    if (!items) {
        redirect("/app")
    }
    return <Items items={items} listId={listId} canEdit />
}

export default async function ListPage({ params, searchParams }: { params: Promise<{ list: string }>, searchParams: Promise<{ share?: string }> }) {
    const [param, search] = await Promise.all([params, searchParams])

    // Links antigos de compartilhamento (?share=true) agora vivem na rota pública /s/[id].
    if (search.share) {
        redirect(search.share === "true" ? `/s/${param.list}` : "/app")
    }

    void getListSummary(param.list)
    void getListItems(param.list)

    return (
        <div className="flex flex-col gap-10">
            <Suspense fallback={<ListHeaderSkeleton />}>
                <ListHeader listId={param.list} />
            </Suspense>
            <div className="flex flex-col gap-4">
                <Suspense fallback={<ListItemsSkeleton />}>
                    <ListItems listId={param.list} />
                </Suspense>
            </div>
        </div>
    );
}
