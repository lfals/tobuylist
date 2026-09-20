"use client"
import React, { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { shareList } from "@/services/lists";
import type { ListSummary } from "@/types/list";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

import { LinkIcon, Loader2Icon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Label } from "@/components/ui/label";


const formSchema = z.object({
    id: z.string(),
    isPublic: z.boolean()
})

export function ShareList({ item }: { item?: ListSummary }) {
    const isMobile = useIsMobile()
    const [isOpen, setIsOpen] = React.useState(false);
    const [isLoading, startSharing] = useTransition();
    const [isSuccess, setIsSuccess] = React.useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: item?.id,
            isPublic: false
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        startSharing(async () => {
            await shareList(values.id, values.isPublic)
            navigator.clipboard.writeText(`${window.location.origin}/app/${values.id}?share=true`)
            setIsSuccess(true)
            setTimeout(() => {
                setIsOpen(false)
                setIsSuccess(false)
            }, 2000)
        })
    }

    return (
        <>
            <Button size={"icon"} variant={"ghost"} onClick={() => setIsOpen(true)}><LinkIcon /></Button>
            {isMobile ? (
                <>
                    <Drawer open={isOpen} onOpenChange={setIsOpen} >
                        <DrawerContent>
                            <DrawerHeader>
                                <DrawerTitle>Compartilhar lista</DrawerTitle>
                                <DrawerDescription>
                                    Compartilhe a lista com outros usuários para que eles possam ver e adicionar itens à lista.
                                </DrawerDescription>
                            </DrawerHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-4" id="share-list-form">

                                    <FormField
                                        control={form.control}
                                        name="isPublic"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Permitir que outros usuários alterem a lista</FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch checked={field.value}
                                                            onCheckedChange={field.onChange} />
                                                        <Label htmlFor="airplane-mode">{field.value ? "Sim" : "Não"}</Label>
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                </form>
                            </Form>
                            <DrawerFooter>
                                {isLoading ? (
                                    <Button type="submit" form="share-list-form" disabled={isLoading}><Loader2Icon className="animate-spin" /></Button>
                                ) : (
                                    <Button type="submit" form="share-list-form" disabled={isLoading}>{isSuccess ? "Link copiado ✅" : "Compartilhar"}</Button>
                                )}
                            </DrawerFooter>
                        </DrawerContent>
                    </Drawer>
                </>
            ) : (
                <>
                    <Dialog open={isOpen} onOpenChange={setIsOpen} modal>

                        <DialogContent className="sm:max-w-[425px]" >
                            <DialogHeader>
                                <DialogTitle>Compartilhar lista</DialogTitle>
                                <DialogDescription>
                                    Compartilhe a lista com outros usuários para que eles possam ver e adicionar itens à lista.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" id="share-list-form">

                                    <FormField
                                        control={form.control}
                                        name="isPublic"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Permitir que outros usuários alterem a lista</FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch checked={field.value}
                                                            onCheckedChange={field.onChange} />
                                                        <Label htmlFor="airplane-mode">{field.value ? "Sim" : "Não"}</Label>
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                </form>
                            </Form>
                            <DialogFooter>
                                {isLoading ? (
                                    <Button type="submit" form="share-list-form" disabled={isLoading}><Loader2Icon className="animate-spin" /></Button>
                                ) : (
                                    <Button type="submit" form="share-list-form" disabled={isLoading}>{isSuccess ? "Link copiado ✅" : "Compartilhar"}</Button>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )
            }
        </>
    )
}