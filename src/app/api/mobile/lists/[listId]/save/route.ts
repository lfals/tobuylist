import db from "@/db/drizzle"
import { sharedListsTable } from "@/db/schema"
import { ApiError, json, requireApiUserId, requireList, route } from "@/lib/mobile-api"
import { and, eq } from "drizzle-orm"
import { randomUUID } from "node:crypto"

type Context = { params: Promise<{ listId: string }> }

/** Salva uma lista compartilhada nas listas do usuário. */
export const POST = route<Context>(async (_request, { params }) => {
	const userId = await requireApiUserId()
	const { listId } = await params
	const { access } = await requireList(listId, userId)

	if (access === "owner") {
		throw new ApiError(400, "Esta lista já é sua")
	}
	if (access === "link") {
		await db.insert(sharedListsTable).values({ id: randomUUID(), listId, userId })
	}

	return json({ ok: true }, { status: access === "link" ? 201 : 200 })
})

/** Remove uma lista salva (não apaga a lista original). */
export const DELETE = route<Context>(async (_request, { params }) => {
	const userId = await requireApiUserId()
	const { listId } = await params

	await db
		.delete(sharedListsTable)
		.where(and(eq(sharedListsTable.listId, listId), eq(sharedListsTable.userId, userId)))

	return json({ ok: true })
})
