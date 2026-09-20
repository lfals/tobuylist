'use server'

import db from "@/db/drizzle"
import { listItemInsertSchema, listItemsTable } from "@/db/schema"
import { requireUserId } from "@/lib/current-user"
import { storeFromUrl } from "@/lib/storeFromUrl"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
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

export const createListItem = async (listId: string, data: z.infer<typeof listItemInsertSchema>) => {
    await requireUserId()

    if (data.link && !data.store) {
        data.store = storeFromUrl(data.link)
    }

    const needsImage = data.imageUrl === ""
    if (needsImage) {
        data.imageUrl = await getItemImage(data.name)
    }

    const listItem = await db.insert(listItemsTable).values({ ...data, price: Number(data.price), listId }).returning()

    revalidatePath(`/app/${listId}`)
    return listItem
}


export const deleteListItem = async (item: { id: number; listId: string }) => {
    await requireUserId()
    await db.delete(listItemsTable).where(eq(listItemsTable.id, item.id))
    revalidatePath(`/app/${item.listId}`)
}


export const editListItem = async (listId: string, data: z.infer<typeof listItemInsertSchema>) => {
    await requireUserId()

    if (data.link && !data.store) {
        data.store = storeFromUrl(data.link)
    }

    const listItem = await db.update(listItemsTable).set({ ...data, price: Number(String(data.price).replace("R$ ", "").replace(",", "").replace(".", "")) }).where(eq(listItemsTable.id, data.id!)).returning()

    revalidatePath(`/app/${listId}`)
    return listItem
}

export const markListItem = async (listId: string, itemId: number, isActive: number) => {
    await requireUserId()
    await db.update(listItemsTable).set({ isActive }).where(eq(listItemsTable.id, itemId))
    revalidatePath(`/app/${listId}`)
}

export const reorderListItem = async (items: { id: number; order: number }[]) => {
    if (items.length === 0) {
        return
    }

    await requireUserId()

    await Promise.all(
        items.map((item) =>
            db.update(listItemsTable).set({ order: item.order }).where(eq(listItemsTable.id, item.id))
        )
    )
}
