// Confere que todos os idiomas em messages/ têm as mesmas chaves do idioma padrão (pt-BR),
// os mesmos tamanhos de lista e os mesmos placeholders ICU ({nome}, {count, plural, ...}).
// Uso: pnpm i18n:check
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const dir = new URL("../messages/", import.meta.url).pathname
const reference = "pt-BR"

function flatten(value, path = "", out = new Map()) {
	if (Array.isArray(value)) {
		out.set(`${path}[]`, value.length)
		value.forEach((item, index) => flatten(item, `${path}[${index}]`, out))
	} else if (value && typeof value === "object") {
		for (const [key, child] of Object.entries(value)) flatten(child, path ? `${path}.${key}` : key, out)
	} else {
		out.set(path, value)
	}
	return out
}

// Nomes das variáveis de uma mensagem ICU, só do nível de cima ({name}, {count, plural, ...}).
function variables(message) {
	if (typeof message !== "string") return []
	const names = new Set()
	let depth = 0
	let start = -1
	for (let index = 0; index < message.length; index++) {
		const char = message[index]
		if (char === "{") {
			if (depth === 0) start = index + 1
			depth++
		} else if (char === "}") {
			depth--
			if (depth === 0) names.add(message.slice(start, index).split(",")[0].trim())
		}
	}
	return [...names].sort()
}

const load = (locale) => flatten(JSON.parse(readFileSync(join(dir, `${locale}.json`), "utf8")))
const locales = readdirSync(dir).filter((file) => file.endsWith(".json")).map((file) => file.replace(".json", ""))
const base = load(reference)
let problems = 0

// Listas que podem ter tamanhos diferentes por idioma (ex.: artigos que a demo da landing remove do início).
const freeLengthLists = ["Landing.demo.articles"]
const isFreeLength = (key) => freeLengthLists.some((list) => key === list || key.startsWith(`${list}[`))

for (const locale of locales.filter((code) => code !== reference)) {
	const current = load(locale)
	const report = (message) => {
		problems++
		console.error(`[${locale}] ${message}`)
	}

	for (const key of base.keys()) {
		if (!current.has(key) && !isFreeLength(key)) report(`falta a chave "${key}"`)
	}
	for (const key of current.keys()) {
		if (!base.has(key) && !isFreeLength(key)) report(`chave "${key}" não existe em ${reference}`)
	}
	for (const [key, value] of base) {
		if (!current.has(key)) continue
		const a = variables(value).join(",")
		const b = variables(current.get(key)).join(",")
		if (a !== b) report(`"${key}" usa variáveis diferentes: {${a}} em ${reference} e {${b}} aqui`)
		if (key.endsWith("[]") && !isFreeLength(key) && value !== current.get(key)) {
			report(`"${key}" tem ${current.get(key)} itens, ${reference} tem ${value}`)
		}
		if (typeof current.get(key) === "string" && current.get(key).trim() === "") report(`"${key}" está vazia`)
	}
}

if (problems > 0) {
	console.error(`\n${problems} problema(s) nas traduções.`)
	process.exit(1)
}
console.log(`Traduções ok: ${locales.join(", ")} (${base.size} entradas em ${reference}).`)
