import { describe, expect, it } from "vitest"
import { centsFromInput, centsFromScraped, formatDisplay, formatInput } from "./money"

describe("centsFromInput", () => {
	it("reads a formatted BRL field as cents", () => {
		expect(centsFromInput("R$ 1,23")).toBe(123)
	})

	it("treats a digit-only field as cents", () => {
		expect(centsFromInput("1050")).toBe(1050)
	})

	it("returns 0 when there are no digits", () => {
		expect(centsFromInput("R$")).toBe(0)
	})
})

describe("centsFromScraped", () => {
	it("reads a reais number as cents", () => {
		expect(centsFromScraped(10.5)).toBe(1050)
	})

	it("reads Brazilian grouped reais as cents", () => {
		expect(centsFromScraped("R$ 1.234,56")).toBe(123456)
	})

	it("rejects empty scraped values", () => {
		expect(centsFromScraped(null)).toBeUndefined()
		expect(centsFromScraped("")).toBeUndefined()
	})
})

describe("formatInput", () => {
	it("formats cents for an item field", () => {
		expect(formatInput(123)).toBe("R$ 1,23")
	})

	it("formats zero cents", () => {
		expect(formatInput(0)).toBe("R$ 0,00")
	})
})

describe("formatDisplay", () => {
	it("keeps ordinary totals in full BRL", () => {
		expect(formatDisplay(12345)).toBe("R$ 123,45")
	})

	it("compacts totals above 100 thousand reais", () => {
		expect(formatDisplay(15_000_000)).toBe("R$ 150.00 mil")
	})

	it("compacts totals above 1 million reais", () => {
		expect(formatDisplay(200_000_000)).toBe("R$ 2.00 mi")
	})
})
