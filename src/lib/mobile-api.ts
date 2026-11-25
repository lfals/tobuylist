import db from "@/db/drizzle"
import { listItemsTable, listsTable, sharedListsTable } from "@/db/schema"
import { auth } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { ZodError } from "zod"

/**
 * Helpers para as rotas REST consumidas pelo app mobile (/api/mobile/*).
 * A autenticação usa o token de sessão do Clerk enviado como `Authorization: Bearer`.
 */

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message)
	}
}

export async function requireApiUserId() {
	const { userId } = await auth()
	if (!userId) {
		throw new ApiError(401, "Não autenticado")
	}
	return userId
}

export function json<T>(data: T, init?: ResponseInit) {
	return NextResponse.json(data, init)
}

export async function readJson(request: Request) {
	try {
		return await request.json()
	} catch {
		throw new ApiError(400, "JSON inválido")
	}
}

type Handler<Ctx> = (request: Request, context: Ctx) => Promise<Response>

/** Converte erros conhecidos em respostas JSON `{ error }`. */
export function route<Ctx = unknown>(handler: Handler<Ctx>): Handler<Ctx> {
	return async (request, context) => {
		try {
			return await handler(request, context)
		} catch (error) {
			if (error instanceof ApiError) {
				return json({ error: error.message }, { status: error.status })
			}
			if (error instanceof ZodError) {
				return json({ error: error.issues[0]?.message ?? "Dados inválidos", issues: error.issues }, { status: 400 })
			}
			console.error("[mobile-api]", error)
			return json({ error: "Erro interno" }, { status: 500 })
		}
	}
}

export type ListAccess = "owner" | "saved" | "link"

export type ResolvedList = {
	list: typeof listsTable.$inferSelect
	access: ListAccess
	/** O usuário pode adicionar/editar/remover itens. */
	canEdit: boolean
}

/**
 * Resolve como o usuário enxerga a lista:
 * - owner: lista própria (edição total)
 * - saved: lista de outra pessoa salva pelo usuário (edita itens só se for pública)
 * - link: lista compartilhada acessada via link, ainda não salva (edita itens só se for pública)
 */
export async function resolveList(listId: string, userId: string): Promise<ResolvedList | null> {
	const [list] = await db.select().from(listsTable).where(eq(listsTable.id, listId)).limit(1)
	if (!list) {
		return null
	}

	if (list.userId === userId) {
		return { list, access: "owner", canEdit: true }
	}

	if (!list.shared) {
		return null
	}

	const [saved] = await db
		.select({ id: sharedListsTable.id })
		.from(sharedListsTable)
		.where(and(eq(sharedListsTable.listId, listId), eq(sharedListsTable.userId, userId)))
		.limit(1)

	if (saved) {
		return { list, access: "saved", canEdit: Boolean(list.public) }
	}

	return { list, access: "link", canEdit: Boolean(list.public) }
}

export async function requireList(listId: string, userId: string) {
	const resolved = await resolveList(listId, userId)
	if (!resolved) {
		throw new ApiError(404, "Lista não encontrada")
	}
	return resolved
}

export async function requireEditableList(listId: string, userId: string) {
	const resolved = await requireList(listId, userId)
	if (!resolved.canEdit) {
		throw new ApiError(403, "Sem permissão para editar esta lista")
	}
	return resolved
}

export async function requireEditableItem(itemId: number, userId: string) {
	const [item] = await db.select().from(listItemsTable).where(eq(listItemsTable.id, itemId)).limit(1)
	if (!item) {
		throw new ApiError(404, "Item não encontrado")
	}
	const resolved = await requireEditableList(item.listId, userId)
	return { item, ...resolved }
}

export function totalFromItems(items: { price: number; quantity: number; isActive: number }[]) {
	let total = 0
	for (const item of items) {
		if (item.isActive) {
			total += item.price * item.quantity
		}
	}
	return total
}

export function parseId(value: string, label = "id") {
	const parsed = Number(value)
	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw new ApiError(400, `${label} inválido`)
	}
	return parsed
}

export function shareUrl(request: Request, listId: string) {
	const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
	return `${origin}/s/${listId}`
}
