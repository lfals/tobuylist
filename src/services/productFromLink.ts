"use server"

import { requireSignedIn } from "@/lib/current-user"
import { fetchProductData } from "@/lib/product-fetch"
import type { ProductFromLink } from "@/lib/productFromHtml"

export async function fetchProductFromLink(url: string): Promise<ProductFromLink> {
	await requireSignedIn()
	return fetchProductData(url)
}
