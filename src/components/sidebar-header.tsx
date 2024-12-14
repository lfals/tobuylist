"use client";


import { Button } from "./ui/button";
import { HomeIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import Link from 'next/link'

import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { useAuth } from "@clerk/nextjs";
import { createList } from "@/services/lists";
import { redirect } from "next/navigation";

const formSchema = z.object({
    name: z.string().min(2).max(50).refine((value) => value.trim() !== "", {
        message: "O nome não pode ser apenas espaços em branco",
    }),
    description: z.string().max(50).optional(),
})

export function SidebarHeaderItem() {
    const { userId } = useAuth()
    const [isOpen, setIsOpen] = useState(false);

    function openAddListModal() {
        setIsOpen(true);
    }

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    })


    async function onSubmit(values: z.infer<typeof formSchema>) {

        const newList = await createList({
            name: values.name,
            description: values.description,
            userId: userId!
        })

        setIsOpen(false)

        redirect(`/app/${newList.id}`)
    }

    useEffect(() => {
        form.reset()
    }, [isOpen])


    return (
        <>
            <div className="flex px-2 items-center justify-between gap-2 w-full">
                <Link href={"/app"} className="flex gap-2 items-center">
                    <HomeIcon size={16} />
                    <h1 className="text-lg font-semibold">Listas</h1>
                </Link>

                <Button size={"icon"} variant={"ghost"} onClick={openAddListModal}>
                    <PlusIcon size={16} />
                </Button>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px]" >
                    <Form  {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" id="add-list-form">
                            <DialogHeader>
                                <DialogTitle>Nova lista</DialogTitle>
                                <DialogDescription>
                                    Crie uma nova lista de compras.
                                </DialogDescription>
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
                                <Button type="submit" form="add-list-form">Criar</Button>
                            </DialogFooter>

                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    )
}