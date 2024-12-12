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
