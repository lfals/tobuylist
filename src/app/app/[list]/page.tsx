"use client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormatNumber } from "@/hooks/use-formatNumber";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, MinusIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getListDetails } from "@/services/lists/getListDetails";
import { createListItem } from "@/services/lists/createListItem";
import Image from "next/image";
import { editListItem } from "@/services/lists/editListItem";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteListItem } from "@/services/lists/deleteListItem";

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

export default function ListPage() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [data, setData] = React.useState<Awaited<ReturnType<typeof getListDetails>>>()
    const [isEditing, setIsEditing] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<any>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const params = useParams()

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
        if (isEditing) {
            editListItem(Number(params.list), {
                ...values,
                id: editingItem.id,
                quantity: Number(values.quantity),
                listId: Number(params.list)
            })
        } else {
            createListItem(Number(params.list), {
                ...values,
                quantity: Number(values.quantity),
                listId: Number(params.list)
            })
        }
        setIsOpen(false)
    }

    function handleEditItem(item: any) {
        setIsEditing(true)
        setIsOpen(true)
        setEditingItem(item)
        form.setValue("name", item.name)
        form.setValue("link", item.link)
        form.setValue("store", item.store)
        form.setValue("price", useFormatNumber(item.price.toString()))
        form.setValue("quantity", item.quantity.toString())
    }

    function handleDeleteItem(item: any) {
        setIsDeleting(true)
        setEditingItem(item)
    }

    async function getData() {
        const list = await getListDetails(Number(params.list))
        setData(list)
    }

    useEffect(() => {
        getData()
    }, [isOpen, isDeleting])

    useEffect(() => {
        if (!isOpen) {
            setIsEditing(false)
            setEditingItem(null)
            form.reset()
        }
    }, [isOpen])

    return (
        <>
            <div className="flex flex-col gap-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{useFormatNumber(data?.totalValue.toString() ?? "0")}</h1>
                        <h2 className="text-4xl font-bold">{data?.name}</h2>
                    </div>
                    <div>
                        <Button onClick={() => setIsOpen(true)}>Adicionar</Button>
                    </div>

                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 ">
                        {data?.items.map((item) => (
                            <React.Fragment key={item.id}>
                                <div className=" bg-white grid grid-cols-[1fr_auto_auto]  w-full gap-4 p-4 rounded-md h-24">
                                    <div className="flex flex-col gap-0 self-center">
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-xl truncate">{item.name} </h1>
                                        </div>
                                        <a href={item.link ?? "#"} target="_blank" className="flex items-center gap-2">
                                            <p>{item.store ?? <>&nbsp;</>}</p>
                                            {item.link && <Image src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${item.link}&size=16#refinements`} alt={item.name} width={16} height={16} />}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <h1>{useFormatNumber(item.price.toString())} (x{item.quantity})</h1>
                                    </div>
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button size={"icon"} variant={"ghost"}>
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

                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>

                <DialogContent className="sm:max-w-[425px]" >
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Editar item" : "Novo item"}</DialogTitle>
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
                                <Button type="submit" form="create-item-form">{isEditing ? "Salvar" : "Adicionar"}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

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
    );
}
