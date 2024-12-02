import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserSwitcher } from "@/components/user-switcher";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<SidebarProvider>
				<AppSidebar />
				<div className="w-full max-w-6xl mx-auto flex flex-col gap-4">
					<UserSwitcher />
					<div className="p-10">{children}</div>
				</div>
			</SidebarProvider>
		</>
	);
}
