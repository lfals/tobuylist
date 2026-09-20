export type Cents = number

function reaisToCents(reais: number): Cents | undefined {
	if (!Number.isFinite(reais) || reais <= 0) {
		return undefined
	}
	return Math.round(reais * 100)
}

function scrapedReais(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value
	}
	if (typeof value !== "string") {
		return undefined
	}

	const raw = value.trim()
	if (!raw || raw === "null") {
		return undefined
	}

	const compact = raw.replace(/[^\d,.-]/g, "")
	if (!compact || compact === "-" || compact === "." || compact === ",") {
		return undefined
	}

	const hasComma = compact.includes(",")
	const hasDot = compact.includes(".")
	let normalized = compact

	if (hasComma && hasDot) {
		if (compact.lastIndexOf(",") > compact.lastIndexOf(".")) {
			normalized = compact.replace(/\./g, "").replace(",", ".")
		} else {
			normalized = compact.replace(/,/g, "")
		}
	} else if (hasComma) {
		const fraction = compact.split(",")[1] ?? ""
		normalized = fraction.length === 2 || fraction.length === 1 ? compact.replace(",", ".") : compact.replace(/,/g, "")
	} else if (hasDot) {
		const fraction = compact.split(".")[1] ?? ""
		if (fraction.length === 3 && compact.split(".").length <= 3) {
			normalized = compact.replace(/\./g, "")
		}
	}

	const parsed = Number(normalized)
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return undefined
	}
	return parsed
}

export function centsFromInput(value: string): Cents {
	const digits = value.replace(/\D/g, "")
	if (!digits) {
		return 0
	}
	return Number(digits)
}

export function centsFromScraped(value: unknown): Cents | undefined {
	const reais = scrapedReais(value)
	if (reais == null) {
		return undefined
	}
	return reaisToCents(reais)
}

export function formatInput(cents: Cents): string {
	const reais = cents / 100
	if (!Number.isFinite(reais)) {
		return "R$ 0,00"
	}

	const amount = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(reais)
	return `R$ ${amount}`
}

export function formatDisplay(cents: Cents): string {
	const reais = cents / 100
	if (!Number.isFinite(reais)) {
		return "R$ 0,00"
	}

	if (reais > 1_000_000_000) {
		return `R$ ${(reais / 1_000_000_000).toFixed(2)} B`
	}
	if (reais > 1_000_000) {
		return `R$ ${(reais / 1_000_000).toFixed(2)} mi`
	}
	if (reais > 100_000) {
		return `R$ ${(reais / 1000).toFixed(2)} mil`
	}

	return formatInput(cents)
}
