import { formatViewNumber } from "@/lib/format-number"
import { getSharedListItems, getSharedListSummary } from "@/services/lists-queries"
import { getTranslations } from "next-intl/server"
import { ImageResponse } from "next/og"

// O alt precisa ser estático, então fica sem idioma; o texto da imagem em si segue o idioma do request.
export const alt = "To Buy List"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const ink = "#161513"
const orange = "#D4410D"

export default async function SharedListImage({ params }: { params: Promise<{ list: string }> }) {
	const { list } = await params
	const [t, summary, items] = await Promise.all([
		getTranslations("SharedList.og"),
		getSharedListSummary(list),
		getSharedListItems(list),
	])

	const name = summary?.name ?? t("fallbackName")
	const count = items?.filter((item) => item.isActive).length ?? 0
	const total = summary ? formatViewNumber(summary.totalValue.toString()) : null
	const title = name.length > 60 ? `${name.slice(0, 57)}...` : name

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

				<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
					<div style={{ fontSize: 30, color: "#5E5A52" }}>{t("sharedWithYou")}</div>
					<div style={{ display: "flex", fontSize: 88, lineHeight: 1.1, fontWeight: 700, color: orange }}>{title}</div>
				</div>

				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
					<div style={{ fontSize: 30, color: "#5E5A52" }}>
						{summary ? t("itemCount", { count }) : t("openLink")}
					</div>
					{total ? (
						<div style={{ display: "flex", background: ink, color: "#F3F1EC", borderRadius: 24, padding: "14px 28px", fontSize: 44, fontWeight: 700 }}>
							{total}
						</div>
					) : null}
				</div>
			</div>
		),
		size,
	)
}
