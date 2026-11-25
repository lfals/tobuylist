import { useTranslations } from "next-intl"
import { useMemo } from "react"
import { z } from "zod"

export type ListFormValues = { name: string; description?: string }

// Valida o formulário de criar/editar lista. As mensagens de erro vêm do idioma atual.
export function useListFormSchema() {
	const t = useTranslations("ListForm.errors")

	return useMemo(
		() =>
			z.object({
				name: z
					.string()
					.min(2, t("nameMin"))
					.max(50, t("nameMax"))
					.refine((value) => value.trim() !== "", { message: t("nameBlank") }),
				description: z.string().max(50, t("descriptionMax")).optional(),
			}),
		[t],
	)
}
