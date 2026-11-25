import type { Locale } from "@/i18n/routing"
import { getTranslations } from "next-intl/server"

// Fonte única do texto da landing: usada pela página, pelo JSON-LD e pelo llms.txt.
// O texto fica em messages/<idioma>.json (namespace "Landing"). Só descreva lá o que o app realmente faz.

type Feature = { title: string; text: string }
type Step = { title: string; text: string }
type Faq = { question: string; answer: string }

export async function getLandingContent(locale: Locale) {
	const t = await getTranslations({ locale, namespace: "Landing" })

	return {
		features: t.raw("features") as Feature[],
		steps: t.raw("steps") as Step[],
		// Frases que completam "Serve para…" na página.
		useCases: t.raw("useCases") as string[],
		faqs: t.raw("faqs") as Faq[],
	}
}
