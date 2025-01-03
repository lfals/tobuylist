'use server'

import db from "@/db/drizzle"
import { listItemInsertSchema, listItemsTable } from "@/db/schema"
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


export async function getItemImage(params: string, next?: boolean) {


    const url = new URL("https://www.googleapis.com/customsearch/v1")

    url.searchParams.append("key", process.env.GOOGLE_API_KEY || "")
    url.searchParams.append("cx", process.env.GOOGLE_CX_KEY || "")
    url.searchParams.append("q", params)
    url.searchParams.append("num", "5")
    url.searchParams.append("searchType", "image")
    // url.searchParams.append("safe", "active")
    url.searchParams.append("siteSearchFilter", "e")
    url.searchParams.append("siteSearch", "instagram.com|tiktok.com")

    if (next === true) {
        url.searchParams.append("start", "6")
    }

    console.log(url.href)
    const request = await fetch(url.href, {
        method: "GET",
        redirect: "follow"
    })

    if (request.ok) {
        const response: Root = await request.json()
        const result = response.items.find(item => item.link.includes("https://"))

        return result?.link || ""
    }

    console.log(request)


    return ""

}

export const createListItem = async (listId: string, data: z.infer<typeof listItemInsertSchema>) => {


    if (data.link && !data.store) {
        data.store = new URL(data.link).hostname
    }

    console.log(data.imageUrl)

    if (data.imageUrl === "") {
        data.imageUrl = await getItemImage(data.name)
    }



    const listItem = await db.insert(listItemsTable).values({ ...data, price: Number(data.price), listId }).returning()

    revalidatePath(`/app/${listId}`)
    return listItem
}


export const deleteListItem = async (item: any) => {
    await db.delete(listItemsTable).where(eq(listItemsTable.id, item.id))
    revalidatePath(`/app/${item.listId}`)
}


export const editListItem = async (listId: string, data: z.infer<typeof listItemInsertSchema>) => {

    if (data.link && !data.store) {
        data.store = new URL(data.link).hostname.replace("www.", "").split(".")[0]
    }


    const listItem = await db.update(listItemsTable).set({ ...data, price: Number(String(data.price).replace("R$ ", "").replace(",", "").replace(".", "")) }).where(eq(listItemsTable.id, data.id!)).returning()

    revalidatePath(`/app/${listId}`)
    return listItem
}

export const markListItem = async (listId: string, itemId: number, isActive: number) => {
    await db.update(listItemsTable).set({ isActive }).where(eq(listItemsTable.id, itemId))
    revalidatePath(`/app/${listId}`)
}

export const reorderListItem = async (items: any[]) => {

    await db.transaction(async (tx) => {
        for (const item of items) {
            await tx.update(listItemsTable).set({ order: item.order }).where(eq(listItemsTable.id, item.id))
        }
    })
}