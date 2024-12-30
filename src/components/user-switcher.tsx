"use client";

import * as React from "react";

import { SidebarMenu, SidebarMenuItem, SidebarTrigger } from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import { ModeToggle } from "./themetoggle";

export function UserSwitcher() {


	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<div className="grid grid-cols-2 grid-rows-[40px] gap-2 p-2 items-center">
					<SidebarTrigger className="block lg:hidden" />
					<div className="flex justify-end items-center gap-2 col-start-2">
						<ModeToggle />
						<UserButton />
					</div>
				</div>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
