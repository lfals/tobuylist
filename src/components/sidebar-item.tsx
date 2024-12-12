"use client";


import Link from "next/link";
import { SidebarMenuButton } from "./ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { MoreVerticalIcon } from "lucide-react";
import { List } from "@/types";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { deleteList } from "@/services/lists/deleteList";
import { buttonVariants } from "./ui/button";
import { changeListVisibility } from "@/services/lists/changeListVisibility";
import { cn } from "@/lib/utils";
export function SidebarItem({ item }: { item: List }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <SidebarMenuButton asChild>
                <div className="flex justify-between items-center">
                    <Link href={`/app/${item.id}`} className={cn("font-medium", item.isActive ? "text-foreground" : "text-muted-foreground line-through")}>
                        {item.name}
                    </Link>
                    <div className="flex items-center gap-2">
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger>
                                <MoreVerticalIcon size={16} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem className={cn("cursor-pointer")} onClick={() => changeListVisibility(item.id, item.isActive ? 0 : 1)}>{item.isActive ? "Desabilitar" : "Habilitar"}</DropdownMenuItem>
                                <DropdownMenuItem className={cn("cursor-pointer")} onClick={() => setIsOpen(true)}>Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </SidebarMenuButton>
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir lista</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente sua lista
                            e removerá seus dados do nosso servidor.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={() => deleteList(item.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}