import { describe, expect, it } from "vitest"
import { listCapabilities, listRouteFromSearch } from "./listAccess"

describe("listRouteFromSearch", () => {
	it("treats a missing share param as the owner route", () => {
		expect(listRouteFromSearch(undefined)).toBe("owner")
	})

	it("treats share=true as the share-link route", () => {
		expect(listRouteFromSearch("true")).toBe("share-link")
	})

	it("rejects any other share value", () => {
		expect(listRouteFromSearch("1")).toBe("invalid")
	})
})

describe("listCapabilities", () => {
	it("gives the list owner full item and list actions even on a share link", () => {
		expect(listCapabilities({ route: "share-link", isOwner: true, isPublic: false })).toMatchObject({
			mode: "owner",
			canEditList: true,
			canShare: true,
			canAddItem: true,
			canEditItem: true,
			canReorder: true,
			canSave: false,
		})
	})

	it("lets a visitor save a share link and never edit in place", () => {
		expect(listCapabilities({ route: "share-link", isOwner: false, isPublic: true })).toMatchObject({
			mode: "visitor",
			canSave: true,
			canAddItem: false,
			canEditItem: false,
			canReorder: false,
		})
	})

	it("lets a saved-list viewer change items only when the list is public", () => {
		expect(listCapabilities({ route: "saved-list", isOwner: false, isPublic: true })).toMatchObject({
			mode: "saved",
			canAddItem: true,
			canEditItem: true,
			canReorder: true,
		})
		expect(listCapabilities({ route: "saved-list", isOwner: false, isPublic: false })).toMatchObject({
			canAddItem: false,
			canEditItem: false,
			canReorder: false,
		})
	})
})
