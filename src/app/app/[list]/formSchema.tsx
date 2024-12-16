import { z } from "zod"

export const formSchema = z.object({
    name: z.string().min(2, {
        message: "Nome deve ter pelo menos 2 caracteres.",
    }),
    link: z.union([z.literal(""), z.string().trim().url()]),
    store: z.string(),
    price: z.string().transform((val) => {
        return String(val).replace(/[^\d.,]/g, '').replace(',', '').replace('.', '')
    }),
    quantity: z.string().refine((val) => {
        return Number(val) > 0
    }, {
        message: "Quantidade deve ser maior que 0.",
    })
})

