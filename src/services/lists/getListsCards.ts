import {  ListCard } from "@/types";
import {faker} from '@faker-js/faker'

const getListsCards = async (): Promise<ListCard[]> => {
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