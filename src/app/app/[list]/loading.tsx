import { ListHeaderSkeleton, ListItemsSkeleton } from "@/components/lists/list-skeletons";

export default function Loading() {
    return (
        <div className="flex flex-col gap-10">
            <ListHeaderSkeleton />
            <ListItemsSkeleton />
        </div>
    );
}
