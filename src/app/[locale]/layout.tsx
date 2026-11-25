import { routing } from "@/i18n/routing"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"

// O segmento [locale] só existe para a landing; qualquer outro valor (/foo) é 404.
// Sem generateStaticParams de propósito: a página consulta a sessão (auth) para mandar quem já está logado para /app.
export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	if (!hasLocale(routing.locales, locale)) {
		notFound()
	}

	// Componentes de cliente da landing: a demo ao vivo (Landing.demo, Landing.cta) e o botão de tema.
	const { Landing, Theme } = (await getMessages()) as {
		Landing: { demo: unknown; cta: unknown }
		Theme: unknown
	}

	return (
		<NextIntlClientProvider messages={{ Landing: { demo: Landing.demo, cta: Landing.cta }, Theme }}>
			{children}
		</NextIntlClientProvider>
	)
}
