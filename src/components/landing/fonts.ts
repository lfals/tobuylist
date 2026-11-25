import localFont from "next/font/local"

// Hospedadas no repositório (OFL, latin) em vez de next/font/google: o build não depende de baixar
// fontes do Google, que já derrubou o deploy quando passou a devolver URLs sem extensão.
// Importadas só pela landing, então o app não paga o custo dessas fontes.
export const displayFont = localFont({
	src: "./fonts/Gloock-Regular.woff2",
	weight: "400",
	variable: "--font-landing-display",
	display: "swap",
})

// Letra de mão, usada só onde a pessoa "escreve": as lacunas da frase.
export const handFont = localFont({
	src: "./fonts/Caveat-var.woff2",
	weight: "400 700",
	variable: "--font-landing-hand",
	display: "swap",
})

export const bodyFont = localFont({
	src: "./fonts/HankenGrotesk-var.woff2",
	weight: "100 900",
	variable: "--font-landing-body",
	display: "swap",
})
