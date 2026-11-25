import { Link } from "@/i18n/navigation"
import { localeMeta, routing, type Locale } from "@/i18n/routing"
import { getTranslations } from "next-intl/server"

// Troca o idioma da landing navegando para a URL do outro idioma (/ ou /en), com hreflang,
// para que buscadores e assistentes de IA descubram as duas versões.
// Com mais de dois idiomas, troque estes links por um menu.
export async function LandingLocaleSwitcher({ locale, className }: { locale: Locale; className?: string }) {
	const t = await getTranslations({ locale, namespace: "Locale" })
	const others = routing.locales.filter((code) => code !== locale)

	return (
		<>
			{others.map((code) => (
				<Link
					key={code}
					href="/"
					locale={code}
					hrefLang={code}
					lang={code}
					title={localeMeta[code].name}
					aria-label={`${t("label")}: ${localeMeta[code].name}`}
					className={`inline-flex h-10 items-center rounded-md px-2.5 text-[15px] font-medium text-lp-muted underline-offset-4 transition-colors hover:text-lp-ink hover:underline ${className ?? ""}`}
				>
					{localeMeta[code].short}
				</Link>
			))}
		</>
	)
}
