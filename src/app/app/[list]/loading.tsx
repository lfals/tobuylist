import { Accordion, } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export default function Loading() {
    return (
        <>
            <div className="flex flex-col gap-10">
                {/* <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="w-full h-8" />
                        <Skeleton className="w-full h-8" />
                    </div>
                    <div>
                        <Button >Adicionar</Button>
                    </div>

                </div> */}
                <div className="flex flex-col gap-4">
                    <Accordion type="single" collapsible className="flex flex-col gap-2">
                        {Array.from({ length: 10 }).map((_, index) => (
                            <React.Fragment key={index}>
                                <Skeleton className=" bg-white flex w-full gap-4 p-4 rounded-md h-24" />
                            </React.Fragment>
                        ))}
                    </Accordion>
                </div>
            </div>

        </>
    );
}
