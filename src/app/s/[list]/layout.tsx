import { LocaleSwitcher } from "@/components/locale-switcher"
import { ModeToggle } from "@/components/themetoggle"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { ListChecksIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"
import NextLink from "next/link"

export default async function SharedListLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ list: string }>
}) {
	const { list } = await params
	const t = await getTranslations("Common")
	const tShared = await getTranslations("SharedList")
	const returnTo = `/s/${list}`

	return (
		<div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4">
			<header className="flex items-center justify-between gap-2 p-4 md:px-10">
				<Link href="/" className="flex items-center gap-2 font-semibold">
					<ListChecksIcon size={20} />
					To Buy List
				</Link>
				<div className="flex items-center gap-2">
					<LocaleSwitcher />
					<ModeToggle />
					<SignedOut>
						<SignInButton mode="modal" forceRedirectUrl={returnTo} signUpForceRedirectUrl={returnTo}>
							<Button variant="ghost">{t("signIn")}</Button>
						</SignInButton>
						<SignUpButton mode="modal" forceRedirectUrl={returnTo} signInForceRedirectUrl={returnTo}>
							<Button>{t("signUp")}</Button>
						</SignUpButton>
					</SignedOut>
					<SignedIn>
						<Button asChild variant="ghost">
							<NextLink href="/app">{tShared("myLists")}</NextLink>
						</Button>
						<UserButton />
					</SignedIn>
				</div>
			</header>
			<main className="p-4 md:p-10 md:pt-4">{children}</main>
		</div>
	)
}
