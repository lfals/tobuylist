"use server"

import { formatBRL, isBlockedProductHtml, parseProductHtml, type ProductFromLink } from "@/lib/productFromHtml"
import { storeFromUrl } from "@/lib/storeFromUrl"

const FETCH_TIMEOUT_MS = 12_000
const MAX_HTML_BYTES = 2_500_000
const BROWSER_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
	Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
	"Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
}

function isSafeHttpUrl(url: string) {
	try {
		const parsed = new URL(url)
		if (!["http:", "https:"].includes(parsed.protocol)) {
			return false
		}
		const host = parsed.hostname.toLowerCase()
		if (
			host === "localhost" ||
			host.endsWith(".local") ||
			host.endsWith(".internal") ||
			/^(127\.|10\.|192\.168\.|169\.254\.)/.test(host) ||
			/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
		) {
			return false
		}
		return true
	} catch {
		return false
	}
}

function translateProxyUrl(url: string) {
	const parsed = new URL(url)
	const proxiedHost = parsed.hostname.replace(/-/g, "--").replace(/\./g, "-")
	const search = new URLSearchParams(parsed.search)
	search.set("_x_tr_sl", "auto")
	search.set("_x_tr_tl", "en")
	return `https://${proxiedHost}.translate.goog${parsed.pathname}?${search.toString()}`
}

function extractMercadoLivreIds(url: string) {
	const productId = url.match(/\/p\/(ML[A-Z]{1,3}\d+)/i)?.[1]
	const itemFromQuery = url.match(/item_id[=:](ML[A-Z]{1,3}\d+)/i)?.[1]
	const itemFromPath = url.match(/\/(ML[A-Z]{1,3})-(\d+)/i)
	const itemId = itemFromQuery || (itemFromPath ? `${itemFromPath[1]}${itemFromPath[2]}` : undefined)
	return { productId, itemId }
}

async function fetchHtml(url: string) {
	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

	try {
		const response = await fetch(url, {
			headers: BROWSER_HEADERS,
			redirect: "follow",
			cache: "no-store",
			signal: controller.signal,
		})
		if (!response.ok) {
			return null
		}
		const buffer = await response.arrayBuffer()
		const bytes = buffer.byteLength > MAX_HTML_BYTES ? buffer.slice(0, MAX_HTML_BYTES) : buffer
		return new TextDecoder("utf-8", { fatal: false }).decode(bytes)
	} catch {
		return null
	} finally {
		clearTimeout(timeout)
	}
}

async function fetchMercadoLivreApi(url: string): Promise<ProductFromLink | null> {
	const { itemId, productId } = extractMercadoLivreIds(url)
	const ids = [itemId, productId].filter(Boolean) as string[]

	for (const id of ids) {
		const endpoints = [
			`https://api.mercadolibre.com/items/${id}`,
			`https://api.mercadolibre.com/products/${id}`,
		]
		for (const endpoint of endpoints) {
			try {
				const response = await fetch(endpoint, {
					headers: { Accept: "application/json", "User-Agent": BROWSER_HEADERS["User-Agent"] },
					cache: "no-store",
				})
				if (!response.ok) {
					continue
				}
				const data = (await response.json()) as {
					title?: string
					name?: string
					price?: number
					original_price?: number | null
					thumbnail?: string
					pictures?: { url?: string }[]
				}
				const name = data.title || data.name
				const originalPrice = data.original_price || data.price
				const imageUrl = data.pictures?.[0]?.url || data.thumbnail
				if (!name && originalPrice == null) {
					continue
				}
				return {
					...(name ? { name } : {}),
					store: storeFromUrl(url),
					...(originalPrice != null ? { price: formatBRL(originalPrice) } : {}),
					...(imageUrl ? { imageUrl } : {}),
				}
			} catch {
				continue
			}
		}
	}

	return null
}

export async function fetchProductFromLink(url: string): Promise<ProductFromLink> {
	const trimmed = url.trim()
	const fallback = { store: storeFromUrl(trimmed) }

	if (!isSafeHttpUrl(trimmed)) {
		return fallback
	}

	const fromApi = await fetchMercadoLivreApi(trimmed)
	if (fromApi?.name || fromApi?.price) {
		return { ...fallback, ...fromApi }
	}

	const html = (await fetchHtml(trimmed)) || ""
	const usableHtml =
		html && !isBlockedProductHtml(html) ? html : (await fetchHtml(translateProxyUrl(trimmed))) || html

	if (!usableHtml) {
		return fallback
	}

	return {
		...fallback,
		...parseProductHtml(usableHtml, trimmed),
	}
}
