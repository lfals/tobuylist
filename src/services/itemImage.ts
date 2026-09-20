"use server"

import { isUsableItemImage } from "@/lib/itemImage"

type SearchItem = {
	link: string
}

type SearchResponse = {
	items?: SearchItem[]
}

const IMAGE_CACHE_TTL_MS = 30 * 60 * 1000
const IMAGE_CACHE_MAX = 200
const imageCache = new Map<string, { url: string; expiresAt: number }>()

function imageCacheKey(query: string, page?: "first" | "next") {
	return `${query.toLowerCase()}::${page === "next" ? "next" : "first"}`
}

function getCachedImage(key: string) {
	const hit = imageCache.get(key)
	if (!hit) {
		return
	}
	if (hit.expiresAt < Date.now()) {
		imageCache.delete(key)
		return
	}
	imageCache.delete(key)
	imageCache.set(key, hit)
	return hit.url
}

function setCachedImage(key: string, url: string) {
	if (imageCache.size >= IMAGE_CACHE_MAX) {
		const oldest = imageCache.keys().next().value
		if (oldest) {
			imageCache.delete(oldest)
		}
	}
	imageCache.set(key, { url, expiresAt: Date.now() + IMAGE_CACHE_TTL_MS })
}

export async function resolveItemImage(name: string, options?: { page?: "first" | "next" }) {
	const key = imageCacheKey(name, options?.page)
	const cached = getCachedImage(key)
	if (cached !== undefined) {
		return cached
	}

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
	const imageUrl = response.items?.map((item) => item.link).find(isUsableItemImage) || ""
	setCachedImage(key, imageUrl)
	return imageUrl
}
