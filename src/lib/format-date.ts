// `createdAt` vem do SQLite como texto UTC ("YYYY-MM-DD HH:MM:SS") ou como número (epoch).
export function parseDbDate(value: string | number | null | undefined): Date | null {
	if (value === null || value === undefined || value === "") return null

	let date: Date
	if (typeof value === "number") {
		date = new Date(value < 1e12 ? value * 1000 : value)
	} else if (/^\d+$/.test(value)) {
		const n = Number(value)
		date = new Date(n < 1e12 ? n * 1000 : n)
	} else {
		date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`)
	}

	return Number.isNaN(date.getTime()) ? null : date
}

export function formatAddedDate(value: string | number | null | undefined, locale: string) {
	const date = parseDbDate(value)
	if (!date) return null
	return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date)
}
