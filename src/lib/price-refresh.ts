import db from "@/db/drizzle"
import { itemLinksTable, listItemsTable, listsTable, priceHistoryTable } from "@/db/schema"
import { fetchProductData } from "@/lib/product-fetch"
import {
	CRON_TTL_MS,
	isDueForRefresh,
	isPlausiblePrice,
	priceToCents,
	type PriceHistoryPayload,
} from "@/lib/price-history"
import { applyItemEdit, syncItemFromLinks } from "@/services/item-links"
import { and, asc, count, eq, isNull, lt, or } from "drizzle-orm"

/**
 * Refresh de preço sem agente: reaproveita o extrator determinístico (Shopify, Mercado Livre, JSON-LD, og:price...).
 * Só importe daqui em código de servidor (rotas, cron, server actions).
 */

type ItemRow = typeof listItemsTable.$inferSelect

export type RefreshOutcome = "updated" | "unchanged" | "failed" | "skipped"

const SAME_HOST_DELAY_MS = 400

/** Itens antigos (ou duplicados) ainda sem preço de referência: grava o ponto inicial e a referência uma única vez. */
async function ensureBaseline(item: ItemRow) {
	if (item.originalPrice != null) {
		return
	}
	const [{ total }] = await db
		.select({ total: count() })
		.from(priceHistoryTable)
		.where(eq(priceHistoryTable.itemId, item.id))
	if (total === 0) {
		await db.insert(priceHistoryTable).values({
			itemId: item.id,
			price: item.price,
			checkedAt: toEpoch(item.createdAt) ?? Date.now(),
			source: "initial",
		})
	}
	await db.update(listItemsTable).set({ originalPrice: item.price }).where(eq(listItemsTable.id, item.id))
}

/** `createdAt` das tabelas antigas é texto ("YYYY-MM-DD HH:MM:SS", UTC) ou número. */
function toEpoch(value: unknown): number | null {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : null
	}
	if (typeof value === "string") {
		const parsed = Date.parse(value.includes("T") ? value : `${value.replace(" ", "T")}Z`)
		return Number.isNaN(parsed) ? null : parsed
	}
	return null
}

/** Reserva o item de forma atômica: só quem ler o mesmo `priceCheckedAt` consegue atualizar (evita refresh duplicado entre abas). */
async function claim(item: ItemRow, now: number) {
	const sameStamp = item.priceCheckedAt == null ? isNull(listItemsTable.priceCheckedAt) : eq(listItemsTable.priceCheckedAt, item.priceCheckedAt)
	const rows = await db
		.update(listItemsTable)
		.set({ priceCheckedAt: now })
		.where(and(eq(listItemsTable.id, item.id), sameStamp))
		.returning({ id: listItemsTable.id })
	return rows.length > 0
}

export async function refreshItemPrice(item: ItemRow, deadline = Number.POSITIVE_INFINITY): Promise<RefreshOutcome> {
	if (!item.link || !item.isActive) {
		return "skipped"
	}
	const now = Date.now()
	if (!(await claim(item, now))) {
		return "skipped"
	}

	await ensureBaseline(item)

	// Cada link cadastrado tem o próprio preço; itens antigos, sem registros, só têm o link da própria linha.
	const links = await db.select().from(itemLinksTable).where(eq(itemLinksTable.itemId, item.id)).orderBy(asc(itemLinksTable.id))
	const targets = links.length > 0 ? links : [{ id: 0, link: item.link, store: item.store, price: item.price }]

	// Primeiro só busca (rede); nada é gravado até o fim, então um corte por tempo não deixa estado pela metade.
	// O preço buscado guarda a URL de onde veio: se a loja mudou de URL durante a busca, o valor é descartado.
	const scraped = new Map<number, { link: string; price: number }>()
	let truncated = false
	let attempted = 0
	for (const [index, target] of targets.entries()) {
		if (index > 0) {
			await sleep(SAME_HOST_DELAY_MS)
		}
		if (Date.now() >= deadline) {
			truncated = true
			break
		}
		attempted++
		try {
			const next = priceToCents((await fetchProductData(target.link)).price)
			if (next != null && isPlausiblePrice(target.price, next)) {
				scraped.set(target.id, { link: target.link, price: next })
			}
		} catch {
			// Link com falha: mantém o preço que já tinha.
		}
	}

	if (scraped.size === 0) {
		if (truncated && attempted === 0) {
			// Acabou o tempo antes de tentar qualquer link: devolve o carimbo anterior (só se ninguém o mexeu nesse meio
			// tempo, p.ex. uma edição de link que força nova checagem), sem contar como falha nem dobrar o backoff.
			await db
				.update(listItemsTable)
				.set({ priceCheckedAt: item.priceCheckedAt })
				.where(and(eq(listItemsTable.id, item.id), eq(listItemsTable.priceCheckedAt, now)))
			return "skipped"
		}
		await db
			.update(listItemsTable)
			.set({ priceCheckStatus: "failed", priceCheckFailures: item.priceCheckFailures + 1 })
			.where(eq(listItemsTable.id, item.id))
		return "failed"
	}

	const okState = { priceCheckedAt: now, priceCheckStatus: "ok" as const, priceCheckFailures: 0 }
	const markOk = () => db.update(listItemsTable).set(okState).where(eq(listItemsTable.id, item.id))

	// Os links podem ter mudado durante a busca (loja removida, URL trocada, loja nova): relê e aplica só onde a URL confere.
	const current = await db.select().from(itemLinksTable).where(eq(itemLinksTable.itemId, item.id)).orderBy(asc(itemLinksTable.id))

	if (current.length > 0) {
		const matching = current.filter((row) => scraped.get(row.id)?.link === row.link)
		if (matching.length === 0) {
			return "skipped"
		}
		const changed = matching.filter((row) => scraped.get(row.id)!.price !== row.price)
		// A URL é conferida de novo na própria gravação: se foi trocada depois da leitura acima, o preço não entra.
		const priceUpdates = changed.map((row) =>
			db.update(itemLinksTable).set({ price: scraped.get(row.id)!.price }).where(and(eq(itemLinksTable.id, row.id), eq(itemLinksTable.link, row.link))),
		)
		if (priceUpdates.length > 0) {
			await db.batch(priceUpdates as unknown as Parameters<typeof db.batch>[0])
		}
		// O cache do item (mais barato) é recalculado a partir da tabela, não do que foi lido antes da busca.
		await syncItemFromLinks(item.id)
		// Só depois do recálculo o item conta como checado: se algo acima falhar, a próxima abertura tenta de novo.
		await markOk()
		const [after] = await db.select().from(listItemsTable).where(eq(listItemsTable.id, item.id)).limit(1)
		if (!after) {
			return "skipped"
		}
		const priceMoved = after.price !== item.price
		if (priceMoved) {
			await db.insert(priceHistoryTable).values({ itemId: item.id, price: after.price, checkedAt: now, source: "scrape" })
		}
		// "updated" também quando só um preço secundário (ou qual loja é a mais barata) mudou: a tela precisa recarregar.
		return priceMoved || changed.length > 0 || after.link !== item.link ? "updated" : "unchanged"
	}

	// Item antigo, sem registros em `itemLinks`: o link e o preço estão só na própria linha.
	const [fresh] = await db.select().from(listItemsTable).where(eq(listItemsTable.id, item.id)).limit(1)
	const hit = scraped.get(0)
	if (!fresh || !hit || fresh.link !== hit.link) {
		return "skipped"
	}
	if (hit.price === fresh.price) {
		await markOk()
		return "unchanged"
	}
	await db.batch([
		db.insert(priceHistoryTable).values({ itemId: item.id, price: hit.price, checkedAt: now, source: "scrape" }),
		db.update(listItemsTable).set({ ...okState, price: hit.price }).where(and(eq(listItemsTable.id, item.id), eq(listItemsTable.link, hit.link))),
	])
	return "updated"
}

export type RefreshSummary = Record<RefreshOutcome, number>

function emptySummary(): RefreshSummary {
	return { updated: 0, unchanged: 0, failed: 0, skipped: 0 }
}

function hostOf(link: string | null) {
	try {
		return new URL(link ?? "").hostname
	} catch {
		return ""
	}
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Atualiza vários itens. Itens do mesmo domínio rodam em sequência (com pausa) para não parecer ataque ao site;
 * domínios diferentes rodam em paralelo, até `concurrency`. Para de iniciar novos itens depois de `deadline`.
 */
export async function refreshItems(items: ItemRow[], options: { concurrency?: number; deadline?: number } = {}) {
	const { concurrency = 3, deadline = Number.POSITIVE_INFINITY } = options
	const summary = emptySummary()

	const queues = new Map<string, ItemRow[]>()
	for (const item of items) {
		const host = hostOf(item.link)
		queues.set(host, [...(queues.get(host) ?? []), item])
	}

	const hosts = [...queues.values()]
	let cursor = 0

	async function worker() {
		while (cursor < hosts.length) {
			const queue = hosts[cursor++]
			for (const [index, item] of queue.entries()) {
				if (Date.now() >= deadline) {
					return
				}
				if (index > 0) {
					await sleep(SAME_HOST_DELAY_MS)
				}
				summary[await refreshItemPrice(item, deadline)]++
			}
		}
	}

	await Promise.all(Array.from({ length: Math.min(concurrency, hosts.length) }, worker))
	return summary
}

/** Itens de uma lista que estão vencidos, os mais antigos primeiro. */
export async function dueItemsOfList(listId: string, ttlMs: number, limit: number) {
	const now = Date.now()
	const rows = await db
		.select()
		.from(listItemsTable)
		.where(and(eq(listItemsTable.listId, listId), eq(listItemsTable.isActive, 1)))
		.orderBy(asc(listItemsTable.priceCheckedAt))
	return rows.filter((item) => isDueForRefresh(item, now, ttlMs)).slice(0, limit)
}

/** Itens de todas as listas sem checagem há mais de `ttlMs` (usado pelo cron). */
export async function dueItemsGlobal(ttlMs: number = CRON_TTL_MS, limit = 200) {
	const now = Date.now()
	const rows = await db
		.select({ item: listItemsTable })
		.from(listItemsTable)
		.innerJoin(listsTable, eq(listsTable.id, listItemsTable.listId))
		.where(
			and(
				eq(listItemsTable.isActive, 1),
				or(isNull(listItemsTable.priceCheckedAt), lt(listItemsTable.priceCheckedAt, now - ttlMs)),
			),
		)
		.orderBy(asc(listItemsTable.priceCheckedAt))
		.limit(limit * 3)

	return rows
		.map((row) => row.item)
		.filter((item) => isDueForRefresh(item, now, ttlMs))
		.slice(0, limit)
}

/** Registra uma mudança manual de preço: vira o novo preço de referência e entra no histórico. */
export async function recordManualPrice(itemId: number, price: number) {
	const now = Date.now()
	await db.batch([
		db.insert(priceHistoryTable).values({ itemId, price, checkedAt: now, source: "manual" }),
		db
			.update(listItemsTable)
			.set({ originalPrice: price, priceCheckedAt: now, priceCheckStatus: null, priceCheckFailures: 0 })
			.where(eq(listItemsTable.id, itemId)),
	])
}

/** Registra o ponto inicial de um item recém-criado. */
export async function recordInitialPrice(itemId: number, price: number) {
	const now = Date.now()
	await db.batch([
		db.insert(priceHistoryTable).values({ itemId, price, checkedAt: now, source: "initial" }),
		db
			.update(listItemsTable)
			.set({ originalPrice: price, priceCheckedAt: now })
			.where(eq(listItemsTable.id, itemId)),
	])
}

/** Histórico de um item, se o usuário puder ver a lista (dono, ou lista compartilhada). `userId` nulo = visitante. */
export async function getPriceHistory(itemId: number, userId: string | null): Promise<PriceHistoryPayload | null> {
	// Uma única ida ao banco (o Turso é remoto): o item com a lista e os pontos vão no mesmo batch.
	const [rows, found] = await db.batch([
		db
			.select({ item: listItemsTable, ownerId: listsTable.userId, shared: listsTable.shared })
			.from(listItemsTable)
			.innerJoin(listsTable, eq(listsTable.id, listItemsTable.listId))
			.where(eq(listItemsTable.id, itemId))
			.limit(1),
		db
			.select({
				id: priceHistoryTable.id,
				price: priceHistoryTable.price,
				checkedAt: priceHistoryTable.checkedAt,
				source: priceHistoryTable.source,
			})
			.from(priceHistoryTable)
			.where(eq(priceHistoryTable.itemId, itemId))
			.orderBy(asc(priceHistoryTable.checkedAt), asc(priceHistoryTable.id)),
	])

	const row = rows[0]
	if (!row || !(row.shared || (userId && row.ownerId === userId))) {
		return null
	}

	let current = row.item
	let points = found
	if (current.originalPrice == null) {
		// Só acontece uma vez por item antigo (ou duplicado).
		await ensureBaseline(current)
		current = { ...current, originalPrice: current.price }
		points = await db
			.select({
				id: priceHistoryTable.id,
				price: priceHistoryTable.price,
				checkedAt: priceHistoryTable.checkedAt,
				source: priceHistoryTable.source,
			})
			.from(priceHistoryTable)
			.where(eq(priceHistoryTable.itemId, itemId))
			.orderBy(asc(priceHistoryTable.checkedAt), asc(priceHistoryTable.id))
	}

	return {
		item: {
			id: current.id,
			name: current.name,
			price: current.price,
			originalPrice: current.originalPrice,
			priceCheckedAt: current.priceCheckedAt,
			priceCheckStatus: current.priceCheckStatus,
			hasLink: Boolean(current.link),
		},
		points,
	}
}


/** Recalcula o item a partir dos links (mais barato) e, se o preço dele mudou, registra no histórico. */
export async function syncLinksAndRecord(itemId: number) {
	const [before] = await db.select({ price: listItemsTable.price }).from(listItemsTable).where(eq(listItemsTable.id, itemId)).limit(1)
	await syncItemFromLinks(itemId)
	const [after] = await db.select({ price: listItemsTable.price }).from(listItemsTable).where(eq(listItemsTable.id, itemId)).limit(1)
	if (before && after && before.price !== after.price) {
		await recordManualPrice(itemId, after.price)
	}
}

/**
 * O item foi editado (formulário ou API mobile). Reflete link/loja/preço no registro de `itemLinks` que
 * representava o item, recalcula o mais barato e mantém o histórico e a checagem de preço coerentes.
 */
export async function reconcileEdit(
	itemId: number,
	before: { link: string | null; price: number },
	after: { link: string | null; store: string | null; price: number },
) {
	await applyItemEdit(itemId, before, after)
	const [synced] = await db.select().from(listItemsTable).where(eq(listItemsTable.id, itemId)).limit(1)

	if (synced.price !== before.price) {
		// Edição manual do preço: vira o novo preço de referência e entra no histórico.
		await recordManualPrice(itemId, synced.price)
		return { ...synced, originalPrice: synced.price }
	}
	if ((after.link ?? null) !== (before.link ?? null)) {
		// Link novo: força uma checagem na próxima abertura da lista.
		await db.update(listItemsTable).set({ priceCheckedAt: null, priceCheckStatus: null, priceCheckFailures: 0 }).where(eq(listItemsTable.id, itemId))
	}
	return synced
}
