import {
	Card,
	CardTitle,
	CardContent,
	CardDescription,
	CardHeader,
} from "@/components/ui/card";

export default function Dashboard() {
	return (
		<div className="flex flex-col gap-8">
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
			<div className="grid grid-cols-5 gap-4 w-full">
				{Array.from({ length: 10 }).map((_, index) => (
					<Card key={index} className="w-full">
						<CardHeader>
							<CardTitle>Card Title</CardTitle>
							<CardDescription>Card Description</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between gap-2">
								<div>
									<h1>Itens</h1>
									<p>12</p>
								</div>
								<div>
									<h1>Total</h1>
									<p>R$1200</p>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
