import db from "@/db/drizzle";
import { listsTable } from "@/db/schema";
import { ListCard } from "@/types";
import { currentUser } from "@clerk/nextjs/server";
import { faker } from '@faker-js/faker'
import { eq } from "drizzle-orm";

const getListsCards = async (): Promise<ListCard[]> => {
    // const user = await currentUser()
    // const lists = await db.select().from(listsTable).where(eq(listsTable.userId, user?.id!))

    const data = Array.from({ length: faker.number.int({ min: 10, max: 200 }) }).map((_, index) => ({
        title: faker.lorem.word(),
        id: faker.string.uuid(),
        description: faker.lorem.sentence(10),
        totalItems: faker.number.int({ min: 10, max: 100 }),
        totalValue: faker.number.int({ min: 10, max: 10000000 }),
    }));
    try {
        const response = await new Promise<ListCard[]>((resolve) => {
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

export default getListsCards;