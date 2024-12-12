import { List } from "@/types";
import { faker } from '@faker-js/faker'


const getLists = async (): Promise<List[]> => {

    const data = Array.from({ length: faker.number.int({ min: 10, max: 200 }) }).map((_, index) => ({
        title: faker.lorem.word(),
        id: faker.string.uuid(),
    }));

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