"use client";


import Link from "next/link";
import { SidebarMenuButton } from "./ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
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
import { deleteList, changeListVisibility, duplicateList } from "@/services/lists";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import type { SidebarList } from "@/types/list";
import { useTranslations } from "next-intl";

export function SidebarItem({ item }: { item: SidebarList }) {
    const t = useTranslations("Sidebar")
    const tCommon = useTranslations("Common")
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <SidebarMenuButton className="p-0" asChild>
                <div className="flex justify-between items-center">
                    <Link href={`/app/${item.id}`} className={cn("font-medium w-full h-full flex px-4 items-center justify-start", item.isActive ? "text-foreground" : "text-muted-foreground line-through")}>
                        {item.name}
                    </Link>
                    <div className="flex items-center gap-2 ">
                        <DropdownMenu modal={false} >
                            <DropdownMenuTrigger className="p-2">
                                <MoreVerticalIcon size={16} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem className={cn("cursor-pointer")} onClick={() => duplicateList(item.id)}>{tCommon("duplicate")}</DropdownMenuItem>
                                <DropdownMenuItem className={cn("cursor-pointer")} onClick={() => changeListVisibility(item.id, item.isActive ? 0 : 1)}>{item.isActive ? tCommon("disable") : tCommon("enable")}</DropdownMenuItem>
                                <DropdownMenuItem className={cn("cursor-pointer")} onClick={() => setIsOpen(true)}>{tCommon("delete")}</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </SidebarMenuButton>
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("deleteList.title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("deleteList.description")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                        <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={() => deleteList(item.id)}>{tCommon("delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}