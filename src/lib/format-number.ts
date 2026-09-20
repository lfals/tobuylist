const NON_DIGITS = /\D/g
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
	minimumFractionDigits: 2,
})

function digitsOf(value: string) {
	return value.replace(".", "").replace(",", "").replace(NON_DIGITS, "")
}

export function formatNumber(value: string) {
	const result = currencyFormatter.format(parseFloat(digitsOf(value)) / 100)

	if (result === "NaN") {
		return "R$ 0,00"
	}

	return `R$ ${result}`
}

export function formatViewNumber(value: string) {
	const parsedValue = parseFloat(digitsOf(value)) / 100

	if (parsedValue > 1_000_000_000) {
		return `R$ ${(parsedValue / 1_000_000_000).toFixed(2)} B`
	}

	if (parsedValue > 1_000_000) {
		return `R$ ${(parsedValue / 1_000_000).toFixed(2)} mi`
	}

	if (parsedValue > 100_000) {
		return `R$ ${(parsedValue / 1000).toFixed(2)} mil`
	}

	const result = currencyFormatter.format(parsedValue)

	if (result === "NaN") {
		return "R$ 0,00"
	}

	return `R$ ${result}`
}
