export function useFormatViewNumber(value: string) {
    value = value.replace('.', '').replace(',', '').replace(/\D/g, '')

    const parsedValue = parseFloat(value) / 100

    if (parsedValue > 1_000_000_000) {
        return "R$ " + (parsedValue / 1_000_000_000).toFixed(2) + " B"
    }

    if (parsedValue > 1_000_000) {
        return "R$ " + (parsedValue / 1_000_000).toFixed(2) + " mi"
    }

    if (parsedValue > 100_000) {
        return "R$ " + (parsedValue / 1000).toFixed(2) + " mil"
    }

    const options = { minimumFractionDigits: 2 }
    const result = new Intl.NumberFormat('pt-BR', options).format(
        parsedValue
    )

    if (result === 'NaN') {
        return 'R$ 0,00'
    }

    return 'R$ ' + result
}
