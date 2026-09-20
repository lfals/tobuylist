"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import type { ListCapabilities } from "@/lib/listAccess"
import { formatDisplay } from "@/lib/money"
import { createListItem } from "@/services/listItem"
import type { ListWithItems } from "@/services/lists"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { formSchema } from "../formSchema"
import { ItemForm, type ItemFormInput, type ItemFormValues } from "../item-form"

export default function SharedHeader({
	data,
	capabilities,
}: {
	data: ListWithItems
	capabilities: ListCapabilities
}) {
	const [isOpen, setIsOpen] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const params = useParams()
	const isMobile = useIsMobile()

	const form = useForm<ItemFormInput, unknown, ItemFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			link: "",
			imageUrl: "",
			store: "",
			price: "R$ 0,00",
			quantity: "1",
		},
	})

	async function onSubmit(values: ItemFormValues) {
		setIsSaving(true)
		try {
			await createListItem(params.list as string, {
				...values,
				listId: params.list as string,
			})
			setIsOpen(false)
		} finally {
			setIsSaving(false)
		}
	}

	useEffect(() => {
		if (!isOpen) {
			form.reset()
		}
	}, [form, isOpen])

	return (
		<>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">{formatDisplay(data.totalValue)}</h1>
					<h2 className="text-4xl font-bold">{data.name}</h2>
					<p className="text-sm text-gray-500">{data.description}</p>
				</div>
				<div className="flex items-center gap-2">
					{capabilities.canAddItem && <Button type="button" onClick={() => setIsOpen(true)}>Adicionar</Button>}
				</div>
			</div>
			{isMobile ? (
				<Drawer open={isOpen} onOpenChange={setIsOpen}>
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
				<Dialog open={isOpen} onOpenChange={setIsOpen} modal>
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
			)}
		</>
	)
}
