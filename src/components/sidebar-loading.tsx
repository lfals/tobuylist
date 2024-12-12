import { Skeleton } from "./ui/skeleton";

export function SidebarLoading() {
    return (
        <div className="flex flex-col gap-2">
            {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton key={index} className="w-full h-[30px] rounded-md" />
            ))}
        </div>   
    )
}