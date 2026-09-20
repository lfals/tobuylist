import {
	Card,
	CardTitle,
	CardContent,
	CardDescription,
	CardHeader,
} from "@/components/ui/card"
import { formatDisplay } from "@/lib/money"
import { getListDashboard } from "@/services/lists-queries"
import Link from "next/link"

export default async function Dashboard() {
	const listsCards = await getListDashboard()
	return (
		<div className="flex flex-col gap-8 h-[calc(100vh-160px)]">
			<div className="flex items-center gap-8">
				<div className="min-w-32">
					<h1>Total</h1>
					<p className="text-2xl font-bold">{formatDisplay(listsCards.totalValue)}</p>
				</div>
				<div>
					<h1>Listas</h1>
					<p className="text-2xl font-bold">{listsCards.lists.length}</p>
				</div>
				<div>
					<h1>Itens</h1>
					<p className="text-2xl font-bold">{listsCards.items}</p>
				</div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 grid-auto-rows-[200px] gap-4 w-full overflow-y-auto scrollbar-hide pb-4">
				{listsCards.lists.length > 0 ? listsCards.lists.map((listCard) => (
					<Link href={`/app/${listCard.id}`} key={listCard.id} prefetch>
						<Card className="cv-card w-full h-48 flex flex-col justify-between">
							<CardHeader>
								<CardTitle>{listCard.name}</CardTitle>
								<CardDescription className="line-clamp-3">{listCard.description}</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex items-center justify-between gap-2">
									<div>
										<h1>Itens</h1>
										<p>{listCard.items}</p>
									</div>
									<div>
										<h1>Total</h1>
										<p>{formatDisplay(listCard.totalValue)}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</Link>
				)) : <p>Sem listas</p>}
			</div>
		</div>
	)
}
