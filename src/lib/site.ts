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

export const siteConfig = {
	name: "To Buy List",
	url: resolveSiteUrl(),
	locale: "pt-BR",
	title: "To Buy List: listas de compras com preço, link e total",
	description:
		"Monte listas de compras com nome, loja, preço e link de cada item, veja o total na hora e compartilhe a lista com quem vai comprar junto. Funciona no navegador, no celular e no computador.",
} as const
