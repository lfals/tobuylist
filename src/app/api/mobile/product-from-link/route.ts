import { json, readJson, requireApiUserId, route } from "@/lib/mobile-api"
import { fetchProductFromLink } from "@/services/productFromLink"
import { z } from "zod"

const schema = z.object({ url: z.string().trim().url() })

/** Autopreenchimento do formulário de item a partir do link do produto. */
export const POST = route(async (request) => {
	await requireApiUserId()
	const { url } = schema.parse(await readJson(request))
	return json(await fetchProductFromLink(url))
})
