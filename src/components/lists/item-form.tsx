"use client"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAutofillFromLink } from "@/hooks/use-autofill-from-link"
import { formatNumber } from "@/lib/format-number"
import { Loader2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import type { UseFormReturn } from "react-hook-form"
import type { ItemFormValues } from "./formSchema"

type NewItemFormChildren = ReactNode | ((state: { isFetching: boolean }) => ReactNode)

export function NewItemForm({
	form,
	onSubmit,
	formId,
	className,
	isOpen,
	showImageUrl = true,
	lockOffer = false,
	children,
}: {
	form: UseFormReturn<ItemFormValues>
	onSubmit: (values: ItemFormValues) => void
	formId: string
	className?: string
	isOpen: boolean
	showImageUrl?: boolean
	/** Item com várias lojas: link, loja e preço ficam no modal de links, não neste formulário. */
	lockOffer?: boolean
	children: NewItemFormChildren
}) {
	const t = useTranslations("ItemForm")
	const { isFetching, blocked } = useAutofillFromLink(form, isOpen && !lockOffer)
	const actions = typeof children === "function" ? children({ isFetching }) : children

	return (
		<Form {...form}>
			<form
				onSubmit={(event) => {
					if (isFetching) {
						event.preventDefault()
						return
					}
					form.handleSubmit(onSubmit)(event)
				}}
				className={className}
				id={formId}
				aria-busy={isFetching}
			>
				{lockOffer ? (
					<p className="text-sm text-muted-foreground">{t("multiStoreNote")}</p>
				) : (
				<FormField
					control={form.control}
					name="link"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="flex items-center gap-2">
								{t("link")}
								{isFetching ? <Loader2Icon size={14} className="animate-spin" /> : null}
							</FormLabel>
							<FormControl>
								<Input
									type="url"
									placeholder={t("linkPlaceholder")}
									{...field}
									value={field.value ?? ""}
									disabled={isFetching}
								/>
							</FormControl>
							<FormMessage />
							{blocked ? <p className="text-sm text-muted-foreground">{t("siteBlocked")}</p> : null}
						</FormItem>
					)}
				/>
				)}
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("item")}</FormLabel>
							<FormControl>
								<Input placeholder={t("itemPlaceholder")} {...field} disabled={isFetching} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				{lockOffer ? null : (
				<FormField
					control={form.control}
					name="store"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("store")}</FormLabel>
							<FormControl>
								<Input type="text" placeholder={t("storePlaceholder")} {...field} value={field.value ?? ""} disabled={isFetching} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				)}
				{showImageUrl ? (
					<FormField
						control={form.control}
						name="imageUrl"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("image")}</FormLabel>
								<FormControl>
									<Input type="url" placeholder={t("imagePlaceholder")} {...field} value={field.value ?? ""} disabled={isFetching} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				) : null}
				<div className="flex gap-2">
					{lockOffer ? null : (
					<FormField
						control={form.control}
						name="price"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("price")}</FormLabel>
								<FormControl>
									<Input
										type="text"
										placeholder="R$ 0,00"
										{...field}
										disabled={isFetching}
										onChange={(e) => {
											field.onChange(formatNumber(e.target.value))
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					)}
					<FormField
						control={form.control}
						name="quantity"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("quantity")}</FormLabel>
								<FormControl>
									<Input type="number" min={1} {...field} disabled={isFetching} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				{actions}
			</form>
		</Form>
	)
}
