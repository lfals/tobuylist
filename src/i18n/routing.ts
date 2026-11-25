import { defineRouting } from "next-intl/routing"

// Idiomas suportados. Para adicionar um novo: inclua o código aqui, em `localeMeta`,
// crie `messages/<codigo>.json` (rode `pnpm i18n:check`) e, se quiser tradução do
// modal de login, adicione o pacote do Clerk em `clerkLocalizations` (src/i18n/clerk.ts).
export const routing = defineRouting({
	locales: ["pt-BR", "en"],
	defaultLocale: "pt-BR",
	// Só a landing tem o idioma na URL (/ em português, /en em inglês), para buscadores e IAs
	// indexarem cada versão. A área logada e /s/[id] não mudam de URL: o idioma vem do cookie.
	localePrefix: "as-needed",
})

export type Locale = (typeof routing.locales)[number]

export const LOCALE_COOKIE = "NEXT_LOCALE"

export const localeMeta: Record<Locale, { name: string; short: string; ogLocale: string }> = {
	"pt-BR": { name: "Português", short: "PT", ogLocale: "pt_BR" },
	en: { name: "English", short: "EN", ogLocale: "en_US" },
}

// Caminho público da landing em cada idioma.
export function landingPath(locale: Locale) {
	return locale === routing.defaultLocale ? "/" : `/${locale}`
}
