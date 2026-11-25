import { auth, currentUser } from "@clerk/nextjs/server"
import { cache } from "react"

export const getCurrentUser = cache(async () => currentUser())

export async function requireUserId() {
	const user = await getCurrentUser()
	if (!user?.id) {
		throw new Error("Unauthorized")
	}
	return user.id
}

/** Guarda leve (só a sessão, sem buscar o usuário no Clerk) para actions que não tocam em listas mas gastam cota ou fazem requisições de saída. */
export async function requireSignedIn() {
	const { userId } = await auth()
	if (!userId) {
		throw new Error("Unauthorized")
	}
	return userId
}
