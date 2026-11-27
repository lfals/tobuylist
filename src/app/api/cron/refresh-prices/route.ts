import { CRON_TTL_MS } from "@/lib/price-history"
import { dueItemsGlobal, refreshItems } from "@/lib/price-refresh"
import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
// 60s é o máximo do plano Hobby da Vercel (acima disso o deploy falha).
export const maxDuration = 60

const BATCH_SIZE = 100
// Só inicia novos itens até aqui. Um item em andamento pode levar até ~24s (12s de timeout, 2 tentativas),
// então a folga até os 60s da função é grande de propósito.
const BUDGET_MS = 30_000

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
 * Itens que não couberem no orçamento de tempo continuam vencidos e entram na rodada do dia seguinte.
 */
export async function GET(request: Request) {
	if (!isAuthorized(request)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const items = await dueItemsGlobal(CRON_TTL_MS, BATCH_SIZE)
	const summary = await refreshItems(items, { concurrency: 5, deadline: Date.now() + BUDGET_MS })

	return NextResponse.json({ due: items.length, ...summary })
}
