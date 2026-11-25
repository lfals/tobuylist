import db from "@/db/drizzle"
import { listItemsTable, listsTable, sharedListsTable } from "@/db/schema"
import { and, eq, inArray, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type ListAccess = "owner" | "saved" | "link"

/** Dono da lista, ou lista compartilhada que o dono liberou para edição por qualquer usuário logado. */
function editableBy(userId: string) {
	return or(eq(listsTable.userId, userId), and(eq(listsTable.shared, 1), eq(listsTable.public, 1)))
}

export async function assertCanEditList(listId: string, userId: string) {
	const rows = await db
		.select({ id: listsTable.id })
		.from(listsTable)
		.where(and(eq(listsTable.id, listId), editableBy(userId)))
		.limit(1)

	if (!rows.length) {
		throw new Error("Forbidden")
	}
}

/** Garante que todos os itens pertencem a listas editáveis pelo usuário e devolve o `listId` de cada um. */
export async function assertCanEditItems(itemIds: number[], userId: string) {
	const uniqueIds = [...new Set(itemIds)]
	if (uniqueIds.length === 0) {
		return new Map<number, string>()
	}

	const rows = await db
		.select({ id: listItemsTable.id, listId: listItemsTable.listId })
		.from(listItemsTable)
		.innerJoin(listsTable, eq(listsTable.id, listItemsTable.listId))
		.where(and(inArray(listItemsTable.id, uniqueIds), editableBy(userId)))

	if (rows.length !== uniqueIds.length) {
		throw new Error("Forbidden")
	}

	return new Map(rows.map((row) => [row.id, row.listId]))
}

/** Como o usuário logado enxerga a lista compartilhada. `null` quando ela não existe ou não está compartilhada. */
export async function getListAccess(listId: string, userId: string): Promise<ListAccess | null> {
	const [list] = await db
		.select({ userId: listsTable.userId, shared: listsTable.shared })
		.from(listsTable)
		.where(eq(listsTable.id, listId))
		.limit(1)

	if (!list) {
		return null
	}
	if (list.userId === userId) {
		return "owner"
	}
	if (!list.shared) {
		return null
	}

	const [saved] = await db
		.select({ id: sharedListsTable.id })
		.from(sharedListsTable)
		.where(and(eq(sharedListsTable.listId, listId), eq(sharedListsTable.userId, userId)))
		.limit(1)

	return saved ? "saved" : "link"
}

/** Atualiza todas as telas que exibem a lista: a do dono, a salva e a pública. */
export function revalidateList(listId: string) {
	revalidatePath(`/app/${listId}`)
	revalidatePath(`/app/${listId}/shared`)
	revalidatePath(`/s/${listId}`)
}
