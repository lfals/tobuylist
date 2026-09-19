"use client"
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFormatNumber } from "@/hooks/use-formatNumber";
import { getListDetails } from "@/services/lists";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { z } from "zod";
import { createListItem } from "@/services/listItem";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useParams, useSearchParams } from "next/navigation";
import { formSchema } from "./formSchema";
import EditList from "./editList";
import { ShareList } from "./shareList";
import { SaveList } from "./saveList";
import { Loader2Icon } from "lucide-react";
import { NewItemForm } from "./item-form";


export default function Header({ data }: { data?: Awaited<ReturnType<typeof getListDetails>> }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const params = useParams()
    const [isSaving, setIsSaving] = useState(false)
    const searchParams = useSearchParams()
    const isShared = searchParams.get('share')
    const isMobile = useIsMobile()



    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            link: "",
            imageUrl: "",
            store: "",
            price: "R$ 0,00",
            quantity: "1",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSaving(true)
        await createListItem(params.list as string, {
            ...values,
            quantity: Number(values.quantity),
            listId: params.list as string
        })
        setIsSaving(false)
        setIsOpen(false)
    }

    useEffect(() => {
        if (!isOpen) {
            form.reset()
        }
    }, [isOpen])



    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{useFormatNumber(data?.totalValue.toString() ?? "0")}</h1>
                    <h2 className="text-4xl font-bold">{data?.name}</h2>
                    <p className="text-sm text-gray-500">{data?.description}</p>
                </div>
                <div className="flex items-center gap-2">
                    {Boolean(isShared) !== true ? (
                        <>
                            <ShareList item={data} />
                            <Button onClick={() => setIsOpen(true)}>Adicionar</Button>
                            <EditList item={data} />
                        </>
                    ) : (
                        <SaveList isPublic={Boolean(data?.public)} />
                    )}
                </div>
            </div>
            {isMobile ? (
                <>
                    <Drawer open={isOpen} onOpenChange={setIsOpen} >
                        <DrawerContent>
                            <DrawerHeader>
                                <DrawerTitle>{"Novo item"}</DrawerTitle>
                            </DrawerHeader>
                            <NewItemForm
                                form={form}
                                onSubmit={onSubmit}
                                formId="create-item-form"
                                className="space-y-4 p-4"
                                isOpen={isOpen}
                            >
                                <DrawerFooter>
                                    <Button type="submit" disabled={isSaving} form="create-item-form">
                                        {isSaving ? <Loader2Icon size={16} className="animate-spin" /> : "Adicionar"}
                                    </Button>
                                </DrawerFooter>
                            </NewItemForm>
                        </DrawerContent>
                    </Drawer>
                </>
            ) : (
                <>
                    <Dialog open={isOpen} onOpenChange={setIsOpen} modal>

                        <DialogContent className="sm:max-w-[425px]" >
                            <DialogHeader>
                                <DialogTitle>Novo item</DialogTitle>
                            </DialogHeader>
                            <NewItemForm
                                form={form}
                                onSubmit={onSubmit}
                                formId="create-item-form"
                                className="space-y-4"
                                isOpen={isOpen}
                            >
                                <DialogFooter>
                                    <Button type="submit" disabled={isSaving} form="create-item-form">
                                        {isSaving ? <Loader2Icon size={16} className="animate-spin" /> : "Adicionar"}
                                    </Button>
                                </DialogFooter>
                            </NewItemForm>
                        </DialogContent>
                    </Dialog>
                </>
            )
            }
        </>
    )
}
