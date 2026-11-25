import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SharedListNotFound() {
	return (
		<div className="flex flex-col items-start gap-4 py-10">
			<h1 className="text-3xl font-bold">Lista não encontrada</h1>
			<p className="text-muted-foreground">
				O link pode estar errado ou o dono deixou de compartilhar esta lista.
			</p>
			<Button asChild>
				<Link href="/">Ir para o início</Link>
			</Button>
		</div>
	)
}
