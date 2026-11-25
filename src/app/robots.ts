import { siteConfig } from "@/lib/site"
import type { MetadataRoute } from "next"

// Rastreadores de IA que queremos explicitamente liberados para a página pública.
// Treinamento (GPTBot, Google-Extended, ...), busca (OAI-SearchBot, Claude-SearchBot, PerplexityBot)
// e acesso sob demanda a pedido de um usuário (ChatGPT-User, Claude-User, Perplexity-User).
const aiCrawlers = [
	"GPTBot",
	"OAI-SearchBot",
	"ChatGPT-User",
	"ClaudeBot",
	"Claude-SearchBot",
	"Claude-User",
	"PerplexityBot",
	"Perplexity-User",
	"Google-Extended",
	"Applebot-Extended",
	"CCBot",
]

// A área logada e a API exigem login, então não há nada útil para indexar nelas.
const privateAreas = ["/app", "/api/"]

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{ userAgent: "*", allow: "/", disallow: privateAreas },
			{ userAgent: aiCrawlers, allow: ["/", "/llms.txt", "/en/llms.txt"], disallow: privateAreas },
		],
		sitemap: `${siteConfig.url}/sitemap.xml`,
	}
}
