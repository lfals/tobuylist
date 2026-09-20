"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatInput } from "@/lib/money"
import { deleteListItem, editListItem } from "@/services/listItem"
import type { ListItemRecord } from "@/types/list"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { formSchema } from "./formSchema"
import { ItemForm, type ItemFormInput, type ItemFormValues } from "./item-form"

type EditItemDialogProps = {
	item: ListItemRecord | null
	listId: string
	open: boolean
	showImageUrl?: boolean
	onOpenChange: (open: boolean) => void
}

function itemToFormValues(item: ListItemRecord): ItemFormInput {
	return {
		name: item.name,
		link: item.link ?? "",
		imageUrl: item.imageUrl || "",
		store: item.store ?? "",
		price: formatInput(item.price),
		quantity: item.quantity.toString(),
	}
}

function EditItemForm({
	item,
	listId,
	open,
	showImageUrl,
	isMobile,
	onOpenChange,
}: {
	item: ListItemRecord
	listId: string
	open: boolean
	showImageUrl: boolean
	isMobile: boolean
	onOpenChange: (open: boolean) => void
}) {
	const [isSaving, startSaving] = useTransition()
	const form = useForm<ItemFormInput, unknown, ItemFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: itemToFormValues(item),
	})

	function onSubmit(values: ItemFormValues) {
		startSaving(async () => {
			await editListItem(listId, {
				...values,
				id: item.id,
				listId,
			})
			onOpenChange(false)
		})
	}

	const formId = "edit-item-form"

	return (
		<ItemForm
			form={form}
			onSubmit={onSubmit}
			formId={formId}
			className={isMobile ? "space-y-4 p-4" : "space-y-4"}
			isOpen={open}
			showImageUrl={showImageUrl}
		>
			{({ isFetching }) =>
				isMobile ? (
					<DrawerFooter>
						<Button type="submit" disabled={isSaving || isFetching} form={formId}>
							{isSaving ? <Loader2Icon size={16} className="animate-spin" /> : "Salvar"}
						</Button>
					</DrawerFooter>
				) : (
					<DialogFooter>
						<Button type="submit" disabled={isSaving || isFetching} form={formId}>
							{isSaving ? <Loader2Icon size={16} className="animate-spin" /> : "Salvar"}
						</Button>
					</DialogFooter>
				)
			}
		</ItemForm>
	)
}

export function EditItemDialog({
	item,
	listId,
	open,
	showImageUrl = true,
	onOpenChange,
}: EditItemDialogProps) {
	const isMobile = useIsMobile()
	const formContent = item ? (
		<EditItemForm
			key={item.id}
			item={item}
			listId={listId}
			open={open}
			showImageUrl={showImageUrl}
			isMobile={isMobile}
			onOpenChange={onOpenChange}
		/>
	) : null

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={onOpenChange}>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Editar item</DrawerTitle>
					</DrawerHeader>
					{formContent}
				</DrawerContent>
			</Drawer>
		)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange} modal>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Editar item</DialogTitle>
				</DialogHeader>
				{formContent}
			</DialogContent>
		</Dialog>
	)
}

type DeleteItemDialogProps = {
	item: ListItemRecord | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function DeleteItemDialog({ item, open, onOpenChange }: DeleteItemDialogProps) {
	const [isDeleting, startDeleting] = useTransition()

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Excluir item</AlertDialogTitle>
					<AlertDialogDescription>
						Esta ação não pode ser desfeita. Isso excluirá permanentemente o item de sua lista.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						disabled={isDeleting || !item}
						className={buttonVariants({ variant: "destructive" })}
						onClick={() => {
							if (!item) {
								return
							}
							startDeleting(async () => {
								await deleteListItem({ id: item.id, listId: item.listId })
								onOpenChange(false)
							})
						}}
					>
						{isDeleting ? <Loader2Icon size={16} className="animate-spin" /> : "Excluir"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
