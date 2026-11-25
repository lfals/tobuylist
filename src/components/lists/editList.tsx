"use client"
import { Button } from "@/components/ui/button";
import { MoreVerticalIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { editList } from "@/services/lists";
import { useTranslations } from "next-intl";
import { useListFormSchema, type ListFormValues } from "./list-form-schema";

export default function EditList({ item }: { item: { id: string; name: string; description: string | null } }) {
    const isMobile = useIsMobile()
    const tCommon = useTranslations("Common")
    const tForm = useTranslations("ListForm")
    const formSchema = useListFormSchema()
    const [isOpen, setIsOpen] = useState(false)
    const [isSaving, startSaving] = useTransition()

    const form = useForm<ListFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    })

    function openEditListModal() {
        form.reset({
            name: item.name,
            description: item.description ?? "",
        })
        setIsOpen(true);
    }

    function handleOpenChange(open: boolean) {
        setIsOpen(open)
        if (!open) {
            form.reset()
        }
    }

    function onSubmit(values: ListFormValues) {
        startSaving(async () => {
            await editList({
                name: values.name,
                description: values.description,
            }, item.id)
            setIsOpen(false)
        })
    }

    return (
        <>
            <Button size={"icon"} variant={"ghost"} onClick={openEditListModal}><MoreVerticalIcon size={16} /></Button>
            {isMobile ? (<>
                <Drawer open={isOpen} onOpenChange={handleOpenChange}>
                    <DrawerContent className="sm:max-w-[425px]" >
                        <Form  {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-4" id="add-list-form">
                                <DrawerHeader>
                                    <DrawerTitle>{tForm("editTitle")}</DrawerTitle>
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
                                    <Button type="submit" form="add-list-form" disabled={isSaving}>{tCommon("save")}</Button>
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
                                    <DialogTitle>{tForm("editTitle")}</DialogTitle>
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
                                    <Button type="submit" form="add-list-form" disabled={isSaving}>{tCommon("save")}</Button>
                                </DialogFooter>

                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </>)}
        </>
    )
}