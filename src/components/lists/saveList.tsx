"use client"

import { Button } from "@/components/ui/button";
import { saveList } from "@/services/lists";
import { useParams } from "next/navigation";

export function SaveList() {
    const { list } = useParams()


    return (
        <Button onClick={() => saveList(list as string)}>Salvar lista</Button>
    )
}