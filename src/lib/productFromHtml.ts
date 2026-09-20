import { centsFromScraped, type Cents } from "./money"
import { isUsableItemImage } from "./itemImage"
import { storeFromUrl } from "./storeFromUrl"

export type ProductFromLink = {
	name?: string
	store?: string
	price?: Cents
	imageUrl?: string
}

function getMeta(html: string, key: string) {
	const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	const name = `\\s(?:property|name)\\s*=\\s*(?:["']${escaped}["']|${escaped}(?=[\\s/>]))`
	const content = `content\\s*=\\s*(?:["']([^"']*)["']|([^\\s>]+))`
	const propertyFirst = html.match(new RegExp(`<meta\\b[^>]*${name}[^>]*\\s${content}`, "i"))
	const fromProperty = propertyFirst?.[1] ?? propertyFirst?.[2]
	if (fromProperty) {
		return decodeHtml(fromProperty)
	}

	const contentFirst = html.match(new RegExp(`<meta\\b[^>]*\\s${content}[^>]*${name}`, "i"))
	const fromContent = contentFirst?.[1] ?? contentFirst?.[2]
	return fromContent ? decodeHtml(fromContent) : undefined
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

function cleanProductName(name: string) {
	return name
		.replace(/\s+[|\-–—]\s+(Mercado\s*Livre|MercadoLivre)\s*$/i, "")
		.replace(/\s+[|\-–—]\s*R\$\s*[\d.]+,\d{2}\s*$/i, "")
		.replace(/\s+[|\-–—]\s*R\$\s*[\d.]+\s*$/i, "")
		.replace(/\s+\|\s+[^\n|]{1,40}$/u, "")
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
	for (const key of ["@graph", "hasVariant", "variesBy", "offers", "priceSpecification", "itemListElement", "mainEntity"]) {
		if (record[key]) {
			flattenJsonLd(record[key], acc)
		}
	}
	return acc
}

function jsonLdTypes(record: Record<string, unknown>) {
	const type = record["@type"]
	if (Array.isArray(type)) {
		return type.map((item) => String(item).toLowerCase())
	}
	return type ? [String(type).toLowerCase()] : []
}

function isType(record: Record<string, unknown>, expected: string) {
	return jsonLdTypes(record).some((type) => type === expected.toLowerCase() || type.endsWith("/" + expected.toLowerCase()))
}

type OfferPrices = {
	price?: number
	originalPrice?: number
}

function offerFromUnknown(offers: unknown): OfferPrices {
	const list = Array.isArray(offers) ? offers : offers ? [offers] : []
	for (const offer of list) {
		if (!offer || typeof offer !== "object") {
			continue
		}
		const parsed = offerFromRecord(offer as Record<string, unknown>)
		if (parsed.price != null || parsed.originalPrice != null) {
			return parsed
		}
	}
	return {}
}

function offerFromRecord(record: Record<string, unknown>): OfferPrices {
	const spec = record.priceSpecification
	const fromSpec = spec && typeof spec === "object" && spec !== record ? offerFromUnknown(spec) : {}
	const price =
		centsFromScraped(record.price) ??
		centsFromScraped(record.lowPrice) ??
		centsFromScraped(record.priceAmount) ??
		fromSpec.price
	const originalPrice =
		centsFromScraped(record.original_price) ??
		centsFromScraped(record.originalPrice) ??
		centsFromScraped(record.listPrice) ??
		centsFromScraped(record.compareAtPrice) ??
		centsFromScraped(record.compare_at_price) ??
		fromSpec.originalPrice

	if (price == null && originalPrice == null) {
		return {}
	}

	return { price, originalPrice }
}

function productFromJsonLd(html: string) {
	const nodes = flattenJsonLd(collectJsonLd(html))
	const offers = nodes.filter((node) => isType(node, "offer") || isType(node, "aggregateoffer"))
	const products = nodes.filter((node) => isType(node, "product") && !isType(node, "productgroup"))
	const groups = nodes.filter((node) => isType(node, "productgroup"))

	const groupName = typeof groups[0]?.name === "string" && groups[0].name.trim() ? String(groups[0].name) : undefined
	const namedProduct = products.find((node) => typeof node.name === "string" && node.name.trim())
	const productWithImage = products.find((node) => node.image)
	const product = namedProduct || productWithImage || products[0] || groups[0]

	const firstOffer = offerFromUnknown(offers)
	const groupVariant = groups[0]?.hasVariant
	const firstVariant = Array.isArray(groupVariant) ? groupVariant[0] : groupVariant
	const variantOffer =
		firstVariant && typeof firstVariant === "object"
			? offerFromUnknown((firstVariant as Record<string, unknown>).offers)
			: {}

	const image = product?.image ?? (firstVariant && typeof firstVariant === "object" ? (firstVariant as Record<string, unknown>).image : undefined)
	const imageUrl = imageUrlFromUnknown(image)
	const name =
		groupName ||
		(typeof namedProduct?.name === "string" && namedProduct.name) ||
		(firstVariant && typeof firstVariant === "object" && typeof (firstVariant as Record<string, unknown>).name === "string"
			? String((firstVariant as Record<string, unknown>).name)
			: undefined) ||
		(typeof product?.name === "string" ? product.name : undefined)

	return {
		name: name ? cleanProductName(name) : undefined,
		imageUrl,
		...firstOffer,
		...(firstOffer.price == null && firstOffer.originalPrice == null ? variantOffer : {}),
	}
}

function imageUrlFromUnknown(image: unknown): string | undefined {
	if (!image) {
		return undefined
	}
	if (Array.isArray(image)) {
		return imageUrlFromUnknown(image[0])
	}
	if (typeof image === "string") {
		return image
	}
	if (typeof image === "object" && image && "url" in image) {
		return String((image as { url: string }).url)
	}
	if (typeof image === "object" && image && "src" in image) {
		return String((image as { src: string }).src)
	}
	return undefined
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

function microdataPrice(html: string) {
	const contentFirst = html.match(/itemprop=["']price["'][^>]*content=["']([^"']+)["']/i)
	if (contentFirst?.[1]) {
		return centsFromScraped(contentFirst[1])
	}
	const propertyFirst = html.match(/content=["']([^"']+)["'][^>]*itemprop=["']price["']/i)
	if (propertyFirst?.[1]) {
		return centsFromScraped(propertyFirst[1])
	}
	return undefined
}

function quotedDecimalPrice(html: string) {
	const match = html.match(/"(?:price|lowPrice|priceAmount)"\s*:\s*"([0-9]+[.,][0-9]{2})"/)
	return match?.[1] ? centsFromScraped(match[1]) : undefined
}

function pickListPrice(current?: number, original?: number) {
	if (original != null && current != null) {
		return Math.max(original, current)
	}
	return original ?? current
}

export function isBlockedProductHtml(html: string) {
	return /suspicious-traffic-frontend|account-verification|gz\/account-verification/i.test(html)
}

export function absoluteAssetUrl(url: string, sourceUrl: string) {
	if (url.startsWith("//")) {
		return `https:${url}`
	}
	try {
		return new URL(url, sourceUrl).toString()
	} catch {
		return url
	}
}

export function parseProductHtml(html: string, sourceUrl: string): ProductFromLink {
	const jsonLd = productFromJsonLd(html)
	const ogPrice = centsFromScraped(getMeta(html, "og:price:amount") || getMeta(html, "product:price:amount"))
	const originalPrice = centsFromScraped(originalPriceFromHtml(html)) ?? jsonLd.originalPrice
	const currentPrice = jsonLd.price ?? ogPrice ?? microdataPrice(html) ?? quotedDecimalPrice(html)
	const priceValue = pickListPrice(currentPrice, originalPrice)

	const rawName =
		jsonLd.name ||
		getMeta(html, "twitter:title") ||
		getMeta(html, "og:title") ||
		html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]

	const name = rawName ? cleanProductName(decodeHtml(rawName)) : undefined
	const imageUrl = jsonLd.imageUrl || getMeta(html, "og:image") || getMeta(html, "twitter:image")
	const store = storeFromUrl(sourceUrl)
	const resolvedImage = imageUrl ? absoluteAssetUrl(imageUrl, sourceUrl) : undefined

	return {
		...(name ? { name } : {}),
		...(store ? { store } : {}),
		...(priceValue != null ? { price: priceValue } : {}),
		...(resolvedImage && isUsableItemImage(resolvedImage) ? { imageUrl: resolvedImage } : {}),
	}
}
