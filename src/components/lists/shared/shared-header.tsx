"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import type { ListCapabilities } from "@/lib/listAccess"
import { formatDisplay } from "@/lib/money"
import { createListItem } from "@/services/listItem"
import type { ListSummary } from "@/types/list"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { emptyItemFormValues, formSchema } from "../formSchema"
import { ItemForm, type ItemFormInput, type ItemFormValues } from "../item-form"

export default function SharedHeader({
	list,
	capabilities,
}: {
	list: ListSummary
	capabilities: ListCapabilities
}) {
	const [isOpen, setIsOpen] = useState(false)
	const [isSaving, startSaving] = useTransition()
	const isMobile = useIsMobile()

	const form = useForm<ItemFormInput, unknown, ItemFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: emptyItemFormValues,
	})

	function onSubmit(values: ItemFormValues) {
		startSaving(async () => {
			await createListItem(list.id, {
				...values,
				listId: list.id,
			})
			setIsOpen(false)
			form.reset(emptyItemFormValues)
		})
	}

	function handleOpenChange(open: boolean) {
		setIsOpen(open)
		if (!open) {
			form.reset(emptyItemFormValues)
		}
	}

	return (
		<>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">{formatDisplay(list.totalValue)}</h1>
					<h2 className="text-4xl font-bold">{list.name}</h2>
					<p className="text-sm text-gray-500">{list.description}</p>
				</div>
				<div className="flex items-center gap-2">
					{capabilities.canAddItem ? (
						<Button type="button" onClick={() => setIsOpen(true)}>Adicionar</Button>
					) : null}
				</div>
			</div>
			{capabilities.canAddItem ? (
				isMobile ? (
					<Drawer open={isOpen} onOpenChange={handleOpenChange}>
						<DrawerContent>
							<DrawerHeader>
								<DrawerTitle>Novo item</DrawerTitle>
							</DrawerHeader>
							<ItemForm
								form={form}
								onSubmit={onSubmit}
								formId="create-item-form"
								className="space-y-4 p-4"
								isOpen={isOpen}
								showImageUrl={false}
							>
								{({ isFetching }) => (
									<DrawerFooter>
										<Button type="submit" disabled={isSaving || isFetching} form="create-item-form">
											{isSaving ? <Loader2Icon size={16} className="animate-spin" /> : "Adicionar"}
										</Button>
									</DrawerFooter>
								)}
							</ItemForm>
						</DrawerContent>
					</Drawer>
				) : (
					<Dialog open={isOpen} onOpenChange={handleOpenChange} modal>
						<DialogContent className="sm:max-w-[425px]">
							<DialogHeader>
								<DialogTitle>Novo item</DialogTitle>
							</DialogHeader>
							<ItemForm
								form={form}
								onSubmit={onSubmit}
								formId="create-item-form"
								className="space-y-4"
								isOpen={isOpen}
								showImageUrl={false}
							>
								{({ isFetching }) => (
									<DialogFooter>
										<Button type="submit" disabled={isSaving || isFetching} form="create-item-form">
											{isSaving ? <Loader2Icon size={16} className="animate-spin" /> : "Adicionar"}
										</Button>
									</DialogFooter>
								)}
							</ItemForm>
						</DialogContent>
					</Dialog>
				)
			) : null}
		</>
	)
}
