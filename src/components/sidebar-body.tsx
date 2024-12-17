
import React from "react";
import { SidebarItem } from "./sidebar-item";
import { SidebarMenuItem } from "./ui/sidebar";
import { getAll, getSharedLists } from "@/services/lists";
import { SidebarSavedItem } from "./sidebar-saved-item";
import { Separator } from "./ui/separator";

export async function SidebarBody() {

    const lists = await getAll();
    const sharedLists = await getSharedLists();

    return (
        <>
            <p className="text-sm text-muted-foreground">Minhas listas</p>
            {lists.length > 0 ? lists.map((item) => (
                <SidebarMenuItem key={item.id}>
                    <SidebarItem item={item} />
                </SidebarMenuItem>
            )) : (
                <SidebarMenuItem>
                    <p>Nenhuma lista encontrada</p>
                </SidebarMenuItem>
            )}
            <Separator className="my-2" />
            <p className="text-sm text-muted-foreground">Listas salvas</p>
            {sharedLists.length > 0 && sharedLists.map((item) => (
                <SidebarMenuItem key={item.id}>
                    <SidebarSavedItem item={item} />
                </SidebarMenuItem>
            ))}
        </>
    )
}