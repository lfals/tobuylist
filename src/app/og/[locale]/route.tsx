import { routing } from "@/i18n/routing"
import { hasLocale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { ImageResponse } from "next/og"

// Imagem de preview (Open Graph/Twitter) da landing, uma por idioma: /og/pt-BR e /og/en.
const size = { width: 1200, height: 630 }

const ink = "#161513"
const orange = "#D4410D"

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params
	if (!hasLocale(routing.locales, locale)) {
		return new Response("Not found", { status: 404 })
	}

	const t = await getTranslations({ locale, namespace: "Landing.og" })

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					padding: "64px 80px",
					background: "#F3F1EC",
					color: ink,
				}}
			>
				<div style={{ fontSize: 34, fontWeight: 700 }}>to buy list</div>

				<div style={{ display: "flex", flexWrap: "wrap", fontSize: 76, lineHeight: 1.22, fontWeight: 700 }}>
					<span>{t("wantToBuy")}</span>
					<span style={{ color: orange, borderBottom: `6px solid ${ink}`, margin: "0 24px 0 20px" }}>{t("item")}</span>
					<span>{t("priceLead")}</span>
					<span style={{ color: orange, borderBottom: `6px solid ${ink}`, margin: "0 4px 0 20px" }}>{t("price")}</span>
					<span>.</span>
				</div>

				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
					<div style={{ fontSize: 30, color: "#5E5A52" }}>{t("tagline")}</div>
					<div style={{ display: "flex", background: ink, color: "#F3F1EC", borderRadius: 24, padding: "14px 28px", fontSize: 40, fontWeight: 700 }}>
						<span style={{ color: "#FF7A45", marginRight: 12 }}>R$</span>
						<span>846,30</span>
					</div>
				</div>
			</div>
		),
		size,
	)
}
