"use client"

import { useAuth } from "@clerk/nextjs"
import { isDueForRefresh, OPEN_LIST_TTL_MS } from "@/lib/price-history"
import { deleteListItem, getItemImage, markListItem, reorderListItem, setItemImage } from "@/services/listItem"
import type { ListItemRecord } from "@/types/list"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { DeleteItemDialog, EditItemDialog } from "./item-dialogs"
import { StaticItemRow } from "./item-card"

// O gráfico (recharts) é pesado e só serve depois do clique: fica fora do bundle inicial da lista.
const loadPriceHistoryDialog = () => import("./price-history-dialog").then((mod) => mod.PriceHistoryDialog)
const PriceHistoryDialog = dynamic(loadPriceHistoryDialog)

const ReorderableItemList = dynamic(() =>
	import("./item-row").then((mod) => mod.ReorderableItemList),
)

function orderSignature(items: ListItemRecord[]) {
	return items.map((item) => item.id).join(",")
}

export default function Items({
	items: initialItems,
	listId,
	canEdit,
	showImage = true,
}: {
	items: ListItemRecord[]
	listId: string
	canEdit: boolean
	showImage?: boolean
}) {
	const [items, setItems] = useState(initialItems)
	const [editingItem, setEditingItem] = useState<ListItemRecord | null>(null)
	const [deletingItem, setDeletingItem] = useState<ListItemRecord | null>(null)
	const [historyItem, setHistoryItem] = useState<ListItemRecord | null>(null)
	const [historyOpen, setHistoryOpen] = useState(false)
	const router = useRouter()
	const { isLoaded, isSignedIn } = useAuth()
	const refreshStartedFor = useRef<string>(undefined)
	const lastSavedOrder = useRef(orderSignature(initialItems))
	const persistTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
	const [, startMarking] = useTransition()

	useEffect(() => {
		setItems(initialItems)
		lastSavedOrder.current = orderSignature(initialItems)
	}, [initialItems])

	// Ao abrir a lista, confere em segundo plano os preços vencidos (> 24h). A tela não espera por isso:
	// os preços aparecem como estão salvos e, se algum mudar, a lista é recarregada.
	useEffect(() => {
		if (!isLoaded || !isSignedIn || refreshStartedFor.current === listId) {
			return
		}
		const now = Date.now()
		if (!initialItems.some((item) => isDueForRefresh(item, now, OPEN_LIST_TTL_MS))) {
			return
		}
		refreshStartedFor.current = listId
		fetch(`/api/mobile/lists/${listId}/refresh-prices`, { method: "POST" })
			.then((response) => (response.ok ? response.json() : null))
			.then((result: { updated?: number } | null) => {
				if (result?.updated) {
					router.refresh()
				}
			})
			.catch(() => {})
	}, [isLoaded, isSignedIn, listId, initialItems, router])

	// Depois que a lista carregou, baixa o chunk do gráfico em ociosidade para o clique abrir sem espera.
	useEffect(() => {
		const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 1500))
		const handle = idle(() => void loadPriceHistoryDialog())
		return () => (window.cancelIdleCallback ?? window.clearTimeout)(handle as number)
	}, [])

	const handleHistory = useCallback((current: ListItemRecord) => {
		setHistoryItem(current)
		setHistoryOpen(true)
	}, [])

	const handleMark = useCallback((current: ListItemRecord) => {
		startMarking(async () => {
			await markListItem(listId, current.id, current.isActive ? 0 : 1)
		})
	}, [listId, startMarking])

	const handleImageError = useCallback((current: ListItemRecord) => {
		void (async () => {
			const imageUrl = await getItemImage(current.name, true)
			await setItemImage(listId, current.id, imageUrl)
		})()
	}, [listId])

	function handleReorder(nextItems: ListItemRecord[]) {
		setItems(nextItems)
		if (!canEdit) {
			return
		}

		clearTimeout(persistTimer.current)
		persistTimer.current = setTimeout(() => {
			const signature = orderSignature(nextItems)
			if (signature === lastSavedOrder.current) {
				return
			}
			lastSavedOrder.current = signature
			void reorderListItem(nextItems.map((item, index) => ({ id: item.id, order: index })))
		}, 1000)
	}

	const rowProps = {
		canEdit,
		showImage,
		onEdit: setEditingItem,
		onDelete: setDeletingItem,
		onMark: handleMark,
		onHistory: handleHistory,
		onImageError: showImage && canEdit ? handleImageError : undefined,
	}

	return (
		<>
			{canEdit ? (
				<ReorderableItemList items={items} onReorder={handleReorder} {...rowProps} />
			) : (
				<div className="flex flex-col gap-4">
					{items.map((item) => (
						<StaticItemRow key={item.id} item={item} {...rowProps} />
					))}
				</div>
			)}
			{historyItem ? <PriceHistoryDialog item={historyItem} open={historyOpen} onOpenChange={setHistoryOpen} /> : null}
			{canEdit ? (
				<>
					<EditItemDialog
						item={editingItem}
						listId={listId}
						open={Boolean(editingItem)}
						showImageUrl={showImage}
						onOpenChange={(open) => {
							if (!open) {
								setEditingItem(null)
							}
						}}
					/>
					<DeleteItemDialog
						item={deletingItem}
						open={Boolean(deletingItem)}
						onOpenChange={(open) => {
							if (!open) {
								setDeletingItem(null)
							}
						}}
					/>
				</>
			) : null}
		</>
	)
}
