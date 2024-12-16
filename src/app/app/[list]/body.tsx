"use client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormatNumber } from "@/hooks/use-formatNumber";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontalIcon } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getListDetails } from "@/services/lists";
import { deleteListItem, editListItem } from "@/services/listItem";
import Image from "next/image";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { formSchema } from "./formSchema";

export default function Body({ item }: { item: Awaited<ReturnType<typeof getListDetails>>["items"][number] }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<any>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)
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
        editListItem(params.list as string, {
            ...values,
            id: editingItem.id,
            quantity: Number(values.quantity),
            listId: params.list as string
        })

        setIsOpen(false)
    }

    function handleDeleteItem(item: any) {
        setIsDeleting(true)
        setEditingItem(item)
    }

    function handleEditItem(item: any) {
        setIsOpen(true)
        setEditingItem(item)
        form.setValue("name", item.name)
        form.setValue("link", item.link)
        form.setValue("store", item.store)
        form.setValue("price", useFormatNumber(item.price.toString()))
        form.setValue("quantity", item.quantity.toString())
    }

    useEffect(() => {
        if (!isOpen) {
            setEditingItem(null)
            form.reset()
        }
    }, [isOpen])


    return (
        <>

            <div className="grid grid-cols-10 bg-white p-4 rounded-md ">
                <div className="flex flex-col gap-2 col-span-8">
                    <div className="flex flex-col">
                        <h1 className="font-bold truncate" >{item.name}</h1>
                        <a href={item.link ?? "#"} target="_blank" className="flex items-center gap-2">
                            <p>{item.store ?? <>&nbsp;</>}</p>
                            {item.link && <Image src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${item.link}&size=16#refinements`} alt={item.name} width={16} height={16} />}
                        </a>

                    </div>
                    <h1>{useFormatNumber(item.price.toString())} (x{item.quantity})</h1>
                </div>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button className="col-start-10 col-end-10 place-self-end self-start" size={"icon"} variant={"ghost"}>
                            <MoreHorizontalIcon size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>Marcar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditItem(item)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteItem(item)}>Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {isMobile ? (
                <>
                    <Drawer open={isOpen} onOpenChange={setIsOpen} >
                        <DrawerContent>
                            <DrawerHeader>
                                <DrawerTitle>Editar item</DrawerTitle>
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
                                        <Button type="submit" form="create-item-form">Salvar</Button>
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
                                <DialogTitle>Editar item</DialogTitle>
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
                                        <Button type="submit" form="create-item-form">Salvar</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </>
            )
            }



            <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir item</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o item de sua lista.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={() => deleteListItem(editingItem)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


        </>
    )
}