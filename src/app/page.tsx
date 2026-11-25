import { LandingJsonLd } from "@/components/landing/json-ld"
import { Landing } from "@/components/landing/landing"
import { siteConfig } from "@/lib/site"
import { GoogleOneTap } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
	title: { absolute: siteConfig.title },
	description: siteConfig.description,
	alternates: { canonical: "/" },
	openGraph: {
		type: "website",
		url: "/",
		siteName: siteConfig.name,
		locale: "pt_BR",
		title: siteConfig.title,
		description: siteConfig.description,
	},
	twitter: {
		card: "summary_large_image",
		title: siteConfig.title,
		description: siteConfig.description,
	},
}

export default async function Home() {
	const { userId } = await auth()

	if (userId) {
		redirect("/app")
	}

	return (
		<>
			<LandingJsonLd />
			<GoogleOneTap />
			<Landing />
		</>
	)
}
