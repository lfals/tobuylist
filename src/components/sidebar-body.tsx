
import React from "react";
import { SidebarItem } from "./sidebar-item";
import { SidebarMenuItem } from "./ui/sidebar";
import getLists from "@/services/lists/getLists";

export async function SidebarBody() {

    const lists = await getLists();

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