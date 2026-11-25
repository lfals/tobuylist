import db from "@/db/drizzle"
import { listItemsTable, listsTable } from "@/db/schema"
import {
	json,
	readJson,
	requireApiUserId,
	requireList,
	route,
	ApiError,
	totalFromItems,
} from "@/lib/mobile-api"
import { asc, eq } from "drizzle-orm"
import { z } from "zod"

type Context = { params: Promise<{ listId: string }> }

/** Detalhe da lista + itens, com o tipo de acesso (dono, salva ou apenas via link). */
export const GET = route<Context>(async (_request, { params }) => {
	const userId = await requireApiUserId()
	const { listId } = await params
	const { list, access, canEdit } = await requireList(listId, userId)

	const items = await db
		.select()
		.from(listItemsTable)
		.where(eq(listItemsTable.listId, listId))
		.orderBy(asc(listItemsTable.order), asc(listItemsTable.isActive))

	return json({
		list: {
			id: list.id,
			name: list.name,
			description: list.description,
			isActive: list.isActive,
			public: list.public,
			shared: list.shared,
			totalValue: totalFromItems(items),
		},
		items,
		access,
		canEdit,
	})
})

const patchSchema = z.object({
	name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres.").max(50).optional(),
	description: z.string().trim().max(50).nullable().optional(),
	isActive: z.union([z.literal(0), z.literal(1)]).optional(),
})

export const PATCH = route<Context>(async (request, { params }) => {
	const userId = await requireApiUserId()
	const { listId } = await params
	const { access } = await requireList(listId, userId)
	if (access !== "owner") {
		throw new ApiError(403, "Somente o dono pode editar a lista")
	}

	const body = patchSchema.parse(await readJson(request))
	const values = {
		...(body.name !== undefined ? { name: body.name } : {}),
		...(body.description !== undefined ? { description: body.description || null } : {}),
		...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
	}
	if (!Object.keys(values).length) {
		throw new ApiError(400, "Nada para atualizar")
	}

	const [list] = await db.update(listsTable).set(values).where(eq(listsTable.id, listId)).returning()
	return json({ list })
})

export const DELETE = route<Context>(async (_request, { params }) => {
	const userId = await requireApiUserId()
	const { listId } = await params
	const { access } = await requireList(listId, userId)
	if (access !== "owner") {
		throw new ApiError(403, "Somente o dono pode excluir a lista")
	}

	await db.delete(listItemsTable).where(eq(listItemsTable.listId, listId))
	await db.delete(listsTable).where(eq(listsTable.id, listId))
	return json({ ok: true })
})
