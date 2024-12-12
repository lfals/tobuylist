"use client";
import { Accordion, } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormatNumber } from "@/hooks/use-formatNumber";
import { zodResolver } from "@hookform/resolvers/zod";
import { MinusIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Nome deve ter pelo menos 2 caracteres.",
    }),
    link: z.string().url({
        message: "Link deve ser uma URL válida.",
    }),
    price: z.string().transform((val) => {
        // Convert string price to number, removing currency formatting
        return val.replace(/[^\d.,]/g, '').replace(',', '.')
    }),
    quantity: z.number().min(1, {
        message: "Quantidade deve ser maior que 0.",
    }),
})

export default function ListPage() {
    const [isOpen, setIsOpen] = React.useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            link: "",
            price: "R$ 0,00",
            quantity: 1,
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {

        console.log(values)
    }

    useEffect(() => {
        form.reset();
    }, [isOpen])

    return (
        <>
            <div className="flex flex-col gap-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">R$1200</h1>
                        <h2 className="text-4xl font-bold">Nome Lista</h2>
                    </div>
                    <div>
                        <Button onClick={() => setIsOpen(true)}>Adicionar</Button>
                    </div>

                </div>
                <div className="flex flex-col gap-4">
                    <Accordion type="single" collapsible className="flex flex-col gap-2">
                        {Array.from({ length: 10 }).map((_, index) => (
                            <React.Fragment key={index}>
                                <div className=" bg-white flex w-full gap-4 p-4 rounded-md">
                                    <div className="flex justify-between w-full flex-col pt-2 gap-2">
                                        <div className="flex justify-between w-full ">
                                            <h1>Nome Loja</h1>
                                            <h1>R$1200 (x10)</h1>
                                        </div>
                                        <div className="flex justify-between items-center w-full">
                                            <div>
                                                <h1 className="text-xl font-bold">Nome Item</h1>
                                                <p>Link</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size={"icon"} variant={"outline"}>
                                                    <MinusIcon size={16} />
                                                </Button>
                                                <Input className="w-12" />
                                                <Button size={"icon"} variant={"outline"}>
                                                    <PlusIcon size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button size={"icon"} variant={"ghost"}>
                                                    <MoreHorizontalIcon size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem>Marcar</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem >Editar</DropdownMenuItem>
                                                <DropdownMenuItem>Excluir</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                            </React.Fragment>
                        ))}
                    </Accordion>
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>

                <DialogContent className="sm:max-w-[425px]" >
                    <DialogHeader>
                        <DialogTitle>Novo item</DialogTitle>
                        <DialogDescription>
                            Crie um novo item para a lista.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                name="link"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="shadcn" {...field} />
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
                                                <Input placeholder="shadcn"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(useFormatNumber(e.target.value));
                                                    }}
                                                />
                                            </FormControl>
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
                                        </FormItem>
                                    )}
                                />

                            </div>
                            <DialogFooter>
                                <Button type="submit">Adicionar</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}
