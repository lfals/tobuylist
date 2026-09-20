"use server"

import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import { isBlockedProductHtml, parseProductHtml, type ProductFromLink } from "@/lib/productFromHtml"
import { centsFromScraped } from "@/lib/money"
import { storeFromUrl } from "@/lib/storeFromUrl"

const FETCH_TIMEOUT_MS = 12_000
const MAX_HTML_BYTES = 2_500_000
const MAX_REDIRECTS = 5
const BROWSER_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
	Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
	"Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
}

function isPrivateIPv4(address: string) {
	const octets = address.split(".").map(Number)
	if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
		return true
	}
	const [a, b] = octets
	return (
		a === 0 ||
		a === 10 ||
		a === 127 ||
		(a === 169 && b === 254) ||
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && b === 168) ||
		(a === 100 && b >= 64 && b <= 127) ||
		a >= 224
	)
}

function isPrivateIPv6(address: string) {
	const bare = address.toLowerCase().split("%")[0]
	if (bare === "::" || bare === "::1") {
		return true
	}
	if (bare.startsWith("::ffff:")) {
		const mapped = bare.slice(7)
		return isIP(mapped) === 4 ? isPrivateIPv4(mapped) : true
	}

	const first = bare.startsWith("::") ? 0 : Number.parseInt(bare.split(":")[0] || "0", 16)
	if (!Number.isFinite(first)) {
		return true
	}
	return (first >= 0xfc00 && first <= 0xfdff) || (first >= 0xfe80 && first <= 0xfebf)
}

function isPrivateIp(address: string) {
	const version = isIP(address)
	if (version === 4) {
		return isPrivateIPv4(address)
	}
	if (version === 6) {
		return isPrivateIPv6(address)
	}
	return true
}

const MERCADO_LIVRE_HOST = /mercado(livre|libre)\./i
const HOST_SAFETY_CACHE_MAX = 200
const hostSafetyCache = new Map<string, Promise<boolean>>()

function getCachedHostSafety(host: string) {
	const cached = hostSafetyCache.get(host)
	if (!cached) {
		return
	}
	hostSafetyCache.delete(host)
	hostSafetyCache.set(host, cached)
	return cached
}

function setCachedHostSafety(host: string, pending: Promise<boolean>) {
	if (hostSafetyCache.size >= HOST_SAFETY_CACHE_MAX && !hostSafetyCache.has(host)) {
		const oldest = hostSafetyCache.keys().next().value
		if (oldest) {
			hostSafetyCache.delete(oldest)
		}
	}
	hostSafetyCache.set(host, pending)
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
			host.endsWith(".localhost") ||
			host.endsWith(".local") ||
			host.endsWith(".internal")
		) {
			return false
		}
		if (isIP(host) && isPrivateIp(host)) {
			return false
		}
		return true
	} catch {
		return false
	}
}

async function lookupHostSafety(host: string) {
	if (isIP(host)) {
		return !isPrivateIp(host)
	}

	try {
		const addresses = await lookup(host, { all: true, verbatim: true })
		if (!addresses.length) {
			return false
		}
		return addresses.every((entry) => !isPrivateIp(entry.address))
	} catch {
		return false
	}
}

function isSafeDestination(url: string) {
	if (!isSafeHttpUrl(url)) {
		return Promise.resolve(false)
	}

	const host = new URL(url).hostname.toLowerCase()
	const cached = getCachedHostSafety(host)
	if (cached) {
		return cached
	}

	const pending = lookupHostSafety(host)
	setCachedHostSafety(host, pending)
	return pending
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

async function readLimitedText(response: Response, maxBytes = MAX_HTML_BYTES) {
	if (!response.body) {
		const text = await response.text()
		return text.length > maxBytes ? text.slice(0, maxBytes) : text
	}

	const reader = response.body.getReader()
	const chunks: Uint8Array[] = []
	let total = 0

	try {
		while (true) {
			const { done, value } = await reader.read()
			if (done) {
				break
			}
			if (!value) {
				continue
			}
			const remaining = maxBytes - total
			if (value.byteLength >= remaining) {
				chunks.push(value.slice(0, remaining))
				await reader.cancel()
				break
			}
			chunks.push(value)
			total += value.byteLength
		}
	} catch {
		await reader.cancel().catch(() => undefined)
		return null
	}

	const merged = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0))
	let offset = 0
	for (const chunk of chunks) {
		merged.set(chunk, offset)
		offset += chunk.byteLength
	}
	return new TextDecoder("utf-8", { fatal: false }).decode(merged)
}

async function fetchSafe(url: string, init: RequestInit = {}) {
	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
	let current = url

	try {
		for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
			if (!(await isSafeDestination(current))) {
				return null
			}

			const response = await fetch(current, {
				...init,
				redirect: "manual",
				cache: "no-store",
				signal: controller.signal,
			})

			if ([301, 302, 303, 307, 308].includes(response.status)) {
				const location = response.headers.get("location")
				await response.body?.cancel().catch(() => undefined)
				if (!location) {
					return null
				}
				current = new URL(location, current).toString()
				continue
			}

			return response
		}
		return null
	} catch {
		return null
	} finally {
		clearTimeout(timeout)
	}
}

async function fetchHtml(url: string) {
	const response = await fetchSafe(url, { headers: BROWSER_HEADERS })
	if (!response?.ok) {
		return null
	}
	return readLimitedText(response)
}

function isMercadoLivreUrl(url: string) {
	try {
		return MERCADO_LIVRE_HOST.test(new URL(url).hostname)
	} catch {
		return false
	}
}

function shopifyHandlePath(url: string) {
	try {
		return new URL(url).pathname.match(/\/products\/[^/]+/)?.[0] ?? null
	} catch {
		return null
	}
}

async function fetchJson(url: string) {
	const response = await fetchSafe(url, {
		headers: { ...BROWSER_HEADERS, Accept: "application/json,text/javascript,*/*" },
	})
	if (!response?.ok) {
		return null
	}
	const text = await readLimitedText(response)
	if (!text) {
		return null
	}
	try {
		return JSON.parse(text)
	} catch {
		return null
	}
}

async function fetchShopifyProduct(url: string): Promise<ProductFromLink | null> {
	const path = shopifyHandlePath(url)
	if (!path) {
		return null
	}

	const parsedUrl = new URL(url)
	const data = (await fetchJson(`${parsedUrl.origin}${path}.json`)) as { product?: Record<string, unknown> } | null
	const product = data?.product
	if (!product) {
		return null
	}

	const variants = Array.isArray(product.variants) ? (product.variants as Record<string, unknown>[]) : []
	const variantId = parsedUrl.searchParams.get("variant")
	const variant =
		(variantId ? variants.find((item) => String(item.id) === variantId) : undefined) ?? variants[0] ?? {}
	const current = centsFromScraped(variant.price ?? product.price)
	const original = centsFromScraped(variant.compare_at_price ?? product.compare_at_price)
	const listPrice = original && current ? Math.max(original, current) : original || current
	const image =
		(typeof product.featured_image === "string" && product.featured_image) ||
		(product.image && typeof product.image === "object" && "src" in product.image
			? String((product.image as { src: string }).src)
			: undefined) ||
		(Array.isArray(product.images) && product.images[0] && typeof product.images[0] === "object"
			? String((product.images[0] as { src?: string }).src ?? "")
			: undefined)

	const name = typeof product.title === "string" ? product.title : undefined
	if (!name && listPrice == null) {
		return null
	}

	return {
		...(name ? { name } : {}),
		store: storeFromUrl(url),
		...(listPrice != null ? { price: listPrice } : {}),
		...(image ? { imageUrl: image.startsWith("//") ? `https:${image}` : image } : {}),
	}
}

async function fetchMercadoLivreApi(url: string): Promise<ProductFromLink | null> {
	if (!isMercadoLivreUrl(url)) {
		return null
	}

	const { itemId, productId } = extractMercadoLivreIds(url)
	const ids = [itemId, productId].filter(Boolean) as string[]

	for (const id of ids) {
		const endpoints = [
			`https://api.mercadolibre.com/items/${id}`,
			`https://api.mercadolibre.com/products/${id}`,
		]
		for (const endpoint of endpoints) {
			const response = await fetchSafe(endpoint, {
				headers: { Accept: "application/json", "User-Agent": BROWSER_HEADERS["User-Agent"] },
			})
			if (!response?.ok) {
				continue
			}
			const text = await readLimitedText(response)
			if (!text) {
				continue
			}
			try {
				const data = JSON.parse(text) as {
					title?: string
					name?: string
					price?: number
					original_price?: number | null
					thumbnail?: string
					pictures?: { url?: string }[]
				}
				const name = data.title || data.name
				const originalPrice = centsFromScraped(data.original_price || data.price)
				const imageUrl = data.pictures?.[0]?.url || data.thumbnail
				if (!name && originalPrice == null) {
					continue
				}
				return {
					...(name ? { name } : {}),
					store: storeFromUrl(url),
					...(originalPrice != null ? { price: originalPrice } : {}),
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

	if (!(await isSafeDestination(trimmed))) {
		return fallback
	}

	let result: ProductFromLink = { ...fallback }
	const hasShopifyPath = Boolean(shopifyHandlePath(trimmed))
	const isMercadoLivre = isMercadoLivreUrl(trimmed)

	if (hasShopifyPath) {
		const fromShopify = await fetchShopifyProduct(trimmed)
		if (fromShopify) {
			result = { ...result, ...fromShopify }
		}
		if (result.name && result.price) {
			return result
		}
	}

	if (isMercadoLivre) {
		const fromApi = await fetchMercadoLivreApi(trimmed)
		if (fromApi) {
			result = { ...result, ...fromApi }
		}
		if (result.name && result.price) {
			return result
		}
	}

	const html = (await fetchHtml(trimmed)) || ""
	const usableHtml =
		html && !isBlockedProductHtml(html) ? html : (await fetchHtml(translateProxyUrl(trimmed))) || html

	if (!usableHtml) {
		return result
	}

	return {
		...parseProductHtml(usableHtml, trimmed),
		...result,
	}
}
