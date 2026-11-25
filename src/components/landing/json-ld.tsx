import { siteConfig } from "@/lib/site"
import { faqs, features } from "./content"

// Dados estruturados que buscadores e assistentes de IA leem para entender o produto.
// Só afirma o que a página já diz; não inclui preço porque o app não o publica.
const graph = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebSite",
			"@id": `${siteConfig.url}/#website`,
			url: siteConfig.url,
			name: siteConfig.name,
			description: siteConfig.description,
			inLanguage: siteConfig.locale,
		},
		{
			"@type": "WebApplication",
			"@id": `${siteConfig.url}/#app`,
			url: siteConfig.url,
			name: siteConfig.name,
			description: siteConfig.description,
			applicationCategory: "ShoppingApplication",
			operatingSystem: "Qualquer sistema com navegador web",
			browserRequirements: "Requer JavaScript",
			inLanguage: siteConfig.locale,
			featureList: features.map((feature) => feature.title),
			isPartOf: { "@id": `${siteConfig.url}/#website` },
		},
		{
			"@type": "FAQPage",
			"@id": `${siteConfig.url}/#faq`,
			inLanguage: siteConfig.locale,
			mainEntity: faqs.map((faq) => ({
				"@type": "Question",
				name: faq.question,
				acceptedAnswer: { "@type": "Answer", text: faq.answer },
			})),
		},
	],
}

export function LandingJsonLd() {
	return (
		<script
			type="application/ld+json"
			// "<" escapado para o conteúdo nunca fechar a tag <script> por acidente.
			dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
		/>
	)
}
