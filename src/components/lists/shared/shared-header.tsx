"use client"

import { Button } from "@/components/ui/button";
import { useFormatViewNumber } from "@/hooks/formatViewNumber";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { formSchema } from "../formSchema";
import { createListItem } from "@/services/listItem";
import { useParams } from "next/navigation";
import { z } from "zod";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2Icon } from "lucide-react";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { NewItemForm } from "../item-form";


export default function SharedHeader({ data }: { data: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const params = useParams()
    const isMobile = useIsMobile()
    const [isSaving, setIsSaving] = useState(false)

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
                    <h1 className="text-2xl font-bold">{useFormatViewNumber(data?.totalValue.toString() ?? "0")}</h1>
                    <h2 className="text-4xl font-bold">{data?.name}</h2>
                    <p className="text-sm text-gray-500">{data?.description}</p>
                </div>
                <div className="flex items-center gap-2">
                    {Boolean(data?.public) && <Button type="button" onClick={() => setIsOpen(true)}>Adicionar</Button>}
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
                                {({ isFetching }) => (
                                    <DrawerFooter>
                                        <Button type="submit" disabled={isSaving || isFetching} form="create-item-form">
                                            {isSaving ? <Loader2Icon size={16} className="animate-spin" /> : "Adicionar"}
                                        </Button>
                                    </DrawerFooter>
                                )}
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
                                {({ isFetching }) => (
                                    <DialogFooter>
                                        <Button type="submit" disabled={isSaving || isFetching} form="create-item-form">
                                            {isSaving ? <Loader2Icon size={16} className="animate-spin" /> : "Adicionar"}
                                        </Button>
                                    </DialogFooter>
                                )}
                            </NewItemForm>
                        </DialogContent>
                    </Dialog>
                </>
            )
            }
        </>
    )
}
