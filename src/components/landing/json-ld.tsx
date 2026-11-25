import { landingPath, type Locale } from "@/i18n/routing"
import { siteConfig } from "@/lib/site"
import { getTranslations } from "next-intl/server"
import { getLandingContent } from "./content"

// Dados estruturados que buscadores e assistentes de IA leem para entender o produto.
// Só afirma o que a página já diz; não inclui preço porque o app não o publica.
export async function LandingJsonLd({ locale }: { locale: Locale }) {
	const [t, meta, { faqs, features }] = await Promise.all([
		getTranslations({ locale, namespace: "Landing.jsonLd" }),
		getTranslations({ locale, namespace: "Meta" }),
		getLandingContent(locale),
	])

	// Uma versão do site por idioma: cada uma tem a própria URL e os próprios ids.
	const pageUrl = `${siteConfig.url}${landingPath(locale)}`

	const graph = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebSite",
				"@id": `${pageUrl}#website`,
				url: pageUrl,
				name: siteConfig.name,
				description: meta("description"),
				inLanguage: locale,
			},
			{
				"@type": "WebApplication",
				"@id": `${pageUrl}#app`,
				url: pageUrl,
				name: siteConfig.name,
				description: meta("description"),
				applicationCategory: "ShoppingApplication",
				operatingSystem: t("operatingSystem"),
				browserRequirements: t("browserRequirements"),
				inLanguage: locale,
				featureList: features.map((feature) => feature.title),
				isPartOf: { "@id": `${pageUrl}#website` },
			},
			{
				"@type": "FAQPage",
				"@id": `${pageUrl}#faq`,
				inLanguage: locale,
				mainEntity: faqs.map((faq) => ({
					"@type": "Question",
					name: faq.question,
					acceptedAnswer: { "@type": "Answer", text: faq.answer },
				})),
			},
		],
	}

	return (
		<script
			type="application/ld+json"
			// "<" escapado para o conteúdo nunca fechar a tag <script> por acidente.
			dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
		/>
	)
}
