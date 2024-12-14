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
import React, { Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getListDetails } from "@/services/lists";
import { createListItem, deleteListItem, editListItem } from "@/services/listItem";
import Image from "next/image";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { revalidatePath } from "next/cache";

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
        if (isEditing) {
            editListItem(params.list as string, {
                ...values,
                id: editingItem.id,
                quantity: Number(values.quantity),
                listId: params.list as string
            })
        } else {
            createListItem(params.list as string, {
                ...values,
                quantity: Number(values.quantity),
                listId: params.list as string
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
        const list = await getListDetails(params.list as string)
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
                        <p className="text-sm text-gray-500">{data?.description}</p>
                    </div>
                    <div>
                        <Button onClick={() => setIsOpen(true)}>Adicionar</Button>
                    </div>

                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 ">
                        {data?.items.map((item) => (
                            <React.Fragment key={item.id}>

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
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div >

            {isMobile ? (
                <>
                    <Drawer open={isOpen} onOpenChange={setIsOpen} >
                        <DrawerContent>
                            <DrawerHeader>
                                <DrawerTitle>{isEditing ? "Editar item" : "Novo item"}</DrawerTitle>
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
                                        <Button type="submit" form="create-item-form">{isEditing ? "Salvar" : "Adicionar"}</Button>
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
    );
}
