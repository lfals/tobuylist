import {
	Card,
	CardTitle,
	CardContent,
	CardDescription,
	CardHeader,
} from "@/components/ui/card";
import { getListDashboard } from "@/services/lists";
import Link from "next/link";

export default async function Dashboard() {
	const listsCards = await getListDashboard()
	return (
		<div className="flex flex-col gap-8 h-[calc(100vh-160px)]">
			<div className="flex items-center gap-4">
				<div className="w-32">
					<h1>Total</h1>
					<p className="text-2xl font-bold">R$1200</p>
				</div>
				<div className="w-32">
					<h1>Listas</h1>
					<p className="text-2xl font-bold">12</p>
				</div>
			</div>
			<div className="grid grid-cols-5 grid-auto-rows-[200px] gap-4 w-full overflow-y-auto scrollbar-hide pb-4">
				{listsCards.map((listCard) => (
					<Link href={`/app/${listCard.id}`} key={listCard.id}>
						<Card className="w-full h-48 flex flex-col justify-between">
							<CardHeader>
								<CardTitle>{listCard.name}</CardTitle>
								<CardDescription className="line-clamp-3">{listCard.description}</CardDescription>
							</CardHeader>
							{/* <CardContent >
								<div className="flex items-center justify-between gap-2">
									<div>
										<h1>Itens</h1>
										<p>{listCard.totalItems}</p>
									</div>
									<div>
										<h1>Total</h1>
										<p>{(listCard.totalValue / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
									</div>
								</div>
							</CardContent> */}
						</Card></Link>
				))}
			</div>
		</div>
	);
}
