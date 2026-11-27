/**
 * Regras puras do histórico de preço (sem banco, sem rede). Todos os valores em centavos.
 */

export const DAY_MS = 24 * 60 * 60 * 1000

/** Ao abrir uma lista, itens sem checagem há mais que isso são atualizados em segundo plano. */
export const OPEN_LIST_TTL_MS = DAY_MS
/** O cron semanal pega itens sem checagem há mais que isso, mesmo que ninguém abra a lista. */
export const CRON_TTL_MS = 7 * DAY_MS
/** Máximo de itens atualizados por abertura de lista, para não gerar rajadas de requisições. */
export const MAX_ITEMS_PER_OPEN = 10

/** Preço novo abaixo de 1/5 ou acima de 5x o atual é tratado como erro de extração, não como oferta. */
const MAX_DROP_RATIO = 0.2
const MAX_RISE_RATIO = 5

export type PricePoint = {
	id: number
	price: number
	checkedAt: number
	source: "initial" | "manual" | "scrape"
}

export type PriceHistoryPayload = {
	item: {
		id: number
		name: string
		price: number
		originalPrice: number | null
		priceCheckedAt: number | null
		priceCheckStatus: "ok" | "failed" | null
		hasLink: boolean
	}
	points: PricePoint[]
}

/** "R$ 1.234,56" -> 123456. Devolve `null` quando não há valor positivo. */
export function priceToCents(value: string | undefined | null): number | null {
	if (!value) {
		return null
	}
	const digits = value.replace(/\D/g, "")
	if (!digits) {
		return null
	}
	const cents = Number(digits)
	return Number.isSafeInteger(cents) && cents > 0 ? cents : null
}

/** Rejeita preços que quase certamente vieram de uma extração errada. */
export function isPlausiblePrice(current: number, next: number) {
	if (!Number.isSafeInteger(next) || next <= 0) {
		return false
	}
	if (current <= 0) {
		return true
	}
	return next >= current * MAX_DROP_RATIO && next <= current * MAX_RISE_RATIO
}

/** Após falhas seguidas o intervalo dobra (até 8x), para não insistir em links quebrados ou bloqueados. */
export function backoffFactor(failures: number) {
	return Math.min(2 ** Math.max(0, failures), 8)
}

export type DueCandidate = {
	link: string | null
	isActive: number
	priceCheckedAt: number | null
	priceCheckFailures: number
}

export function isDueForRefresh(item: DueCandidate, now: number, ttlMs: number) {
	if (!item.link || !item.isActive) {
		return false
	}
	if (item.priceCheckedAt == null) {
		return true
	}
	return now - item.priceCheckedAt >= ttlMs * backoffFactor(item.priceCheckFailures)
}

/** Assinatura usada pela tela de histórico para saber se chegou dado novo desde que foi carregada. */
export function historySignature(payload: PriceHistoryPayload) {
	const last = payload.points.at(-1)
	return `${payload.item.price}:${last?.id ?? 0}:${payload.points.length}`
}
