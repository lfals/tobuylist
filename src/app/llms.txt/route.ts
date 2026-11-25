import { faqs, features, steps, useCases } from "@/components/landing/content"
import { siteConfig } from "@/lib/site"

// Resumo em Markdown para modelos de linguagem (convenção llms.txt), gerado do mesmo
// conteúdo da landing para os dois nunca divergirem.
export const dynamic = "force-static"

export function GET() {
	const body = `# ${siteConfig.name}

> ${siteConfig.description}

${siteConfig.name} é um app web em português (pt-BR) para montar listas de compras. Cada item guarda nome, loja, preço, quantidade, link e imagem, e a lista calcula o total sozinha. A área de listas exige login; a página inicial é pública.

## O que o app faz

${features.map((feature) => `- **${feature.title}**: ${feature.text}`).join("\n")}

## Como usar

${steps.map((step, index) => `${index + 1}. **${step.title}**: ${step.text}`).join("\n")}

## Exemplos de uso

${useCases.map((useCase) => `- ${useCase}`).join("\n")}

## Perguntas frequentes

${faqs.map((faq) => `### ${faq.question}\n\n${faq.answer}`).join("\n\n")}

## Links

- [Página inicial](${siteConfig.url}/): apresentação do app e botão de entrada
- [Sitemap](${siteConfig.url}/sitemap.xml)
`

	return new Response(body, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=3600, s-maxage=86400",
		},
	})
}
