// Gera um histórico de preço fictício para um item, só para ver o gráfico funcionando.
// Uso: npx tsx scripts/seed-price-history.mts <itemId> --yes
//
// ATENÇÃO: escreve no banco apontado por TURSO_DATABASE_URL (.env). Substitui o histórico do item e
// altera o preço atual e o preço original dele. Use com um item de teste, de preferência num banco de dev.
// Para voltar ao normal, edite o preço do item na tela (isso reinicia o histórico a partir do valor novo).
import "dotenv/config"
import { createClient } from "@libsql/client"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"
import { listItemsTable, priceHistoryTable } from "../src/db/schema"

const itemId = Number(process.argv[2])
if (!Number.isInteger(itemId) || itemId <= 0) {
	console.error("Uso: npx tsx scripts/seed-price-history.mts <itemId> --yes")
	process.exit(1)
}

const url = process.env.TURSO_DATABASE_URL
if (!url) {
	console.error("TURSO_DATABASE_URL não definido.")
	process.exit(1)
}
if (!process.argv.includes("--yes")) {
	console.error(`Vai substituir o histórico do item ${itemId} em ${new URL(url.replace(/^libsql:/, "https:")).host || url}.`)
	console.error("Rode de novo com --yes para confirmar.")
	process.exit(1)
}

const db = drizzle({ client: createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }) })

const [item] = await db.select().from(listItemsTable).where(eq(listItemsTable.id, itemId)).limit(1)
if (!item) {
	console.error(`Item ${itemId} não encontrado.`)
	process.exit(1)
}

const DAY = 24 * 60 * 60 * 1000
const now = Date.now()
const base = item.price > 0 ? item.price : 129900
// [dias atrás, fator sobre o preço base, origem]
const steps: [number, number, "initial" | "manual" | "scrape"][] = [
	[60, 1.0, "initial"],
	[52, 1.0, "scrape"],
	[45, 0.92, "scrape"],
	[38, 0.92, "scrape"],
	[31, 1.08, "scrape"],
	[24, 1.08, "manual"],
	[17, 0.85, "scrape"],
	[10, 0.78, "scrape"],
	[3, 0.88, "scrape"],
]

const points = steps
	.map(([daysAgo, factor, source]) => ({ itemId, price: Math.round(base * factor), checkedAt: now - daysAgo * DAY, source }))
	// só grava pontos em que o preço muda (como o refresh de verdade faz), mantendo o primeiro
	.filter((point, index, all) => index === 0 || point.price !== all[index - 1].price || point.source === "manual")

await db.delete(priceHistoryTable).where(eq(priceHistoryTable.itemId, itemId))
await db.insert(priceHistoryTable).values(points)
await db
	.update(listItemsTable)
	.set({
		price: points.at(-1)!.price,
		originalPrice: points[0].price,
		priceCheckedAt: now,
		priceCheckStatus: "ok",
		priceCheckFailures: 0,
	})
	.where(eq(listItemsTable.id, itemId))

console.log(`Item ${itemId} (${item.name}): ${points.length} pontos, de ${points[0].price / 100} até ${points.at(-1)!.price / 100} (R$).`)
