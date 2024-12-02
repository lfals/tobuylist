import type * as React from "react";

import { UserSwitcher } from "@/components/user-switcher";

import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MoreVerticalIcon, PlusIcon } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

const data = {
	navMain: [
		{
			title: "Installation",
			url: "/app/installation",
		},
		{
			title: "Project Structure",
			url: "/app/project-structure",
		},

		{
			title: "Routing",
			url: "/app/routing",
		},
		{
			title: "Data Fetching",
			url: "/app/data-fetching",
		},
		{
			title: "Rendering",
			url: "/app/rendering",
		},
		{
			title: "Caching",
			url: "/app/caching",
		},
		{
			title: "Styling",
			url: "/app/styling",
		},
		{
			title: "Optimizing",
			url: "/app/optimizing",
		},
		{
			title: "Configuring",
			url: "#",
		},
		{
			title: "Testing",
			url: "#",
		},
		{
			title: "Authentication",
			url: "#",
		},
		{
			title: "Deploying",
			url: "#",
		},
		{
			title: "Upgrading",
			url: "#",
		},
		{
			title: "Examples",
			url: "#",
		},

		{
			title: "Components",
			url: "#",
		},
		{
			title: "File Conventions",
			url: "#",
		},
		{
			title: "Functions",
			url: "#",
		},
		{
			title: "next.config.js Options",
			url: "#",
		},
		{
			title: "CLI",
			url: "#",
		},
		{
			title: "Edge Runtime",
			url: "#",
		},

		{
			title: "Accessibility",
			url: "#",
		},
		{
			title: "Fast Refresh",
			url: "#",
		},
		{
			title: "Next.js Compiler",
			url: "#",
		},
		{
			title: "Supported Browsers",
			url: "#",
		},
		{
			title: "Turbopack",
			url: "#",
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<div className="flex px-2 items-center justify-between gap-2 w-full">
					<h1 className="text-lg font-semibold">Listas</h1>
					<Button size={"icon"} variant={"ghost"}>
						<PlusIcon size={16} />
					</Button>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarMenu className="p-2">
					{data.navMain.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton asChild isActive={item.isActive}>
								<div className="flex justify-between items-center">
									<Link href={item.url} className="font-medium">
										{item.title}
									</Link>
									<div className="flex items-center gap-2">
										<DropdownMenu modal={false}>
											<DropdownMenuTrigger>
												<MoreVerticalIcon size={16} />
											</DropdownMenuTrigger>
											<DropdownMenuContent>
												<DropdownMenuItem>Duplicar</DropdownMenuItem>
												<DropdownMenuItem>Desabilitar</DropdownMenuItem>
												<DropdownMenuItem>Excluir</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
