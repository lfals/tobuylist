
import * as React from "react";


import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarMenu,
	SidebarRail,
} from "@/components/ui/sidebar";

import { SidebarHeaderItem } from "./sidebar-header";
import { SidebarBody } from "./sidebar-body";
import { SidebarLoading } from "./sidebar-loading";



type AppSidebarProps = React.ComponentProps<typeof Sidebar>

export function AppSidebar({ ...props }: AppSidebarProps) {

	return (
		<>
			<Sidebar {...props}>
				<SidebarHeader>
					<SidebarHeaderItem />
				</SidebarHeader>
				<SidebarContent>
					<SidebarMenu className="p-2">
						<React.Suspense fallback={<SidebarLoading />}>
							<SidebarBody />
						</React.Suspense>
					</SidebarMenu>
				</SidebarContent>
				<SidebarRail />
			</Sidebar>
		</>
	);
}
