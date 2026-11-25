import { createNavigation } from "next-intl/navigation"
import { routing } from "./routing"

// Link/redirect que respeitam o prefixo de idioma da landing (ex.: "/" vira "/en" em inglês).
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
