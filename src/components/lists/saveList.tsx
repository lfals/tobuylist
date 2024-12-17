"use client"

import { Button } from "@/components/ui/button";
import { saveList } from "@/services/lists";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner"

export function SaveList({ isPublic }: { isPublic: boolean }) {
    const { list } = useParams()
    const searchParams = useSearchParams()
    const isShared = searchParams.get('share')

    useEffect(() => {
        if (Boolean(isShared) && isPublic) {
            toast("Esta lista é compartilhada com você. Caso queira editar, adicione às suas listas.",
                {
                    duration: 10000,
                    action: {
                        label: "Adicionar",
                        onClick: () => {
                            saveList(list as string)
                        }
                    }

                }
            )

        }
    }, [])
    return (
        <Button onClick={() => saveList(list as string)}>Salvar lista</Button>
    )
}