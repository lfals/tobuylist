import Items from "@/components/lists/items"
import { ListItemsSkeleton } from "@/components/lists/list-skeletons"
import SharedHeader from "@/components/lists/shared/shared-header"
import { Button } from "@/components/ui/button"
import { formatViewNumber } from "@/lib/format-number"
import { getListAccess } from "@/services/list-access"
import { getSharedListItems, getSharedListSummary } from "@/services/lists-queries"
import { SaveList } from "@/components/lists/saveList"
import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { Suspense } from "react"

type Props = { params: Promise<{ list: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { list } = await params
	const summary = await getSharedListSummary(list)

	// Lista compartilhada não deve aparecer em buscadores; o preview de link (WhatsApp, Slack...) continua funcionando.
	const robots = { index: false, follow: false }
	if (!summary) {
		return { title: "Lista não encontrada", robots }
	}

	const total = formatViewNumber(summary.totalValue.toString())
	const title = `${summary.name} · ${total}`
	const description = summary.description
		? `${summary.description}. Lista compartilhada no To Buy List.`
		: "Lista compartilhada no To Buy List. Abra o link para ver os itens e o total."

	return {
		title,
		description,
		robots,
		openGraph: { title, description, type: "website", locale: "pt_BR" },
		twitter: { card: "summary_large_image", title, description },
	}
}

function GuestNotice({ editable, returnTo }: { editable: boolean; returnTo: string }) {
	return (
		<div className="flex flex-col gap-3 rounded-md border bg-white p-4 dark:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between">
			<p className="text-sm">
				{editable
					? "O dono liberou esta lista para edição. Entre na sua conta para adicionar e alterar itens."
					: "Você está vendo uma lista compartilhada. Entre na sua conta para salvar uma cópia nas suas listas."}
			</p>
			<div className="flex shrink-0 gap-2">
				<SignInButton mode="modal" forceRedirectUrl={returnTo} signUpForceRedirectUrl={returnTo}>
					<Button variant="outline">Entrar</Button>
				</SignInButton>
				<SignUpButton mode="modal" forceRedirectUrl={returnTo} signInForceRedirectUrl={returnTo}>
					<Button>Criar conta</Button>
				</SignUpButton>
			</div>
		</div>
	)
}

async function SharedListItems({ listId, canEdit }: { listId: string; canEdit: boolean }) {
	const items = await getSharedListItems(listId)
	if (!items) {
		notFound()
	}

	return <Items items={items} listId={listId} canEdit={canEdit} />
}

export default async function SharedListPage({ params }: Props) {
	const { list: listId } = await params
	const { userId } = await auth()

	if (userId) {
		// Dono e quem já salvou a lista usam a versão completa dentro do app.
		const access = await getListAccess(listId, userId)
		if (access === "owner") {
			redirect(`/app/${listId}`)
		}
		if (access === "saved") {
			redirect(`/app/${listId}/shared`)
		}
	}

	// Resolvido antes do streaming para que lista inexistente responda 404 de verdade.
	void getSharedListItems(listId)
	const summary = await getSharedListSummary(listId)
	if (!summary) {
		notFound()
	}

	const signedIn = Boolean(userId)
	const editable = Boolean(summary.public)
	const canEdit = signedIn && editable

	return (
		<div className="flex flex-col gap-10">
			<div className="flex flex-col gap-4">
				{signedIn ? null : <GuestNotice editable={editable} returnTo={`/s/${listId}`} />}
				<SharedHeader
					list={summary}
					canAdd={canEdit}
					actions={signedIn ? <SaveList listId={listId} /> : null}
				/>
			</div>
			<div className="flex flex-col gap-4">
				<Suspense fallback={<ListItemsSkeleton />}>
					<SharedListItems listId={listId} canEdit={canEdit} />
				</Suspense>
			</div>
		</div>
	)
}
