"use client"
import { Button } from "@/components/ui/button";
import { MoreVerticalIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { editList } from "@/services/lists";

const formSchema = z.object({
    name: z.string().min(2).max(50).refine((value) => value.trim() !== "", {
        message: "O nome não pode ser apenas espaços em branco",
    }),
    description: z.string().max(50).optional(),
})

export default function EditList({ item }: { item: { id: string; name: string; description: string | null } }) {
    const isMobile = useIsMobile()
    const [isOpen, setIsOpen] = useState(false)
    const [isSaving, startSaving] = useTransition()

    const form = useForm<z.infer<typeof formSchema>>({
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

    function onSubmit(values: z.infer<typeof formSchema>) {
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
                                    <DrawerTitle>Editar lista</DrawerTitle>
                                </DrawerHeader>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Moto" {...field} />
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
                                            <FormLabel>Descrição</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Peças e acessórios" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />


                                <DrawerFooter>
                                    <Button type="submit" form="add-list-form" disabled={isSaving}>Salvar</Button>
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
                                    <DialogTitle>Editar lista</DialogTitle>
                                </DialogHeader>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Moto" {...field} />
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
                                            <FormLabel>Descrição</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Peças e acessórios" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />


                                <DialogFooter>
                                    <Button type="submit" form="add-list-form" disabled={isSaving}>Salvar</Button>
                                </DialogFooter>

                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </>)}
        </>
    )
}