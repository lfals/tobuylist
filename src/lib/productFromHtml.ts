import { storeFromUrl } from "./storeFromUrl"

export type ProductFromLink = {
	name?: string
	store?: string
	price?: string
	imageUrl?: string
}

function getMeta(html: string, key: string) {
	const propertyFirst = html.match(
		new RegExp(`<meta[^>]*(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`, "i"),
	)
	if (propertyFirst?.[1]) {
		return decodeHtml(propertyFirst[1])
	}

	const contentFirst = html.match(
		new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, "i"),
	)
	return contentFirst?.[1] ? decodeHtml(contentFirst[1]) : undefined
}

function decodeHtml(value: string) {
	return value
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.trim()
}

function toNumber(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value
	}
	if (typeof value !== "string") {
		return undefined
	}
	const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")
	const parsed = Number(normalized)
	return Number.isFinite(parsed) ? parsed : undefined
}

export function formatBRL(value: number) {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value)
}

function cleanProductName(name: string) {
	return name
		.replace(/\s+[|\-–—]\s+(Mercado\s*Livre|MercadoLivre)\s*$/i, "")
		.replace(/\s+[|\-–—]\s*R\$\s*[\d.]+,\d{2}\s*$/i, "")
		.replace(/\s+[|\-–—]\s*R\$\s*[\d.]+\s*$/i, "")
		.trim()
}

function collectJsonLd(html: string): unknown[] {
	const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
	const docs: unknown[] = []

	for (const block of blocks) {
		const raw = block[1].replace(/<!--[\s\S]*?-->/g, "").trim()
		if (!raw) {
			continue
		}
		try {
			docs.push(JSON.parse(raw))
		} catch {
			continue
		}
	}

	return docs
}

function flattenJsonLd(input: unknown, acc: Record<string, unknown>[] = []) {
	if (!input) {
		return acc
	}
	if (Array.isArray(input)) {
		for (const item of input) {
			flattenJsonLd(item, acc)
		}
		return acc
	}
	if (typeof input !== "object") {
		return acc
	}

	const record = input as Record<string, unknown>
	acc.push(record)
	if (record["@graph"]) {
		flattenJsonLd(record["@graph"], acc)
	}
	return acc
}

function jsonLdType(record: Record<string, unknown>) {
	const type = record["@type"]
	if (Array.isArray(type)) {
		return type.map(String)
	}
	return type ? [String(type)] : []
}

function offerPrice(offers: unknown): { price?: number; originalPrice?: number } {
	const list = Array.isArray(offers) ? offers : offers ? [offers] : []
	for (const offer of list) {
		if (!offer || typeof offer !== "object") {
			continue
		}
		const record = offer as Record<string, unknown>
		const originalPrice =
			toNumber(record.original_price) ??
			toNumber(record.originalPrice) ??
			toNumber(record.listPrice) ??
			toNumber(record.highPrice)
		const price = toNumber(record.price) ?? toNumber(record.lowPrice)
		if (originalPrice != null || price != null) {
			return { price, originalPrice }
		}
	}
	return {}
}

function productFromJsonLd(html: string) {
	const products = flattenJsonLd(collectJsonLd(html)).filter((record) =>
		jsonLdType(record).some((type) => type.toLowerCase().includes("product")),
	)

	const product = products[0]
	if (!product) {
		return {}
	}

	const image = product.image
	const imageUrl = Array.isArray(image)
		? typeof image[0] === "string"
			? image[0]
			: typeof image[0] === "object" && image[0] && "url" in image[0]
				? String((image[0] as { url: string }).url)
				: undefined
		: typeof image === "string"
			? image
			: typeof image === "object" && image && "url" in image
				? String((image as { url: string }).url)
				: undefined

	return {
		name: typeof product.name === "string" ? cleanProductName(product.name) : undefined,
		imageUrl,
		...offerPrice(product.offers),
	}
}

function originalPriceFromHtml(html: string) {
	const paired = html.match(/"price"\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*,\s*"original_price"\s*:\s*([0-9]+(?:\.[0-9]+)?|null)/)
	if (paired?.[2] && paired[2] !== "null") {
		return Number(paired[2])
	}

	const original = html.match(/"original_price"\s*:\s*([0-9]+(?:\.[0-9]+)?)/)
	if (original?.[1]) {
		return Number(original[1])
	}

	const beforeLabel = html.match(/Antes:\s*([\d.]+)\s*reais/i)
	if (beforeLabel?.[1]) {
		return Number(beforeLabel[1].replace(/\./g, ""))
	}

	return undefined
}

function currentPriceFromHtml(html: string) {
	const paired = html.match(/"price"\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*,\s*"original_price"\s*:/)
	if (paired?.[1]) {
		return Number(paired[1])
	}

	const jsonLdPrice = productFromJsonLd(html).price
	if (jsonLdPrice != null) {
		return jsonLdPrice
	}

	const ogTitle = getMeta(html, "og:title")
	const titlePrice = ogTitle?.match(/R\$\s*([\d.]+(?:,\d{2})?)/)
	if (titlePrice?.[1]) {
		return toNumber(titlePrice[1])
	}

	return undefined
}

export function isBlockedProductHtml(html: string) {
	return /suspicious-traffic-frontend|account-verification|gz\/account-verification/i.test(html)
}

export function parseProductHtml(html: string, sourceUrl: string): ProductFromLink {
	const jsonLd = productFromJsonLd(html)
	const originalPrice = originalPriceFromHtml(html) ?? jsonLd.originalPrice
	const currentPrice = jsonLd.price ?? currentPriceFromHtml(html)
	const priceValue = originalPrice ?? currentPrice

	const rawName =
		jsonLd.name ||
		getMeta(html, "twitter:title") ||
		getMeta(html, "og:title") ||
		html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]

	const name = rawName ? cleanProductName(decodeHtml(rawName)) : undefined
	const imageUrl = jsonLd.imageUrl || getMeta(html, "og:image") || getMeta(html, "twitter:image")
	const store = storeFromUrl(sourceUrl)

	return {
		...(name ? { name } : {}),
		...(store ? { store } : {}),
		...(priceValue != null ? { price: formatBRL(priceValue) } : {}),
		...(imageUrl ? { imageUrl } : {}),
	}
}
