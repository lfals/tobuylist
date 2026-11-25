import { getItemImageSafe } from "@/lib/mobile-items"
import { json, requireApiUserId, route } from "@/lib/mobile-api"

/** Busca uma imagem alternativa para o item (?q=nome&next=true). */
export const GET = route(async (request) => {
	await requireApiUserId()
	const { searchParams } = new URL(request.url)
	const query = searchParams.get("q")?.trim()
	if (!query) {
		return json({ imageUrl: "" })
	}
	return json({ imageUrl: await getItemImageSafe(query, searchParams.get("next") === "true") })
})
