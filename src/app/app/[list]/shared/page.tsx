import Items from "@/components/lists/shared/items"
import SharedHeader from "@/components/lists/shared/shared-header"
import { getSharedListDetails } from "@/services/lists"

export default async function SharedListPage({ params }: { params: Promise<{ list: string }> }) {
    const param = await params
    const data = await getSharedListDetails(param.list)
    return (
        <>
            {data ? (
                <div className="flex flex-col gap-10">
                    <SharedHeader data={data} />
                    <div className="flex flex-col gap-4">
                        <Items data={data} />
                    </div>
                </div >
            ) : (
                <div className="flex flex-col gap-10">
                    <h1>Lista não encontrada</h1>
                </div>
            )}
        </>
    )
}