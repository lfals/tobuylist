import db from "@/db/drizzle"
import { itemLinksTable, listItemsTable } from "@/db/schema"
import { storeFromUrl } from "@/lib/storeFromUrl"
import type { ItemLinkRecord } from "@/types/list"
import { asc, eq, inArray } from "drizzle-orm"

/** Link mais barato; preço 0 (não encontrado) só vence se não houver nenhum preço válido. */
export function cheapestLink<T extends { price: number }>(links: T[]): T | undefined {
	let best: T | undefined
	for (const link of links) {
		if (!best || (best.price === 0 && link.price > 0) || (link.price > 0 && link.price < best.price)) {
			best = link
		}
	}
	return best
}

/** Anexa a cada item a lista de links, do mais antigo para o mais novo. */
export async function attachLinks<T extends { id: number }>(items: T[]): Promise<(T & { links: ItemLinkRecord[] })[]> {
	if (items.length === 0) {
		return []
	}

	const rows = await db
		.select()
		.from(itemLinksTable)
		.where(inArray(itemLinksTable.itemId, items.map((item) => item.id)))
		.orderBy(asc(itemLinksTable.id))

	const byItem = new Map<number, ItemLinkRecord[]>()
	for (const row of rows) {
		byItem.set(row.itemId, [...(byItem.get(row.itemId) ?? []), row])
	}

	return items.map((item) => ({ ...item, links: byItem.get(item.id) ?? [] }))
}

/** Itens antigos têm link/preço só na própria linha; cria o primeiro registro de `itemLinks` a partir deles. */
export async function ensureLinks(itemId: number) {
	const existing = await db.select({ id: itemLinksTable.id }).from(itemLinksTable).where(eq(itemLinksTable.itemId, itemId)).limit(1)
	if (existing.length) {
		return
	}

	const [item] = await db.select().from(listItemsTable).where(eq(listItemsTable.id, itemId)).limit(1)
	if (item?.link) {
		await db.insert(itemLinksTable).values({ itemId, link: item.link, store: item.store, price: item.price })
	}
}

/** Copia para o item o link e o preço mais baratos entre os links cadastrados. */
export async function syncItemFromLinks(itemId: number) {
	const links = await db.select().from(itemLinksTable).where(eq(itemLinksTable.itemId, itemId)).orderBy(asc(itemLinksTable.id))
	const best = cheapestLink(links)
	if (!best) {
		return
	}

	await db
		.update(listItemsTable)
		.set({ link: best.link, store: best.store, price: best.price })
		.where(eq(listItemsTable.id, itemId))
}

/** Registra o primeiro link de um item recém-criado (ou migra um item antigo que ainda não tinha). */
export async function seedFirstLink(item: { id: number; link: string | null; store: string | null; price: number }) {
	if (!item.link) {
		return
	}
	await db.insert(itemLinksTable).values({ itemId: item.id, link: item.link, store: item.store, price: item.price })
}

/**
 * O item foi editado (link/loja/preço). Reflete a mudança no registro que era o "principal"
 * antes da edição e recalcula o mais barato. Sem links cadastrados, só cria o primeiro se houver link.
 */
export async function applyItemEdit(
	itemId: number,
	previous: { link: string | null } | undefined,
	next: { link: string | null; store: string | null; price: number },
) {
	const links = await db.select().from(itemLinksTable).where(eq(itemLinksTable.itemId, itemId))

	if (!next.link) {
		// Link apagado: o item fica sem link, então os registros também saem (senão voltariam depois).
		if (links.length > 0) {
			await db.delete(itemLinksTable).where(eq(itemLinksTable.itemId, itemId))
		}
		return
	}

	const primary = links.find((row) => row.link === previous?.link)
	if (primary) {
		await db.update(itemLinksTable).set({ link: next.link, store: next.store, price: next.price }).where(eq(itemLinksTable.id, primary.id))
	} else if (links.length === 0) {
		await db.insert(itemLinksTable).values({ itemId, link: next.link, store: next.store, price: next.price })
	}

	await syncItemFromLinks(itemId)
}

export function storeForLink(link: string, store?: string | null) {
	return store?.trim() || storeFromUrl(link) || null
}

/** Com mais de um link, link/loja/preço do item só mudam pelo modal de links (o formulário não os edita). */
export async function hasMultipleLinks(itemId: number) {
	const rows = await db.select({ id: itemLinksTable.id }).from(itemLinksTable).where(eq(itemLinksTable.itemId, itemId)).limit(2)
	return rows.length > 1
}

/** Copia os itens (e os links de cada um) para a lista nova. Um insert por item: não depende da ordem do RETURNING. */
export async function copyItemsWithLinks(items: (typeof listItemsTable.$inferSelect & { links: ItemLinkRecord[] })[], listId: string) {
	for (const { id: _id, links, ...rest } of items) {
		const [created] = await db.insert(listItemsTable).values({ ...rest, listId }).returning({ id: listItemsTable.id })
		if (links.length > 0) {
			await db.insert(itemLinksTable).values(links.map(({ id: _linkId, itemId: _itemId, ...link }) => ({ ...link, itemId: created.id })))
		}
	}
}
