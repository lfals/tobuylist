"use client"

import { useTranslations } from "next-intl"

// Rótulos só para leitores de tela que os componentes de UI (shadcn) escreviam em inglês.
export function CloseLabel() {
  const t = useTranslations("Common")
  return <span className="sr-only">{t("close")}</span>
}

export function ToggleSidebarLabel() {
  const t = useTranslations("Common")
  return <span className="sr-only">{t("toggleSidebar")}</span>
}

export function useToggleSidebarLabel() {
  return useTranslations("Common")("toggleSidebar")
}
