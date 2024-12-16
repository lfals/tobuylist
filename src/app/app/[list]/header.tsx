"use client"
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useFormatNumber } from "@/hooks/use-formatNumber";
import { getListDetails } from "@/services/lists";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { z } from "zod";
import { createListItem } from "@/services/listItem";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useParams } from "next/navigation";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Nome deve ter pelo menos 2 caracteres.",
    }),
    link: z.union([z.literal(""), z.string().trim().url()]),
    store: z.string(),
    price: z.string().transform((val) => {
        return String(val).replace(/[^\d.,]/g, '').replace(',', '').replace('.', '')
    }),
    quantity: z.string().refine((val) => {
        return Number(val) > 0
    }, {
        message: "Quantidade deve ser maior que 0.",
    })
})

export default function Header({ data }: { data?: Awaited<ReturnType<typeof getListDetails>> }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const params = useParams()
    const isMobile = useIsMobile()


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            link: "",
            store: "",
            price: "R$ 0,00",
            quantity: "1",
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {

        createListItem(params.list as string, {
            ...values,
            quantity: Number(values.quantity),
            listId: params.list as string
        })
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
                <div>
                    <Button onClick={() => setIsOpen(true)}>Adicionar</Button>
                </div>

            </div>
            {isMobile ? (
                <>
                    <Drawer open={isOpen} onOpenChange={setIsOpen} >
                        <DrawerContent>
                            <DrawerHeader>
                                <DrawerTitle>{"Novo item"}</DrawerTitle>
                            </DrawerHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4" id="create-item-form">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Item</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="shadcn" {...field} />
                                                </FormControl>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="store"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Loja</FormLabel>
                                                <FormControl>
                                                    <Input type="text" placeholder="shadcn" {...field} value={field.value ?? ''} />
                                                </FormControl>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="link"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>URL</FormLabel>
                                                <FormControl>
                                                    <Input type="text" placeholder="shadcn" {...field} value={field.value ?? ''} />
                                                </FormControl>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex gap-2">
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Preço</FormLabel>
                                                    <FormControl>
                                                        <Input type="text" placeholder="shadcn"
                                                            {...field}
                                                            onChange={(e) => {
                                                                field.onChange(useFormatNumber(e.target.value));
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />

                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="quantity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Quantidade</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min={1} {...field} />
                                                    </FormControl>
                                                    <FormMessage />

                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <DrawerFooter>
                                        <Button type="submit" form="create-item-form">Adicionar</Button>
                                    </DrawerFooter>
                                </form>
                            </Form>

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
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="create-item-form">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Item</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="shadcn" {...field} />
                                                </FormControl>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="store"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Loja</FormLabel>
                                                <FormControl>
                                                    <Input type="text" placeholder="shadcn" {...field} value={field.value ?? ''} />
                                                </FormControl>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="link"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>URL</FormLabel>
                                                <FormControl>
                                                    <Input type="text" placeholder="shadcn" {...field} value={field.value ?? ''} />
                                                </FormControl>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex gap-2">
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Preço</FormLabel>
                                                    <FormControl>
                                                        <Input type="text" placeholder="shadcn"
                                                            {...field}
                                                            onChange={(e) => {
                                                                field.onChange(useFormatNumber(e.target.value));
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />

                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="quantity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Quantidade</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min={1} {...field} />
                                                    </FormControl>
                                                    <FormMessage />

                                                </FormItem>
                                            )}
                                        />

                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" form="create-item-form">Adicionar</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </>
            )
            }
        </>
    )
}