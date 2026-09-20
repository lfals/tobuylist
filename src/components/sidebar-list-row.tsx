"use client"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { ListRoute } from "@/lib/listAccess"
import { cn } from "@/lib/utils"
import { changeListVisibility, copyList, deleteList, deleteSharedList } from "@/services/lists"
import type { SidebarList } from "@/types/list"
import { MoreVerticalIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { buttonVariants } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { SidebarMenuButton } from "./ui/sidebar"

export function SidebarListRow({
	item,
	route,
}: {
	item: SidebarList
	route: Extract<ListRoute, "owner" | "saved-list">
}) {
	const [isOpen, setIsOpen] = useState(false)
	const href = route === "owner" ? `/app/${item.id}` : `/app/${item.id}/shared`

	return (
		<>
			<SidebarMenuButton className="p-0" asChild>
				<div className="flex justify-between items-center">
					<Link
						href={href}
						className={cn(
							"font-medium w-full h-full flex px-4 items-center justify-start",
							item.isActive ? "text-foreground" : "text-muted-foreground line-through",
						)}
					>
						{item.name}
					</Link>
					<div className="flex items-center gap-2 ">
						<DropdownMenu modal={false}>
							<DropdownMenuTrigger className="p-2">
								<MoreVerticalIcon size={16} />
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem className="cursor-pointer" onClick={() => copyList(item.id, route)}>
									Duplicar
								</DropdownMenuItem>
								{route === "owner" ? (
									<DropdownMenuItem
										className="cursor-pointer"
										onClick={() => changeListVisibility(item.id, item.isActive ? 0 : 1)}
									>
										{item.isActive ? "Desabilitar" : "Habilitar"}
									</DropdownMenuItem>
								) : null}
								<DropdownMenuItem className="cursor-pointer" onClick={() => setIsOpen(true)}>
									Excluir
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</SidebarMenuButton>
			<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Excluir lista</AlertDialogTitle>
						<AlertDialogDescription>
							{route === "owner"
								? "Esta ação não pode ser desfeita. Isso excluirá permanentemente sua lista e removerá seus dados do nosso servidor."
								: "Esta ação não pode ser desfeita. Isso excluirá permanentemente a lista compartilhada do seu perfil."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							className={buttonVariants({ variant: "destructive" })}
							onClick={() => (route === "owner" ? deleteList(item.id) : deleteSharedList(item.id))}
						>
							Excluir
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
