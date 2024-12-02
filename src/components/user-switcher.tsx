"use client";

import * as React from "react";

import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { usePathname } from "next/navigation";

export function UserSwitcher() {
	const pathname = usePathname();

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<div className="grid grid-cols-2 gap-2 p-2">
					{pathname !== "/app" && (
						<Link href={"/app"} className="flex items-center gap-2 col-start-1">
							<ArrowLeftIcon size={16} />
							<span>Voltar</span>
						</Link>
					)}
					<div className="flex justify-end items-center gap-2 col-start-2">
						<UserButton showName />
					</div>
				</div>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
