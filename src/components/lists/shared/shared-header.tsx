import { useFormatViewNumber } from "@/hooks/formatViewNumber";

export default function SharedHeader({ data }: { data: any }) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold">{useFormatViewNumber(data?.totalValue.toString() ?? "0")}</h1>
                <h2 className="text-4xl font-bold">{data?.name}</h2>
                <p className="text-sm text-gray-500">{data?.description}</p>
            </div>
            <div className="flex items-center gap-2">

            </div>
        </div>
    )
}