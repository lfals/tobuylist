import { Skeleton } from "@/components/ui/skeleton"

export function ListHeaderSkeleton() {
	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-col gap-2 w-2/4">
				<Skeleton className="w-full h-9" />
				<Skeleton className="w-full h-9" />
			</div>
			<div className="w-1/6">
				<Skeleton className="w-full h-9" />
			</div>
		</div>
	)
}

export function ListItemsSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			{Array.from({ length: 8 }).map((_, index) => (
				<Skeleton key={index} className="w-full p-4 rounded-md h-20" />
			))}
		</div>
	)
}
