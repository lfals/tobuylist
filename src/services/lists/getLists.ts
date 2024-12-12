import db from "@/db/drizzle";
import { listsTable } from "@/db/schema";
import { List } from "@/types";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";


const getLists = async (): Promise<List[]> => {

    try {
        const user = await currentUser()
        const lists = await db.select().from(listsTable).where(eq(listsTable.userId, user?.id!))
        return lists;
    } catch (error) {
        console.log(error);
        return [];
    }
}

export default getLists;