
import React from "react";
import { SidebarItem } from "./sidebar-item";
import { SidebarMenuItem } from "./ui/sidebar";
import { getAll } from "@/services/lists";

export async function SidebarBody() {

    const lists = await getAll();

    return (
        <>
            {lists.length > 0 ? lists.map((item) => (
                <SidebarMenuItem key={item.id}>
                    <SidebarItem item={item} />
                </SidebarMenuItem>
            )) : (
                <SidebarMenuItem>
                    <p>Nenhuma lista encontrada</p>
                </SidebarMenuItem>
            )}
        </>
    )
}