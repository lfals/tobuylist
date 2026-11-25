import db from "@/db/drizzle"
import { listsTable } from "@/db/schema"
import { ApiError, json, readJson, requireApiUserId, requireList, route, shareUrl } from "@/lib/mobile-api"
import { eq } from "drizzle-orm"
import { z } from "zod"

type Context = { params: Promise<{ listId: string }> }

const schema = z.object({ isPublic: z.boolean() })

/** Habilita o compartilhamento (somente leitura ou colaborativo) e devolve o link. */
export const POST = route<Context>(async (request, { params }) => {
	const userId = await requireApiUserId()
	const { listId } = await params
	const { access } = await requireList(listId, userId)
	if (access !== "owner") {
		throw new ApiError(403, "Somente o dono pode compartilhar a lista")
	}

	const { isPublic } = schema.parse(await readJson(request))
	await db
		.update(listsTable)
		.set({ public: isPublic ? 1 : 0, shared: 1 })
		.where(eq(listsTable.id, listId))

	return json({ url: shareUrl(request, listId), public: isPublic ? 1 : 0 })
})
