
import React from "react";

import { getListDetails, getSharedList } from "@/services/lists";
import { redirect } from "next/navigation";
import Header from "@/components/lists/header";
import Items from "@/components/lists/items";


export default async function ListPage({ params, searchParams }: { params: Promise<{ list: string }>, searchParams: Promise<{ share: string }> }) {
    const param = await params
    const search = await searchParams
    let data

    if (search.share) {
        if (search.share !== "true") {
            redirect('/app')
        }
        data = await getSharedList(param.list as string)
    } else {
        data = await getListDetails(param.list as string)
    }

    return (
        <>
            {data ? (
                <div className="flex flex-col gap-10">
                    <Header data={data} />
                    <div className="flex flex-col gap-4">
                        <Items data={data} />
                    </div>
                </div >
            ) : (
                <div className="flex flex-col gap-10">
                    <h1>Lista não encontrada</h1>
                </div>
            )}
        </>
    );
}
