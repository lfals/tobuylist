
import React from "react";


import Header from "./header";

import { getListDetails } from "@/services/lists";
import Items from "./items";


export default async function ListPage({ params }: { params: Promise<{ list: string }> }) {
    const param = await params
    const data = await getListDetails(param.list as string)

    return (
        <>
            <div className="flex flex-col gap-10">
                <Header data={data} />
                <div className="flex flex-col gap-4">
                    <Items data={data} />
                </div>
            </div >


        </>
    );
}
