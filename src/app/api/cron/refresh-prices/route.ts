import { CRON_TTL_MS } from "@/lib/price-history"
import { dueItemsGlobal, refreshItems } from "@/lib/price-refresh"
import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const BATCH_SIZE = 200
// Deixa folga antes do limite da função para responder com o resumo.
const BUDGET_MS = 240_000

function isAuthorized(request: Request) {
	const secret = process.env.CRON_SECRET
	if (!secret) {
		return false
	}
	const received = Buffer.from(request.headers.get("authorization") ?? "")
	const expected = Buffer.from(`Bearer ${secret}`)
	return received.length === expected.length && timingSafeEqual(received, expected)
}

/**
 * Cron diário (vercel.json). Atualiza itens sem checagem há 7 dias, mesmo que ninguém abra a lista.
 * Rodar todo dia (e não só 1x por semana) distribui a carga: cada item entra na rodada do dia em que completa 7 dias.
 */
export async function GET(request: Request) {
	if (!isAuthorized(request)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const items = await dueItemsGlobal(CRON_TTL_MS, BATCH_SIZE)
	const summary = await refreshItems(items, { concurrency: 5, deadline: Date.now() + BUDGET_MS })

	return NextResponse.json({ due: items.length, ...summary })
}
