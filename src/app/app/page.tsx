import {
	Card,
	CardTitle,
	CardContent,
	CardDescription,
	CardHeader,
} from "@/components/ui/card";
import { useFormatViewNumber } from "@/hooks/formatViewNumber";
import { useFormatNumber } from "@/hooks/use-formatNumber";
import { getListDashboard } from "@/services/lists";
import Link from "next/link";


export default async function Dashboard() {
	const listsCards = await getListDashboard()
	return (
		<>
			<div className="flex flex-col gap-8 h-[calc(100vh-160px)]">
				<div className="flex items-center gap-8">
					<div className="min-w-32">
						<h1>Total</h1>
						<p className="text-2xl font-bold">{useFormatViewNumber(listsCards.totalValue.toString())}</p>
					</div>
					<div >
						<h1>Listas</h1>
						<p className="text-2xl font-bold">{listsCards.lists.length}</p>
					</div>
					<div >
						<h1>Itens</h1>
						<p className="text-2xl font-bold">{listsCards.items}</p>
					</div>
				</div>
				<div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 grid-auto-rows-[200px] gap-4 w-full overflow-y-auto scrollbar-hide pb-4">
					{listsCards.lists.length > 0 ? listsCards.lists.map((listCard) => (
						<Link href={`/app/${listCard.list.id}`} key={listCard.list.id}>
							<Card className="w-full h-48 flex flex-col justify-between">
								<CardHeader>
									<CardTitle>{listCard.list.name}</CardTitle>
									<CardDescription className="line-clamp-3">{listCard.list.description}</CardDescription>
								</CardHeader>
								<CardContent >
									<div className="flex items-center justify-between gap-2">
										<div>
											<h1>Itens</h1>
											<p>{listCard.items}</p>
										</div>
										<div>
											<h1>Total</h1>
											<p >{useFormatViewNumber(listCard.totalValue.toString())}</p>
										</div>
									</div>
								</CardContent>
							</Card></Link>
					)) : <p>Sem listas</p>}
				</div>
			</div >
		</>
	);
}
