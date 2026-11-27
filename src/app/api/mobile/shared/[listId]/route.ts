import db from "@/db/drizzle"
import { listItemsTable, listsTable } from "@/db/schema"
import { ApiError, json, route, totalFromItems } from "@/lib/mobile-api"
import { and, asc, eq } from "drizzle-orm"

type Context = { params: Promise<{ listId: string }> }

/**
 * Visualização pública (sem login) de uma lista compartilhada, usada pelo app antes do login.
 * Somente leitura: qualquer escrita continua exigindo sessão (Bearer do Clerk) nas demais rotas.
 * Lista inexistente ou não compartilhada responde 404 (igual ao /s/[id] do site).
 */
export const GET = route<Context>(async (_request, { params }) => {
	const { listId } = await params

	const [list] = await db
		.select({
			id: listsTable.id,
			name: listsTable.name,
			description: listsTable.description,
			public: listsTable.public,
		})
		.from(listsTable)
		.where(and(eq(listsTable.id, listId), eq(listsTable.shared, 1)))
		.limit(1)

	if (!list) {
		throw new ApiError(404, "Lista não encontrada")
	}

	const items = await db
		.select()
		.from(listItemsTable)
		.where(eq(listItemsTable.listId, listId))
		.orderBy(asc(listItemsTable.order), asc(listItemsTable.isActive))

	return json({
		list: { ...list, totalValue: totalFromItems(items) },
		items,
		access: "link" as const,
		canEdit: false,
	})
})
