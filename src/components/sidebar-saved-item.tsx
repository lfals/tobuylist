"use client";


import Link from "next/link";
import { SidebarMenuButton } from "./ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { MoreVerticalIcon } from "lucide-react";
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
import { deleteList, changeListVisibility, getAll, duplicateList, duplicateSharedList, deleteSharedList } from "@/services/lists";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

export function SidebarSavedItem({ item }: { item: Awaited<ReturnType<typeof getAll>>[number] }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <SidebarMenuButton className="p-0" asChild>
                <div className="flex justify-between items-center">
                    <Link href={`/app/${item.id}/shared`} className={cn("font-medium w-full h-full flex px-4 items-center justify-start", item.isActive ? "text-foreground" : "text-muted-foreground line-through")}>
                        {item.name}
                    </Link>
                    <div className="flex items-center gap-2 ">
                        <DropdownMenu modal={false} >
                            <DropdownMenuTrigger className="p-2">
                                <MoreVerticalIcon size={16} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem className={cn("cursor-pointer")} onClick={() => duplicateSharedList(item.id)}>Duplicar</DropdownMenuItem>
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
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a lista
                            compartilhada do seu perfil.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={() => deleteSharedList(item.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}