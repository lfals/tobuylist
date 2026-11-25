import { ImageResponse } from "next/og"

export const alt = "To Buy List: anote o que quer comprar e veja quanto vai gastar"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const ink = "#161513"
const orange = "#D4410D"

export default function OpengraphImage() {
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
					<span>Eu quero comprar</span>
					<span style={{ color: orange, borderBottom: `6px solid ${ink}`, margin: "0 24px 0 20px" }}>um tênis</span>
					<span>por R$</span>
					<span style={{ color: orange, borderBottom: `6px solid ${ink}`, margin: "0 4px 0 20px" }}>389,00</span>
					<span>.</span>
				</div>

				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
					<div style={{ fontSize: 30, color: "#5E5A52" }}>Anote o que quer comprar. Veja quanto vai gastar.</div>
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
