'use server'

import db from "@/db/drizzle"
import { listItemInsertSchema, listItemsTable } from "@/db/schema"
import { requireSignedIn, requireUserId } from "@/lib/current-user"
import { recordInitialPrice, recordManualPrice } from "@/lib/price-refresh"
import { storeFromUrl } from "@/lib/storeFromUrl"
import { assertCanEditItems, assertCanEditList, revalidateList } from "@/services/list-access"
import { eq } from "drizzle-orm"
import { z } from "zod"

export type Root = {
    items: Root2[]
}

export interface Root2 {
    kind: string
    title: string
    htmlTitle: string
    link: string
    displayLink: string
    snippet: string
    htmlSnippet: string
    mime: string
    fileFormat: string
    image: Image
}

export interface Image {
    contextLink: string
    height: number
    width: number
    byteSize: number
    thumbnailLink: string
    thumbnailHeight: number
    thumbnailWidth: number
}

const IMAGE_CACHE_TTL_MS = 30 * 60 * 1000
const IMAGE_CACHE_MAX = 200
const imageCache = new Map<string, { url: string; expiresAt: number }>()

function imageCacheKey(query: string, next?: boolean) {
    return `${query.toLowerCase()}::${next ? "next" : "first"}`
}

function getCachedImage(key: string) {
    const hit = imageCache.get(key)
    if (!hit) {
        return
    }
    if (hit.expiresAt < Date.now()) {
        imageCache.delete(key)
        return
    }
    imageCache.delete(key)
    imageCache.set(key, hit)
    return hit.url
}

function setCachedImage(key: string, url: string) {
    if (imageCache.size >= IMAGE_CACHE_MAX) {
        const oldest = imageCache.keys().next().value
        if (oldest) {
            imageCache.delete(oldest)
        }
    }
    imageCache.set(key, { url, expiresAt: Date.now() + IMAGE_CACHE_TTL_MS })
}

export async function getItemImage(params: string, next?: boolean) {
    await requireSignedIn()
    const key = imageCacheKey(params, next)
    const cached = getCachedImage(key)
    if (cached !== undefined) {
        return cached
    }

    const url = new URL("https://www.googleapis.com/customsearch/v1")

    url.searchParams.append("key", process.env.GOOGLE_API_KEY || "")
    url.searchParams.append("cx", process.env.GOOGLE_CX_KEY || "")
    url.searchParams.append("q", params)
    url.searchParams.append("num", "5")
    url.searchParams.append("searchType", "image")
    url.searchParams.append("siteSearchFilter", "e")
    url.searchParams.append("siteSearch", "instagram.com|tiktok.com")

    if (next === true) {
        url.searchParams.append("start", "6")
    }

    const request = await fetch(url.href, {
        method: "GET",
        redirect: "follow"
    })

    if (request.ok) {
        const response: Root = await request.json()
        const result = response.items.find(item => item.link.includes("https://"))
        const imageUrl = result?.link || ""
        setCachedImage(key, imageUrl)
        return imageUrl
    }

    return ""
}

/** Campos de controle de preço pertencem ao servidor: o cliente (que pode ter dado velho) nunca os define. */
function serverManagedOmitted<T extends z.infer<typeof listItemInsertSchema>>(data: T) {
    const { originalPrice: _o, priceCheckedAt: _c, priceCheckStatus: _s, priceCheckFailures: _f, ...rest } = data
    return rest
}

export const createListItem = async (listId: string, data: z.infer<typeof listItemInsertSchema>) => {
    const userId = await requireUserId()
    await assertCanEditList(listId, userId)

    if (data.link && !data.store) {
        data.store = storeFromUrl(data.link)
    }

    const needsImage = data.imageUrl === ""
    if (needsImage) {
        data.imageUrl = await getItemImage(data.name)
    }

    const price = Number(data.price)
    const listItem = await db.insert(listItemsTable).values({ ...serverManagedOmitted(data), price, listId }).returning()
    await recordInitialPrice(listItem[0].id, price)

    revalidateList(listId)
    return listItem
}


export const deleteListItem = async (item: { id: number; listId: string }) => {
    const userId = await requireUserId()
    const lists = await assertCanEditItems([item.id], userId)
    await db.delete(listItemsTable).where(eq(listItemsTable.id, item.id))
    revalidateList(lists.get(item.id) ?? item.listId)
}


export const editListItem = async (listId: string, data: z.infer<typeof listItemInsertSchema>) => {
    const userId = await requireUserId()
    // O `listId` vem do cliente, então a lista real é sempre a do item gravado no banco.
    const lists = await assertCanEditItems([data.id!], userId)
    const realListId = lists.get(data.id!) ?? listId

    if (data.link && !data.store) {
        data.store = storeFromUrl(data.link)
    }

    const [current] = await db.select().from(listItemsTable).where(eq(listItemsTable.id, data.id!)).limit(1)
    const price = Number(String(data.price).replace("R$ ", "").replace(",", "").replace(".", ""))

    const listItem = await db.update(listItemsTable).set({ ...serverManagedOmitted(data), listId: realListId, price }).where(eq(listItemsTable.id, data.id!)).returning()

    if (current && price !== current.price) {
        // Edição manual do preço: vira o novo preço de referência e entra no histórico.
        await recordManualPrice(data.id!, price)
    } else if (current && (data.link ?? null) !== (current.link ?? null)) {
        // Link novo: força uma checagem na próxima abertura da lista.
        await db.update(listItemsTable).set({ priceCheckedAt: null, priceCheckStatus: null, priceCheckFailures: 0 }).where(eq(listItemsTable.id, data.id!))
    }

    revalidateList(realListId)
    return listItem
}

export const setItemImage = async (listId: string, itemId: number, imageUrl: string) => {
    const userId = await requireUserId()
    const lists = await assertCanEditItems([itemId], userId)
    await db.update(listItemsTable).set({ imageUrl }).where(eq(listItemsTable.id, itemId))
    revalidateList(lists.get(itemId) ?? listId)
}

export const markListItem = async (listId: string, itemId: number, isActive: number) => {
    const userId = await requireUserId()
    const lists = await assertCanEditItems([itemId], userId)
    await db.update(listItemsTable).set({ isActive }).where(eq(listItemsTable.id, itemId))
    revalidateList(lists.get(itemId) ?? listId)
}

export const reorderListItem = async (items: { id: number; order: number }[]) => {
    if (items.length === 0) {
        return
    }

    const userId = await requireUserId()
    const lists = await assertCanEditItems(items.map((item) => item.id), userId)

    await Promise.all(
        items.map((item) =>
            db.update(listItemsTable).set({ order: item.order }).where(eq(listItemsTable.id, item.id))
        )
    )

    for (const listId of new Set(lists.values())) {
        revalidateList(listId)
    }
}
