const MULTI_PART_SUFFIXES = [
	"com.br",
	"com.ar",
	"com.mx",
	"com.co",
	"com.pe",
	"com.uy",
	"com.cl",
	"co.uk",
	"net.br",
	"org.br",
]

export function storeFromUrl(url: string) {
	try {
		const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase()
		if (!host) {
			return ""
		}
		if (/mercado(livre|libre)\./i.test(host)) {
			return "mercadolivre"
		}

		for (const suffix of MULTI_PART_SUFFIXES) {
			if (host === suffix) {
				return ""
			}
			if (host.endsWith(`.${suffix}`)) {
				const withoutSuffix = host.slice(0, -(suffix.length + 1))
				const labels = withoutSuffix.split(".").filter(Boolean)
				return labels[labels.length - 1] || ""
			}
		}

		const labels = host.split(".").filter(Boolean)
		if (labels.length >= 2) {
			return labels[labels.length - 2]
		}
		return labels[0] || ""
	} catch {
		return ""
	}
}
