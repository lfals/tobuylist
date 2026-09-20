export function isUsableItemImage(url: string) {
	try {
		const parsed = new URL(url)
		if (parsed.protocol !== "https:") {
			return false
		}
		return !/\.svg(?:$|\?)/i.test(parsed.pathname)
	} catch {
		return false
	}
}
