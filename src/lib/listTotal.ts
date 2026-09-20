import type { Cents } from "./money"

export type TotalLine = {
	price: Cents
	quantity: number
	isActive: number
}

export function totalCents(items: TotalLine[]): Cents {
	let total = 0
	for (const item of items) {
		if (item.isActive) {
			total += item.price * item.quantity
		}
	}
	return total
}
