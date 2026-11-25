import { landingPath, routing } from "@/i18n/routing"
import { siteConfig } from "@/lib/site"
import type { MetadataRoute } from "next"

// Uma entrada por idioma da landing, cada uma apontando para as demais (hreflang).
export default function sitemap(): MetadataRoute.Sitemap {
	const languages = Object.fromEntries(
		routing.locales.map((locale) => [locale, `${siteConfig.url}${landingPath(locale)}`]),
	)

	return routing.locales.map((locale) => ({
		url: `${siteConfig.url}${landingPath(locale)}`,
		changeFrequency: "monthly",
		priority: locale === routing.defaultLocale ? 1 : 0.9,
		alternates: { languages },
	}))
}
