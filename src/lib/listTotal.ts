import { listItemsTable } from "@/db/schema"
import { sql } from "drizzle-orm"
import type { Cents } from "./money"

export type TotalLine = {
	price: Cents
	quantity: number
	isActive: number
}

/** In-memory adapter: sum active items as Cents × quantity. */
export function totalCents(items: TotalLine[]): Cents {
	let total = 0
	for (const item of items) {
		if (item.isActive) {
			total += item.price * item.quantity
		}
	}
	return total
}

/** SQL adapter: same List total rule for join aggregates. */
export const activeTotalSql = sql<number>`coalesce(sum(case when ${listItemsTable.isActive} = 1 then ${listItemsTable.price} * ${listItemsTable.quantity} else 0 end), 0)`
