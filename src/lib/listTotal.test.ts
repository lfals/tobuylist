import { describe, expect, it } from "vitest"
import { totalCents } from "./listTotal"

describe("totalCents", () => {
	it("sums only active items as cents times quantity", () => {
		expect(
			totalCents([
				{ price: 100, quantity: 2, isActive: 1 },
				{ price: 500, quantity: 1, isActive: 0 },
				{ price: 50, quantity: 3, isActive: 1 },
			]),
		).toBe(350)
	})

	it("is zero when every item is inactive", () => {
		expect(totalCents([{ price: 100, quantity: 2, isActive: 0 }])).toBe(0)
	})
})
