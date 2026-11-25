"use client"

import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { setLocale } from "@/i18n/actions"
import { localeMeta, routing } from "@/i18n/routing"
import { CheckIcon, LanguagesIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useTransition } from "react"

// Seletor de idioma da área logada e das listas compartilhadas (/s/[id]), que não têm idioma na URL.
// Grava o cookie por uma server action; a página é renderizada de novo já no idioma escolhido.
export function LocaleSwitcher() {
	const t = useTranslations("Locale")
	const current = useLocale()
	const [isPending, startTransition] = useTransition()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon" disabled={isPending}>
					<LanguagesIcon className="h-[1.2rem] w-[1.2rem]" />
					<span className="sr-only">{t("label")}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{routing.locales.map((locale) => (
					<DropdownMenuItem
						key={locale}
						lang={locale}
						className="justify-between gap-4"
						onClick={() => startTransition(() => setLocale(locale))}
					>
						{localeMeta[locale].name}
						{locale === current ? <CheckIcon className="size-4" aria-hidden /> : null}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
