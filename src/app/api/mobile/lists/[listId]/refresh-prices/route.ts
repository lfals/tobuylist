import { json, requireApiUserId, requireList, route } from "@/lib/mobile-api"
import { MAX_ITEMS_PER_OPEN, OPEN_LIST_TTL_MS } from "@/lib/price-history"
import { dueItemsOfList, refreshItems } from "@/lib/price-refresh"
import { revalidateList } from "@/services/list-access"

type Context = { params: Promise<{ listId: string }> }

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Atualiza em segundo plano os preços vencidos (mais de 24h) de uma lista que o usuário pode ver.
 * É uma rota (e não uma server action) porque actions rodam em fila e travariam as edições do usuário.
 */
export const POST = route<Context>(async (_request, { params }) => {
	const userId = await requireApiUserId()
	const { listId } = await params
	await requireList(listId, userId)

	const due = await dueItemsOfList(listId, OPEN_LIST_TTL_MS, MAX_ITEMS_PER_OPEN)
	if (due.length === 0) {
		return json({ updated: 0, failed: 0, checked: 0 })
	}

	const summary = await refreshItems(due, { concurrency: 3, deadline: Date.now() + 40_000 })
	if (summary.updated > 0) {
		revalidateList(listId)
	}

	return json({
		updated: summary.updated,
		failed: summary.failed,
		checked: summary.updated + summary.unchanged + summary.failed,
	})
})
