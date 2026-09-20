"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/hooks/use-mobile"
import type { ListCapabilities } from "@/lib/listAccess"
import { formatDisplay, formatInput } from "@/lib/money"
import { cn } from "@/lib/utils"
import { deleteListItem, editListItem, markListItem } from "@/services/listItem"
import { resolveItemImage } from "@/services/itemImage"
import type { ListWithItems } from "@/services/lists"
import { zodResolver } from "@hookform/resolvers/zod"
import { Reorder, useDragControls } from "framer-motion"
import { GripIcon, ImageOffIcon, Loader2Icon, MoreHorizontalIcon } from "lucide-react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { ItemForm, type ItemFormInput, type ItemFormValues } from "./item-form"
import { formSchema } from "./formSchema"

export default function ItemRow({
	item,
	capabilities,
	showImage = true,
}: {
	item: ListWithItems["items"][number]
	capabilities: ListCapabilities
	showImage?: boolean
}) {
	const [isOpen, setIsOpen] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const params = useParams()
	const isMobile = useIsMobile()
	const controls = useDragControls()
	const listId = params.list as string

	const form = useForm<ItemFormInput, unknown, ItemFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			link: "",
			store: "",
			imageUrl: "",
			price: "R$ 0,00",
			quantity: "1",
		},
	})

	function onSubmit(values: ItemFormValues) {
		editListItem(listId, {
			...values,
			id: item.id,
			listId,
		})
		setIsOpen(false)
	}

	function handleEditItem() {
		setIsOpen(true)
		form.reset({
			name: item.name,
			link: item.link ?? "",
			store: item.store ?? "",
			imageUrl: item.imageUrl || "",
			price: formatInput(item.price),
			quantity: String(item.quantity),
		})
	}

	async function handleDeleteListItem() {
		setIsLoading(true)
		await deleteListItem({ id: item.id, listId: item.listId })
		setIsLoading(false)
		setIsDeleting(false)
	}

	async function handleErroredImage() {
		const imageUrl = await resolveItemImage(item.name, { page: "next" })
		editListItem(listId, {
			...item,
			imageUrl,
		})
	}

	useEffect(() => {
		if (!isOpen) {
			form.reset()
		}
	}, [form, isOpen])

	const actions = capabilities.canEditItem
	const reorder = capabilities.canReorder

	return (
		<>
			<Reorder.Item
				value={item}
				dragListener={false}
				onPointerDown={reorder ? (event: PointerEvent) => controls.start(event) : undefined}
				dragControls={reorder ? controls : undefined}
				className={cn(
					"grid gap-4 bg-white dark:bg-neutral-900",
					showImage ? "grid-cols-[min-content_min-content_1fr_min-content]" : "grid-cols-[min-content_1fr_min-content]",
					item.isActive ? "p-4 rounded-md" : "opacity-50 p-4 rounded-md",
				)}
			>
				{reorder && (
					<div className="flex items-center justify-center hover:cursor-grab">
						<GripIcon size={16} />
					</div>
				)}
				{showImage && (
					<div className="h-full aspect-square rounded-sm flex items-center justify-center">
						{item.imageUrl ? (
							<Image src={item.imageUrl} onError={handleErroredImage} alt={item.name.slice(0, 10)} width={80} height={80} />
						) : (
							<div className="bg-gray-200 h-full aspect-square rounded-sm flex items-center justify-center">
								<ImageOffIcon />
							</div>
						)}
					</div>
				)}
				<div className="flex flex-col gap-2 select-none">
					<div className="flex flex-col">
						<h1 className="font-bold truncate">{item.name}</h1>
						<a href={item.link ?? "#"} target="_blank" className="flex items-center gap-2">
							{item.link && (
								<Image
									src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${item.link}&size=24#refinements`}
									alt={item.name}
									width={16}
									height={16}
								/>
							)}
							<p>{item.store ?? <>&nbsp;</>}</p>
						</a>
					</div>
					<h1>{formatDisplay(item.price)} (x{item.quantity})</h1>
				</div>
				{actions && (
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<Button size="icon" variant="ghost">
								<MoreHorizontalIcon size={16} />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onClick={() => markListItem(listId, item.id, item.isActive ? 0 : 1)}>
								{item.isActive ? "Desabilitar" : "Habilitar"}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleEditItem}>Editar</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setIsDeleting(true)}>Excluir</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</Reorder.Item>

			{isMobile ? (
				<Drawer open={isOpen} onOpenChange={setIsOpen}>
					<DrawerContent>
						<DrawerHeader>
							<DrawerTitle>Editar item</DrawerTitle>
						</DrawerHeader>
						<ItemForm
							form={form}
							onSubmit={onSubmit}
							formId={`edit-item-${item.id}`}
							className="space-y-4 p-4"
							isOpen={isOpen}
							showImageUrl={showImage}
						>
							{({ isFetching }) => (
								<DrawerFooter>
									<Button type="submit" disabled={isFetching} form={`edit-item-${item.id}`}>Salvar</Button>
								</DrawerFooter>
							)}
						</ItemForm>
					</DrawerContent>
				</Drawer>
			) : (
				<Dialog open={isOpen} onOpenChange={setIsOpen} modal>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Editar item</DialogTitle>
						</DialogHeader>
						<ItemForm
							form={form}
							onSubmit={onSubmit}
							formId={`edit-item-${item.id}`}
							className="space-y-4"
							isOpen={isOpen}
							showImageUrl={showImage}
						>
							{({ isFetching }) => (
								<DialogFooter>
									<Button type="submit" disabled={isFetching} form={`edit-item-${item.id}`}>Salvar</Button>
								</DialogFooter>
							)}
						</ItemForm>
					</DialogContent>
				</Dialog>
			)}

			<AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Excluir item</AlertDialogTitle>
						<AlertDialogDescription>
							Esta ação não pode ser desfeita. Isso excluirá permanentemente o item de sua lista.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction disabled={isLoading} className={buttonVariants({ variant: "destructive" })} onClick={handleDeleteListItem}>
							{isLoading ? <Loader2Icon size={16} className="animate-spin" /> : "Excluir"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
