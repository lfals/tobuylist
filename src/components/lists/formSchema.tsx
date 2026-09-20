import { z } from "zod"

const NON_DIGITS = /\D/g

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
    price: z.string().transform((val) => {
        return String(val).replace(NON_DIGITS, "")
    }),
    quantity: z.string().refine((val) => {
        return Number(val) > 0
    }, {
        message: "Quantidade deve ser maior que 0.",
    })
})
