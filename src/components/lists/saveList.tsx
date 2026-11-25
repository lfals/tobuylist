"use client"

import { Button } from "@/components/ui/button"
import { saveList } from "@/services/lists"
import { Loader2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTransition } from "react"

export function SaveList({ listId }: { listId: string }) {
    const t = useTranslations("Share")
    const [isSaving, startSaving] = useTransition()

    return (
        <Button
            variant="outline"
            disabled={isSaving}
            onClick={() => startSaving(async () => { await saveList(listId) })}
        >
            {isSaving ? <Loader2Icon className="animate-spin" /> : t("saveToMyLists")}
        </Button>
    )
}
