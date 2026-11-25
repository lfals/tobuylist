import { useTranslations } from "next-intl"
import { useMemo } from "react"
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

type ErrorKey = "nameMin" | "linkInvalid" | "quantityMin"

function buildItemFormSchema(t: (key: ErrorKey) => string) {
    return z.object({
        name: z.string().min(2, {
            message: t("nameMin"),
        }),
        link: z.union([z.literal(""), z.string().trim().url(t("linkInvalid"))]),
        store: z.string(),
        imageUrl: z.string(),
        price: z.string().transform((val) => {
            return String(val).replace(NON_DIGITS, "")
        }),
        quantity: z.string().refine((val) => {
            return Number(val) > 0
        }, {
            message: t("quantityMin"),
        })
    })
}

export type ItemFormValues = z.infer<ReturnType<typeof buildItemFormSchema>>

// Valida o formulário de item. As mensagens de erro vêm do idioma atual.
export function useItemFormSchema() {
    const t = useTranslations("ItemForm.errors")
    return useMemo(() => buildItemFormSchema(t), [t])
}
