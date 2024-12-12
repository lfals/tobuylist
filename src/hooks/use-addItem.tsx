"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useFormatNumber } from "./use-formatNumber";

export function useAddItem() {
    const [isOpen, setIsOpen] = useState(false);

    function openAddItemModal() {
        setIsOpen(true);
    }

    function AddItemModal() {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>

                <DialogContent className="sm:max-w-[425px]" >
                    <DialogHeader>
                        <DialogTitle>Novo item</DialogTitle>
                        <DialogDescription>
                            Crie um novo item para a lista.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 items-start gap-2  ">
                            <Label htmlFor="name" className="text-left">
                                Nome
                            </Label>
                            <Input
                                id="name"
                                defaultValue=""
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-1 items-start gap-2  ">
                            <Label htmlFor="link" className="text-left">
                                Link
                            </Label>
                            <Input
                                id="link"
                                type="url"
                                defaultValue=""
                                className="col-span-3"
                            />
                        </div>
                        <div className="flex  gap-2">
                            <div className="grid grid-cols-1 items-start gap-2  w-full ">
                                <Label htmlFor="price" className="text-left">
                                    Preço
                                </Label>
                                <Input
                                    id="price"
                                    defaultValue={"R$ 0,00"}
                                    onChange={(e) => {
                                        const formattedValue = useFormatNumber(e.target.value);
                                        e.target.value = formattedValue;
                                    }}
                                />
                            </div>
                            <div className="grid grid-cols-1  items-start gap-2 w-1/3  ">
                                <Label htmlFor="quantity" className="text-left">
                                    Quantidade
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min={1}
                                    defaultValue={1}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Criar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return {
        AddItemModal,
        openAddItemModal,
    }

}
