export type List = {
	description: string;
	id: number;
	isActive: number;
	name: string;
	createdAt: number;
	updatedAt: number;
	userId: string;
}

export type ListCard = {
	description: string;
	totalItems: number;
	totalValue: number;
} & List;


export type ListItem = {
	title: string;
	id: string;
	quantity: number;
	value: number;
	store: string;
	link: string;
}

export type ListDetails = {
	id: number;
	name: string;
	createdAt: number;
	updatedAt: number;
	isActive: number;
	listId: number;
	store: string | null;
	link: string | null;
	price: number;
	quantity: number;
	items: {
		name: string;
		link: string | null;
		id: number;
		createdAt: number;
		updatedAt: number;
		isActive: number;
		price: number;
		quantity: number;
		listId: number;
		store: string | null;
	}[];

}