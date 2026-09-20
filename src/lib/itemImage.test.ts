import { describe, expect, it } from "vitest"
import { isUsableItemImage } from "./itemImage"

describe("isUsableItemImage", () => {
	it("accepts a raster https image", () => {
		expect(isUsableItemImage("https://img.example.com/lamp.jpg")).toBe(true)
	})

	it("rejects svg that Next/Image cannot render", () => {
		expect(
			isUsableItemImage(
				"https://upload.wikimedia.org/wikipedia/commons/9/91/lamp.svg?utm_source=en.wikipedia.org",
			),
		).toBe(false)
	})

	it("rejects non-https links", () => {
		expect(isUsableItemImage("http://img.example.com/lamp.jpg")).toBe(false)
	})
})
