
import React from "react";


import Header from "./header";
import Body from "./body";

import { getListDetails } from "@/services/lists";


export default async function ListPage({ params }: { params: Promise<{ list: string }> }) {
    const param = await params
    const data = await getListDetails(param.list as string)

    return (
        <>
            <div className="flex flex-col gap-10">
                <Header data={data} />
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 ">
                        {data?.items.map((item) => (
                            <Body item={item} key={item.id} />
                        ))}
                    </div>
                </div>
            </div >


        </>
    );
}
