import { hasLocale } from "next-intl"
import { getRequestConfig } from "next-intl/server"
import { cookies, headers } from "next/headers"
import { LOCALE_COOKIE, routing, type Locale } from "./routing"

// "pt-BR,pt;q=0.9,en;q=0.8" -> primeiro idioma suportado, por ordem de preferência.
function matchAcceptLanguage(header: string | null): Locale | undefined {
	if (!header) return undefined

	const candidates = header
		.split(",")
		.map((part) => {
			const [tag, ...params] = part.trim().split(";")
			const q = params.find((param) => param.trim().startsWith("q="))
			return { tag: tag.trim().toLowerCase(), q: q ? Number.parseFloat(q.trim().slice(2)) : 1 }
		})
		.filter((candidate) => candidate.tag && candidate.tag !== "*" && candidate.q > 0)
		.sort((a, b) => b.q - a.q)

	for (const { tag } of candidates) {
		const exact = routing.locales.find((locale) => locale.toLowerCase() === tag)
		if (exact) return exact
		const base = tag.split("-")[0]
		const byLanguage = routing.locales.find((locale) => locale.toLowerCase().split("-")[0] === base)
		if (byLanguage) return byLanguage
	}
	return undefined
}

// Fora da landing a URL não carrega o idioma: vale o cookie (escolha explícita) e,
// sem ele, o Accept-Language do navegador.
async function detectLocale(): Promise<Locale> {
	const stored = (await cookies()).get(LOCALE_COOKIE)?.value
	if (hasLocale(routing.locales, stored)) return stored

	return matchAcceptLanguage((await headers()).get("accept-language")) ?? routing.defaultLocale
}

export default getRequestConfig(async ({ requestLocale }) => {
	// Na landing o middleware do next-intl informa o idioma pela URL.
	const requested = await requestLocale
	const locale = hasLocale(routing.locales, requested) ? requested : await detectLocale()

	return {
		locale,
		messages: (await import(`../../messages/${locale}.json`)).default,
	}
})
