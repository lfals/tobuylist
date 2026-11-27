"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatNumber, formatViewNumber } from "@/lib/format-number"
import { cn } from "@/lib/utils"
import { addItemLink, deleteItemLink } from "@/services/listItem"
import type { ItemLinkRecord, ListItemRecord } from "@/types/list"
import { ExternalLinkIcon, Loader2Icon, Trash2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { useMemo, useState, useTransition, type ReactNode } from "react"

export function faviconUrl(link: string) {
	return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(link)}&size=24#refinements`
}

/** Links do item; itens antigos, sem registros, usam o link/preço da própria linha. */
export function linksOf(item: ListItemRecord): Pick<ItemLinkRecord, "id" | "link" | "store" | "price">[] {
	if (item.links.length > 0) {
		return item.links
	}
	return item.link ? [{ id: 0, link: item.link, store: item.store, price: item.price }] : []
}

function isValidUrl(value: string) {
	try {
		return ["http:", "https:"].includes(new URL(value).protocol)
	} catch {
		return false
	}
}

function AddLinkForm({ itemId }: { itemId: number }) {
	const t = useTranslations("ItemLinks")
	const tForm = useTranslations("ItemForm")
	const [link, setLink] = useState("")
	const [price, setPrice] = useState("R$ 0,00")
	const [error, setError] = useState<string | null>(null)
	const [isSaving, startSaving] = useTransition()

	function submit(event: React.FormEvent) {
		event.preventDefault()
		const trimmed = link.trim()
		if (!isValidUrl(trimmed)) {
			setError(t("invalidLink"))
			return
		}
		setError(null)
		startSaving(async () => {
			await addItemLink(itemId, { link: trimmed, price: Number(price.replace(/\D/g, "")) })
			setLink("")
			setPrice("R$ 0,00")
		})
	}

	return (
		<form onSubmit={submit} className="flex flex-col gap-2 border-t pt-4">
			<p className="text-sm font-medium">{t("addTitle")}</p>
			<Input
				type="url"
				value={link}
				placeholder={tForm("linkPlaceholder")}
				aria-label={tForm("link")}
				onChange={(event) => setLink(event.target.value)}
				disabled={isSaving}
			/>
			<div className="flex gap-2">
				<Input
					type="text"
					inputMode="numeric"
					value={price}
					aria-label={tForm("price")}
					onChange={(event) => setPrice(formatNumber(event.target.value))}
					disabled={isSaving}
				/>
				<Button type="submit" disabled={isSaving || !link.trim()}>
					{isSaving ? <Loader2Icon size={16} className="animate-spin" /> : t("add")}
				</Button>
			</div>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
		</form>
	)
}

function LinkRow({ entry, isCheapest, canDelete, itemName }: {
	entry: Pick<ItemLinkRecord, "id" | "link" | "store" | "price">
	isCheapest: boolean
	canDelete: boolean
	itemName: string
}) {
	const t = useTranslations("ItemLinks")
	const tCommon = useTranslations("Common")
	const [isDeleting, startDeleting] = useTransition()

	return (
		<li className={cn("flex items-center gap-3 rounded-md border p-3", isCheapest && "border-green-600/60")}>
			<Image src={faviconUrl(entry.link)} alt="" width={16} height={16} unoptimized className="shrink-0" />
			<div className="flex min-w-0 flex-1 flex-col">
				<a href={entry.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 truncate text-sm hover:underline" title={entry.link}>
					<span className="truncate">{entry.store || itemName}</span>
					<ExternalLinkIcon size={12} className="shrink-0" />
				</a>
				{isCheapest ? <span className="text-xs text-green-600">{t("cheapest")}</span> : null}
			</div>
			<span className="font-semibold whitespace-nowrap">{formatViewNumber(entry.price.toString())}</span>
			{canDelete ? (
				<Button
					size="icon"
					variant="ghost"
					aria-label={tCommon("delete")}
					disabled={isDeleting}
					onClick={() => startDeleting(async () => { await deleteItemLink(entry.id) })}
				>
					{isDeleting ? <Loader2Icon size={16} className="animate-spin" /> : <Trash2Icon size={16} />}
				</Button>
			) : null}
		</li>
	)
}

function LinksContent({ item, canEdit }: { item: ListItemRecord; canEdit: boolean }) {
	const t = useTranslations("ItemLinks")
	const links = useMemo(() => linksOf(item), [item])
	const cheapestId = useMemo(() => {
		const priced = links.filter((entry) => entry.price > 0)
		return (priced.length > 1 ? priced.reduce((a, b) => (b.price < a.price ? b : a)) : undefined)?.id
	}, [links])

	return (
		<div className="flex flex-col gap-4">
			{links.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : (
				<ul className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
					{links.map((entry) => (
						<LinkRow
							key={`${entry.id}-${entry.link}`}
							entry={entry}
							itemName={item.name}
							isCheapest={entry.id === cheapestId}
							// Registros só existem a partir de 2 links; o último nunca pode ser removido.
							canDelete={canEdit && item.links.length > 1}
						/>
					))}
				</ul>
			)}
			{canEdit ? <AddLinkForm itemId={item.id} /> : null}
		</div>
	)
}

export function ItemLinksDialog({ item, canEdit, open, onOpenChange }: {
	item: ListItemRecord | null
	canEdit: boolean
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const isMobile = useIsMobile()
	const t = useTranslations("ItemLinks")
	const content: ReactNode = item ? <LinksContent item={item} canEdit={canEdit} /> : null

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={onOpenChange}>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle className="truncate">{item?.name}</DrawerTitle>
						<DrawerDescription>{t("description")}</DrawerDescription>
					</DrawerHeader>
					<div className="p-4 pt-0">{content}</div>
				</DrawerContent>
			</Drawer>
		)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[480px]">
				<DialogHeader>
					<DialogTitle className="truncate pr-6">{item?.name}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				{content}
			</DialogContent>
		</Dialog>
	)
}
