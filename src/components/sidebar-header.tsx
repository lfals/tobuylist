"use client";


import { Button } from "./ui/button";
import { HomeIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import Link from 'next/link'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { createList } from "@/services/lists";
import { redirect } from "next/navigation";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslations } from "next-intl";
import { useListFormSchema, type ListFormValues } from "@/components/lists/list-form-schema";

export function SidebarHeaderItem() {
    const [isOpen, setIsOpen] = useState(false);
    const isMobile = useIsMobile()
    const t = useTranslations("Sidebar")
    const tCommon = useTranslations("Common")
    const tForm = useTranslations("ListForm")
    const formSchema = useListFormSchema()
    const form = useForm<ListFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    })

    function handleOpenChange(open: boolean) {
        setIsOpen(open)
        if (!open) {
            form.reset()
        }
    }

    function openAddListModal() {
        setIsOpen(true);
    }


    async function onSubmit(values: ListFormValues) {

        const newList = await createList({
            name: values.name,
            description: values.description,
        })

        setIsOpen(false)
        form.reset()

        redirect(`/app/${newList.id}`)
    }


    return (
        <>
            <div className="flex px-2 items-center justify-between gap-2 w-full">
                <Link href={"/app"} className="flex gap-2 items-center">
                    <HomeIcon size={16} />
                    <h1 className="text-lg font-semibold">{t("listsTitle")}</h1>
                </Link>

                <Button size={"icon"} variant={"ghost"} onClick={openAddListModal}>
                    <PlusIcon size={16} />
                </Button>
            </div>

            {isMobile ? (<>
                <Drawer open={isOpen} onOpenChange={handleOpenChange}>
                    <DrawerContent className="sm:max-w-[425px]" >
                        <Form  {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-4" id="add-list-form">
                                <DrawerHeader>
                                    <DrawerTitle>{t("newList.title")}</DrawerTitle>
                                    <DrawerDescription>
                                        {t("newList.description")}
                                    </DrawerDescription>
                                </DrawerHeader>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{tCommon("name")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={tForm("namePlaceholder")} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{tCommon("description")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={tForm("descriptionPlaceholder")} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />


                                <DrawerFooter>
                                    <Button type="submit" form="add-list-form">{tCommon("create")}</Button>
                                </DrawerFooter>

                            </form>
                        </Form>
                    </DrawerContent>
                </Drawer>
            </>) : (<>

                <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                    <DialogContent className="sm:max-w-[425px]" >
                        <Form  {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" id="add-list-form">
                                <DialogHeader>
                                    <DialogTitle>{t("newList.title")}</DialogTitle>
                                    <DialogDescription>
                                        {t("newList.description")}
                                    </DialogDescription>
                                </DialogHeader>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{tCommon("name")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={tForm("namePlaceholder")} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{tCommon("description")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={tForm("descriptionPlaceholder")} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />


                                <DialogFooter>
                                    <Button type="submit" form="add-list-form">{tCommon("create")}</Button>
                                </DialogFooter>

                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </>)}



        </>
    )
}