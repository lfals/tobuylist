"use server"
import db from "@/db/drizzle";
import { listsTable } from "@/db/schema";
import { List } from "@/types";
import { currentUser } from "@clerk/nextjs/server";
import { faker } from '@faker-js/faker'
import { and, eq } from "drizzle-orm";


const getLists = async (id: number): Promise<List[]> => {
    const user = await currentUser()
    const list = await db.select().from(listsTable).where(and(eq(listsTable.userId, user?.id!), eq(listsTable.id, id)))
    console.log(list)
    try {
        const response = await new Promise<List[]>((resolve) => {
            setTimeout(() => {
                resolve(data)
            }, 1000)
        })
        return response;
    } catch (error) {
        console.log(error);
        return [];
    }
}

export default getLists;