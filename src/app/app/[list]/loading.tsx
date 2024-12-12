import { Accordion, } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MinusIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import React from "react";

export default function Loading() {
    return (
        <>
            <div className="flex flex-col gap-10">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="w-full h-8" />
                        <Skeleton className="w-full h-8" />
                    </div>
                    <div>
                        <Button >Adicionar</Button>
                    </div>

                </div>
                <div className="flex flex-col gap-4">
                    <Accordion type="single" collapsible className="flex flex-col gap-2">
                        {Array.from({ length: 10 }).map((_, index) => (
                            <React.Fragment key={index}>
                                <div className=" bg-white flex w-full gap-4 p-4 rounded-md">
                                    <div className="flex justify-between w-full flex-col pt-2 gap-2">
                                        <div className="flex justify-between w-full ">
                                            <h1>Nome Loja</h1>
                                            <h1>R$1200 (x10)</h1>
                                        </div>
                                        <div className="flex justify-between items-center w-full">
                                            <div>
                                                <h1 className="text-xl font-bold">Nome Item</h1>
                                                <p>Link</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size={"icon"} variant={"outline"}>
                                                    <MinusIcon size={16} />
                                                </Button>
                                                <Input className="w-12" />
                                                <Button size={"icon"} variant={"outline"}>
                                                    <PlusIcon size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button size={"icon"} variant={"ghost"}>
                                                    <MoreHorizontalIcon size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem>Marcar</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem >Editar</DropdownMenuItem>
                                                <DropdownMenuItem>Excluir</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                            </React.Fragment>
                        ))}
                    </Accordion>
                </div>
            </div>

        </>
    );
}
