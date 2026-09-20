
import React from "react";
import { SidebarMenuItem } from "./ui/sidebar";
import { getAll, getSharedLists } from "@/services/listLoad";
import { SidebarListRow } from "./sidebar-list-row";
import { Separator } from "./ui/separator";

export async function SidebarBody() {
    const [lists, sharedLists] = await Promise.all([getAll(), getSharedLists()]);

    return (
        <>
            <p className="text-sm text-muted-foreground">Minhas listas</p>
            {lists.length > 0 ? lists.map((item) => (
                <SidebarMenuItem key={item.id}>
                    <SidebarListRow item={item} route="owner" />
                </SidebarMenuItem>
            )) : (
                <SidebarMenuItem>
                    <p>Nenhuma lista encontrada</p>
                </SidebarMenuItem>
            )}
            <Separator className="my-2" />
            <p className="text-sm text-muted-foreground">Listas salvas</p>
            {sharedLists.length > 0 ? sharedLists.map((item) => (
                <SidebarMenuItem key={item.id}>
                    <SidebarListRow item={item} route="saved-list" />
                </SidebarMenuItem>
            )) : null}
        </>
    )
}
