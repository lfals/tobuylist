import { enUS, ptBR } from "@clerk/localizations"
import type { ClerkProvider } from "@clerk/nextjs"
import type { ComponentProps } from "react"
import type { Locale } from "./routing"

type Localization = NonNullable<ComponentProps<typeof ClerkProvider>["localization"]>

// Textos do modal de login/cadastro e do botão de usuário do Clerk.
export const clerkLocalizations: Record<Locale, Localization> = {
	"pt-BR": ptBR as Localization,
	en: enUS as Localization,
}
