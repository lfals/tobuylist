import { centsFromInput } from "@/lib/money"
import { z } from "zod"

export const emptyItemFormValues = {
	name: "",
	link: "",
	imageUrl: "",
	store: "",
	price: "R$ 0,00",
	quantity: "1",
}

export const formSchema = z.object({
	name: z.string().min(2, {
		message: "Nome deve ter pelo menos 2 caracteres.",
	}),
	link: z.union([z.literal(""), z.string().trim().url()]),
	store: z.string(),
	imageUrl: z.string(),
	price: z.string().transform((val) => centsFromInput(val)),
	quantity: z.coerce.number().int().min(1, {
		message: "Quantidade deve ser maior que 0.",
	}),
})
