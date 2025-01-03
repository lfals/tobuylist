import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { UserSwitcher } from "@/components/user-switcher";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {



	return (
		<>
			<SidebarProvider>
				<AppSidebar />
				<div className="w-full max-w-6xl mx-auto flex flex-col gap-4 pl">
					<UserSwitcher />
					<div className="p-2 md:p-10">{children}</div>
				</div>
				<Toaster />
			</SidebarProvider>
		</>
	);
}
