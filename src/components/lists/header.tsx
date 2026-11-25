"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatNumber } from "@/lib/format-number"
import { createListItem } from "@/services/listItem"
import type { ListSummary } from "@/types/list"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import EditList from "./editList"
import { emptyItemFormValues, useItemFormSchema, type ItemFormValues } from "./formSchema"
import { NewItemForm } from "./item-form"
import { ShareList } from "./shareList"

export default function Header({ list }: { list: ListSummary }) {
	const [isOpen, setIsOpen] = useState(false)
	const [isSaving, startSaving] = useTransition()
	const isMobile = useIsMobile()
	const t = useTranslations("Items")
	const tCommon = useTranslations("Common")
	const formSchema = useItemFormSchema()

	const form = useForm<ItemFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: emptyItemFormValues,
	})

	function onSubmit(values: ItemFormValues) {
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
					<h1 className="text-2xl font-bold">{formatNumber(list.totalValue.toString())}</h1>
					<h2 className="text-4xl font-bold">{list.name}</h2>
					<p className="text-sm text-gray-500">{list.description}</p>
				</div>
				<div className="flex items-center gap-2">
					<ShareList item={list} />
					<Button type="button" onClick={() => setIsOpen(true)}>{tCommon("add")}</Button>
					<EditList item={list} />
				</div>
			</div>
			{isMobile ? (
				<Drawer open={isOpen} onOpenChange={handleOpenChange}>
					<DrawerContent>
						<DrawerHeader>
							<DrawerTitle>{t("newTitle")}</DrawerTitle>
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
										{isSaving ? <Loader2Icon size={16} className="animate-spin" /> : tCommon("add")}
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
							<DialogTitle>{t("newTitle")}</DialogTitle>
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
										{isSaving ? <Loader2Icon size={16} className="animate-spin" /> : tCommon("add")}
									</Button>
								</DialogFooter>
							)}
						</NewItemForm>
					</DialogContent>
				</Dialog>
			)}
		</>
	)
}
