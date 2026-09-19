"use client"

import { storeFromUrl } from "@/lib/storeFromUrl"
import { fetchProductFromLink } from "@/services/productFromLink"
import { useEffect, useRef, useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import type { z } from "zod"
import type { formSchema } from "@/components/lists/formSchema"

type ItemFormValues = z.infer<typeof formSchema>

export function useAutofillFromLink(form: UseFormReturn<ItemFormValues>, isOpen: boolean) {
	const link = form.watch("link")
	const [isFetching, setIsFetching] = useState(false)
	const requestId = useRef(0)

	useEffect(() => {
		if (!isOpen) {
			setIsFetching(false)
			return
		}

		const trimmed = link?.trim() ?? ""
		if (!trimmed) {
			return
		}

		try {
			new URL(trimmed)
		} catch {
			return
		}

		const store = storeFromUrl(trimmed)
		if (store) {
			form.setValue("store", store)
		}

		const currentRequest = ++requestId.current
		const timeout = setTimeout(async () => {
			setIsFetching(true)
			try {
				const product = await fetchProductFromLink(trimmed)
				if (currentRequest !== requestId.current) {
					return
				}
				if (product.name) {
					form.setValue("name", product.name, { shouldValidate: true })
				}
				if (product.store) {
					form.setValue("store", product.store, { shouldValidate: true })
				}
				if (product.price) {
					form.setValue("price", product.price, { shouldValidate: true })
				}
				if (product.imageUrl) {
					form.setValue("imageUrl", product.imageUrl, { shouldValidate: true })
				}
			} finally {
				if (currentRequest === requestId.current) {
					setIsFetching(false)
				}
			}
		}, 450)

		return () => {
			clearTimeout(timeout)
		}
	}, [form, isOpen, link])

	return { isFetching }
}
