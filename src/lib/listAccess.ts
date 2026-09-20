export type ListRoute = "owner" | "share-link" | "saved-list"
export type ListRelationship = "owner" | "visitor" | "saved"

export type ListCapabilities = {
	relationship: ListRelationship
	canEditList: boolean
	canShare: boolean
	canSave: boolean
	canAddItem: boolean
	canEditItem: boolean
	canReorder: boolean
}

export function listRelationship({
	isOwner,
	isSaved,
}: {
	isOwner: boolean
	isSaved: boolean
}): ListRelationship {
	if (isOwner) {
		return "owner"
	}
	if (isSaved) {
		return "saved"
	}
	return "visitor"
}

export function routeForRelationship(relationship: ListRelationship): ListRoute {
	if (relationship === "owner") {
		return "owner"
	}
	if (relationship === "saved") {
		return "saved-list"
	}
	return "share-link"
}

export function listRouteFromSearch(share?: string): ListRoute | "invalid" {
	if (!share) {
		return "owner"
	}
	if (share === "true") {
		return "share-link"
	}
	return "invalid"
}

export function listCapabilities({
	relationship,
	isPublic,
}: {
	relationship: ListRelationship
	isPublic: boolean
}): ListCapabilities {
	if (relationship === "owner") {
		return {
			relationship,
			canEditList: true,
			canShare: true,
			canSave: false,
			canAddItem: true,
			canEditItem: true,
			canReorder: true,
		}
	}

	if (relationship === "visitor") {
		return {
			relationship,
			canEditList: false,
			canShare: false,
			canSave: true,
			canAddItem: false,
			canEditItem: false,
			canReorder: false,
		}
	}

	return {
		relationship,
		canEditList: false,
		canShare: false,
		canSave: false,
		canAddItem: isPublic,
		canEditItem: isPublic,
		canReorder: isPublic,
	}
}
