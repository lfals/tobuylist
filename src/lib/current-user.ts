import { currentUser } from "@clerk/nextjs/server"
import { cache } from "react"

export const getCurrentUser = cache(async () => currentUser())

export async function requireUserId() {
	const user = await getCurrentUser()
	if (!user?.id) {
		throw new Error("Unauthorized")
	}
	return user.id
}
