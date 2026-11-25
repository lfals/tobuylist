import { Caveat, Gloock, Hanken_Grotesk } from "next/font/google"

// Importadas só pela landing, então o app não paga o custo dessas fontes.
export const displayFont = Gloock({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-landing-display",
	display: "swap",
})

// Letra de mão, usada só onde a pessoa "escreve": as lacunas da frase.
export const handFont = Caveat({
	subsets: ["latin"],
	weight: ["600", "700"],
	variable: "--font-landing-hand",
	display: "swap",
})

export const bodyFont = Hanken_Grotesk({
	subsets: ["latin"],
	variable: "--font-landing-body",
	display: "swap",
})
