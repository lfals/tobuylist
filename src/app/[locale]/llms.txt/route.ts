import { getLandingContent } from "@/components/landing/content"
import { landingPath, routing } from "@/i18n/routing"
import { siteConfig } from "@/lib/site"
import { hasLocale } from "next-intl"
import { getTranslations } from "next-intl/server"

// Resumo em Markdown para modelos de linguagem (convenção llms.txt), gerado do mesmo
// conteúdo da landing para os dois nunca divergirem. /llms.txt é pt-BR e /en/llms.txt é inglês.
export const dynamic = "force-static"

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params
	if (!hasLocale(routing.locales, locale)) {
		return new Response("Not found", { status: 404 })
	}

	const [t, meta, { features, steps, useCases, faqs }] = await Promise.all([
		getTranslations({ locale, namespace: "Llms" }),
		getTranslations({ locale, namespace: "Meta" }),
		getLandingContent(locale),
	])

	const home = `${siteConfig.url}${landingPath(locale)}`

	const body = `# ${siteConfig.name}

> ${meta("description")}

${t("intro", { name: siteConfig.name })}

## ${t("whatItDoes")}

${features.map((feature) => `- **${feature.title}**: ${feature.text}`).join("\n")}

## ${t("howToUse")}

${steps.map((step, index) => `${index + 1}. **${step.title}**: ${step.text}`).join("\n")}

## ${t("examples")}

${useCases.map((useCase) => `- ${useCase}`).join("\n")}

## ${t("faq")}

${faqs.map((faq) => `### ${faq.question}\n\n${faq.answer}`).join("\n\n")}

## ${t("links")}

- [${t("homeLink")}](${home}): ${t("homeLinkDescription")}
- [${t("sitemap")}](${siteConfig.url}/sitemap.xml)
`

	return new Response(body, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=3600, s-maxage=86400",
		},
	})
}
