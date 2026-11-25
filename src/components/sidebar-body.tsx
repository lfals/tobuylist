
import React from "react";
import { SidebarItem } from "./sidebar-item";
import { SidebarMenuItem } from "./ui/sidebar";
import { getAll, getSharedLists } from "@/services/lists-queries";
import { SidebarSavedItem } from "./sidebar-saved-item";
import { Separator } from "./ui/separator";
import { getTranslations } from "next-intl/server";

export async function SidebarBody() {
    const [t, lists, sharedLists] = await Promise.all([getTranslations("Sidebar"), getAll(), getSharedLists()]);

    return (
        <>
            <p className="text-sm text-muted-foreground">{t("myLists")}</p>
            {lists.length > 0 ? lists.map((item) => (
                <SidebarMenuItem key={item.id}>
                    <SidebarItem item={item} />
                </SidebarMenuItem>
            )) : (
                <SidebarMenuItem>
                    <p>{t("noLists")}</p>
                </SidebarMenuItem>
            )}
            <Separator className="my-2" />
            <p className="text-sm text-muted-foreground">{t("savedLists")}</p>
            {sharedLists.length > 0 ? sharedLists.map((item) => (
                <SidebarMenuItem key={item.id}>
                    <SidebarSavedItem item={item} />
                </SidebarMenuItem>
            )) : null}
        </>
    )
}
