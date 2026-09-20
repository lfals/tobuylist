"use client"

import { Button } from "@/components/ui/button";
import { saveList } from "@/services/lists";
import { useEffect } from "react";
import { toast } from "sonner"

export function SaveList({ isPublic, listId }: { isPublic: boolean; listId: string }) {
    useEffect(() => {
        if (!isPublic) {
            return
        }

        toast("Esta lista é compartilhada com você. Caso queira editar, adicione às suas listas.",
            {
                duration: 10000,
                action: {
                    label: "Adicionar",
                    onClick: () => {
                        void saveList(listId)
                    }
                }

            }
        )
    }, [isPublic, listId])

    return (
        <Button onClick={() => saveList(listId)}>Salvar lista</Button>
    )
}