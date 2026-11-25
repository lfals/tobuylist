"use client"

import { Moon, Sun } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"

export function LandingThemeToggle() {
	const t = useTranslations("Theme")
	const { resolvedTheme, setTheme } = useTheme()

	return (
		<button
			type="button"
			onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
			aria-label={t("toggleLanding")}
			className="relative inline-flex size-10 items-center justify-center rounded-full text-lp-muted transition-colors hover:bg-lp-sunken hover:text-lp-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent"
		>
			<Sun className="size-5 dark:hidden" aria-hidden />
			<Moon className="hidden size-5 dark:block" aria-hidden />
		</button>
	)
}
