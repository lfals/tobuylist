import { LandingJsonLd } from "@/components/landing/json-ld"
import { Landing } from "@/components/landing/landing"
import { landingPath, localeMeta, routing, type Locale } from "@/i18n/routing"
import { siteConfig } from "@/lib/site"
import { GoogleOneTap } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { hasLocale } from "next-intl"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params
	if (!hasLocale(routing.locales, locale)) {
		return {}
	}

	const t = await getTranslations({ locale, namespace: "Meta" })
	const path = landingPath(locale)
	const image = { url: `/og/${locale}`, width: 1200, height: 630, alt: t("landingOgAlt") }

	return {
		title: { absolute: t("title") },
		description: t("description"),
		alternates: {
			canonical: path,
			languages: {
				...Object.fromEntries(routing.locales.map((code) => [code, landingPath(code)])),
				"x-default": landingPath(routing.defaultLocale),
			},
		},
		openGraph: {
			type: "website",
			url: path,
			siteName: siteConfig.name,
			locale: localeMeta[locale].ogLocale,
			alternateLocale: routing.locales.filter((code) => code !== locale).map((code: Locale) => localeMeta[code].ogLocale),
			title: t("title"),
			description: t("description"),
			images: [image],
		},
		twitter: {
			card: "summary_large_image",
			title: t("title"),
			description: t("description"),
			images: [image],
		},
	}
}

export default async function Home({ params }: Props) {
	const { locale } = await params
	if (!hasLocale(routing.locales, locale)) {
		notFound()
	}

	const { userId } = await auth()

	if (userId) {
		redirect("/app")
	}

	return (
		<>
			<LandingJsonLd locale={locale} />
			<GoogleOneTap />
			<Landing locale={locale} />
		</>
	)
}
