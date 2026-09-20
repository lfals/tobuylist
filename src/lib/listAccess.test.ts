import { describe, expect, it } from "vitest"
import { listCapabilities, listRelationship, listRouteFromSearch, routeForRelationship } from "./listAccess"

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

describe("listRelationship", () => {
	it("prefers owner over a saved-list bookmark", () => {
		expect(listRelationship({ isOwner: true, isSaved: true })).toBe("owner")
	})

	it("treats a bookmark without ownership as saved", () => {
		expect(listRelationship({ isOwner: false, isSaved: true })).toBe("saved")
	})

	it("treats everyone else as a visitor", () => {
		expect(listRelationship({ isOwner: false, isSaved: false })).toBe("visitor")
	})
})

describe("routeForRelationship", () => {
	it("maps a visitor to the share-link route", () => {
		expect(routeForRelationship("visitor")).toBe("share-link")
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
