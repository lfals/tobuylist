import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
     return (
		<div className="flex flex-col gap-8">
			<div className="flex items-center gap-4">
				<div className="w-32">
					<h1>Total</h1>
                    <Skeleton className="w-full h-8" />
				</div>
				<div className="w-32">
					<h1>Listas</h1>
					<Skeleton className="w-full h-8" />
				</div>
			</div>
			<div className="grid grid-cols-5 gap-4 w-full">
				{Array.from({ length: 10 }).map((_, index) => (
					<Skeleton key={index} className="w-full h-[200px]" />
				))}
			</div>
		</div>
	);
}