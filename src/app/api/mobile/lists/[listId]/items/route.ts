import db from "@/db/drizzle"
import { listItemsTable } from "@/db/schema"
import { getItemImageSafe, itemInputSchema } from "@/lib/mobile-items"
import { json, readJson, requireApiUserId, requireEditableList, route } from "@/lib/mobile-api"
import { storeFromUrl } from "@/lib/storeFromUrl"

type Context = { params: Promise<{ listId: string }> }

export const POST = route<Context>(async (request, { params }) => {
	const userId = await requireApiUserId()
	const { listId } = await params
	const { access } = await requireEditableList(listId, userId)

	const data = itemInputSchema.parse(await readJson(request))
	const store = data.store || (data.link ? storeFromUrl(data.link) : "")
	// Listas salvas não exibem imagens (igual ao site), então não gastamos cota de busca.
	const imageUrl = data.imageUrl || (access === "owner" ? await getItemImageSafe(data.name) : "")

	const [item] = await db
		.insert(listItemsTable)
		.values({
			listId,
			name: data.name,
			link: data.link || null,
			store: store || null,
			imageUrl: imageUrl || null,
			price: data.price,
			quantity: data.quantity,
		})
		.returning()

	return json({ item }, { status: 201 })
})
