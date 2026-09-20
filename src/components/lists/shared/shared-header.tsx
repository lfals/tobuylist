"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatViewNumber } from "@/lib/format-number"
import { createListItem } from "@/services/listItem"
import type { ListSummary } from "@/types/list"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import type { z } from "zod"
import { emptyItemFormValues, formSchema } from "../formSchema"
import { NewItemForm } from "../item-form"

export default function SharedHeader({ list }: { list: ListSummary }) {
	const [isOpen, setIsOpen] = useState(false)
	const [isSaving, startSaving] = useTransition()
	const isMobile = useIsMobile()
	const canAdd = Boolean(list.public)

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: emptyItemFormValues,
	})

	function onSubmit(values: z.infer<typeof formSchema>) {
		startSaving(async () => {
			await createListItem(list.id, {
				...values,
				quantity: Number(values.quantity),
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
					<h1 className="text-2xl font-bold">{formatViewNumber(list.totalValue.toString())}</h1>
					<h2 className="text-4xl font-bold">{list.name}</h2>
					<p className="text-sm text-gray-500">{list.description}</p>
				</div>
				<div className="flex items-center gap-2">
					{canAdd ? (
						<Button type="button" onClick={() => setIsOpen(true)}>Adicionar</Button>
					) : null}
				</div>
			</div>
			{canAdd ? (
				isMobile ? (
					<Drawer open={isOpen} onOpenChange={handleOpenChange}>
						<DrawerContent>
							<DrawerHeader>
								<DrawerTitle>Novo item</DrawerTitle>
							</DrawerHeader>
							<NewItemForm
								form={form}
								onSubmit={onSubmit}
								formId="create-item-form"
								className="space-y-4 p-4"
								isOpen={isOpen}
							>
								{({ isFetching }) => (
									<DrawerFooter>
										<Button type="submit" disabled={isSaving || isFetching} form="create-item-form">
											{isSaving ? <Loader2Icon size={16} className="animate-spin" /> : "Adicionar"}
										</Button>
									</DrawerFooter>
								)}
							</NewItemForm>
						</DrawerContent>
					</Drawer>
				) : (
					<Dialog open={isOpen} onOpenChange={handleOpenChange} modal>
						<DialogContent className="sm:max-w-[425px]">
							<DialogHeader>
								<DialogTitle>Novo item</DialogTitle>
							</DialogHeader>
							<NewItemForm
								form={form}
								onSubmit={onSubmit}
								formId="create-item-form"
								className="space-y-4"
								isOpen={isOpen}
							>
								{({ isFetching }) => (
									<DialogFooter>
										<Button type="submit" disabled={isSaving || isFetching} form="create-item-form">
											{isSaving ? <Loader2Icon size={16} className="animate-spin" /> : "Adicionar"}
										</Button>
									</DialogFooter>
								)}
							</NewItemForm>
						</DialogContent>
					</Dialog>
				)
			) : null}
		</>
	)
}
