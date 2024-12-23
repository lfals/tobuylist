import { Accordion, } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export default function Loading() {
    return (
        <>
            <div className="flex flex-col gap-10">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2 w-2/4">
                        <Skeleton className="w-full h-9" />
                        <Skeleton className="w-full h-9" />
                    </div>
                    <div className="w-1/6">
                        <Skeleton className="w-full h-9" />
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <Accordion type="single" collapsible className="flex flex-col gap-2">
                        {Array.from({ length: 10 }).map((_, index) => (
                            <React.Fragment key={index}>
                                <Skeleton className="  w-full gap-4 p-4 rounded-md h-20" />
                            </React.Fragment>
                        ))}
                    </Accordion>
                </div>
            </div>

        </>
    );
}
