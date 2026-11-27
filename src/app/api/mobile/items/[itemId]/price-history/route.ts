import { json, parseId, route, ApiError } from "@/lib/mobile-api"
import { getPriceHistory } from "@/lib/price-refresh"
import { auth } from "@clerk/nextjs/server"

type Context = { params: Promise<{ itemId: string }> }

export const dynamic = "force-dynamic"

/** Histórico de preço de um item. Aberto a quem pode ver a lista (inclusive visitante de lista compartilhada). */
export const GET = route<Context>(async (_request, { params }) => {
	const itemId = parseId((await params).itemId, "item")
	const { userId } = await auth()

	const history = await getPriceHistory(itemId, userId)
	if (!history) {
		throw new ApiError(404, "Item não encontrado")
	}
	return json(history, { headers: { "Cache-Control": "no-store" } })
})
