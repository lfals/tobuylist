"use client"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAutofillFromLink } from "@/hooks/use-autofill-from-link"
import { useFormatNumber } from "@/hooks/use-formatNumber"
import { Loader2Icon } from "lucide-react"
import type { ReactNode } from "react"
import type { UseFormReturn } from "react-hook-form"
import type { z } from "zod"
import { formSchema } from "./formSchema"

type ItemFormValues = z.infer<typeof formSchema>

type NewItemFormChildren = ReactNode | ((state: { isFetching: boolean }) => ReactNode)

export function NewItemForm({
	form,
	onSubmit,
	formId,
	className,
	isOpen,
	showImageUrl = true,
	children,
}: {
	form: UseFormReturn<ItemFormValues>
	onSubmit: (values: ItemFormValues) => void
	formId: string
	className?: string
	isOpen: boolean
	showImageUrl?: boolean
	children: NewItemFormChildren
}) {
	const { isFetching } = useAutofillFromLink(form, isOpen)
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
				<FormField
					control={form.control}
					name="link"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="flex items-center gap-2">
								Link
								{isFetching && <Loader2Icon size={14} className="animate-spin" />}
							</FormLabel>
							<FormControl>
								<Input
									type="url"
									placeholder="https://loja.com.br/produto"
									{...field}
									value={field.value ?? ""}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Item</FormLabel>
							<FormControl>
								<Input placeholder="Nome do item" {...field} disabled={isFetching} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="store"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Loja</FormLabel>
							<FormControl>
								<Input type="text" placeholder="Nome da loja" {...field} value={field.value ?? ""} disabled={isFetching} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				{showImageUrl && (
					<FormField
						control={form.control}
						name="imageUrl"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Imagem</FormLabel>
								<FormControl>
									<Input type="url" placeholder="https://site.com.br/image.jpg" {...field} value={field.value ?? ""} disabled={isFetching} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}
				<div className="flex gap-2">
					<FormField
						control={form.control}
						name="price"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Preço</FormLabel>
								<FormControl>
									<Input
										type="text"
										placeholder="R$ 0,00"
										{...field}
										disabled={isFetching}
										onChange={(e) => {
											field.onChange(useFormatNumber(e.target.value))
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="quantity"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Quantidade</FormLabel>
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
