"use client"

import type { ItemFormInput, ItemFormValues } from "@/components/lists/item-form"
import { formatInput } from "@/lib/money"
import { fetchProductFromLink } from "@/services/productFromLink"
import { useEffect, useRef, useState } from "react"
import type { UseFormReturn } from "react-hook-form"

export function useAutofillFromLink(form: UseFormReturn<ItemFormInput, unknown, ItemFormValues>, isOpen: boolean) {
	const link = form.watch("link")
	const [isFetching, setIsFetching] = useState(false)
	const requestId = useRef(0)

	useEffect(() => {
		const currentRequest = ++requestId.current

		if (!isOpen) {
			setIsFetching(false)
			return
		}

		const trimmed = link?.trim() ?? ""
		if (!trimmed) {
			setIsFetching(false)
			return
		}

		try {
			const parsed = new URL(trimmed)
			if (!["http:", "https:"].includes(parsed.protocol)) {
				setIsFetching(false)
				return
			}
		} catch {
			setIsFetching(false)
			return
		}

		setIsFetching(true)
		const timeout = setTimeout(async () => {
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
				if (product.price != null) {
					form.setValue("price", formatInput(product.price), { shouldValidate: true })
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
