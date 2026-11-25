import { getItemImage } from "@/services/listItem"
import { z } from "zod"

/** Preço sempre em centavos (inteiro), igual ao armazenado no banco. */
export const itemInputSchema = z.object({
	name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres."),
	link: z.union([z.literal(""), z.string().trim().url("Link deve ser uma URL válida.")]).optional(),
	store: z.string().trim().optional(),
	imageUrl: z.string().trim().optional(),
	price: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
	quantity: z.number().int().min(1, "Quantidade deve ser maior que 0."),
})

export async function getItemImageSafe(query: string, next?: boolean) {
	try {
		return await getItemImage(query, next)
	} catch {
		return ""
	}
}
