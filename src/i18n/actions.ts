"use server"

import { hasLocale } from "next-intl"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { LOCALE_COOKIE, routing } from "./routing"

// Guarda a escolha de idioma de quem está na área logada ou numa lista compartilhada.
export async function setLocale(locale: string) {
	if (!hasLocale(routing.locales, locale)) {
		return
	}

	;(await cookies()).set(LOCALE_COOKIE, locale, {
		path: "/",
		maxAge: 60 * 60 * 24 * 365,
		sameSite: "lax",
	})
	revalidatePath("/", "layout")
}
