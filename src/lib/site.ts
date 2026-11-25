function resolveSiteUrl() {
	const explicit = process.env.NEXT_PUBLIC_SITE_URL
	if (explicit) {
		return explicit.replace(/\/+$/, "")
	}

	const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL
	if (vercelProduction) {
		return `https://${vercelProduction}`
	}

	return "http://localhost:3000"
}

// Título e descrição ficam em messages/<idioma>.json (namespace "Meta"), pois mudam com o idioma.
export const siteConfig = {
	name: "To Buy List",
	url: resolveSiteUrl(),
} as const
