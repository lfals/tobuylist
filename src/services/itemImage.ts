"use server"

import { isUsableItemImage } from "@/lib/itemImage"

type SearchItem = {
	link: string
}

type SearchResponse = {
	items?: SearchItem[]
}

export async function resolveItemImage(name: string, options?: { page?: "first" | "next" }) {
	const url = new URL("https://www.googleapis.com/customsearch/v1")
	url.searchParams.append("key", process.env.GOOGLE_API_KEY || "")
	url.searchParams.append("cx", process.env.GOOGLE_CX_KEY || "")
	url.searchParams.append("q", name)
	url.searchParams.append("num", "5")
	url.searchParams.append("searchType", "image")
	url.searchParams.append("siteSearchFilter", "e")
	url.searchParams.append("siteSearch", "instagram.com|tiktok.com")

	if (options?.page === "next") {
		url.searchParams.append("start", "6")
	}

	const request = await fetch(url.href, {
		method: "GET",
		redirect: "follow",
	})

	if (!request.ok) {
		return ""
	}

	const response: SearchResponse = await request.json()
	return response.items?.map((item) => item.link).find(isUsableItemImage) || ""
}
