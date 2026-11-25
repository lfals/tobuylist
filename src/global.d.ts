import type { routing } from "./i18n/routing"

// Tipa só o idioma (ex.: useLocale() devolve "pt-BR" | "en"). As chaves de tradução não são tipadas
// porque o next-intl só tipa os argumentos ICU ({name}, plural) com o plugin experimental
// createMessagesDeclaration; em vez disso `pnpm i18n:check` confere que os arquivos têm as mesmas chaves.
declare module "next-intl" {
	interface AppConfig {
		Locale: (typeof routing.locales)[number]
	}
}
