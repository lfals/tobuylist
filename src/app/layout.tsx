import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { DeferredMetrics } from "@/components/deferred-metrics";
import { clerkLocalizations } from "@/i18n/clerk";
import { siteConfig } from "@/lib/site";

const geistSans = localFont({
	src: "./fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const geistMono = localFont({
	src: "./fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
});

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Meta");

	return {
		metadataBase: new URL(siteConfig.url),
		title: {
			default: siteConfig.name,
			template: `%s | ${siteConfig.name}`,
		},
		description: t("description"),
		applicationName: siteConfig.name,
	};
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const locale = await getLocale();
	// O navegador só recebe as mensagens usadas por componentes de cliente. O texto da landing e do
	// llms.txt é lido no servidor, e a própria landing envia o que precisa (src/app/[locale]/layout.tsx).
	const { Landing, Llms, Meta, ...clientMessages } = await getMessages();

	return (
		<html lang={locale} suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased  bg-gray-100 dark:bg-neutral-950`}
			>
				<NextIntlClientProvider messages={clientMessages}>
					<ClerkProvider localization={clerkLocalizations[locale]}>
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							enableSystem
							disableTransitionOnChange
						>
							{children}
						</ThemeProvider>
						<DeferredMetrics />
					</ClerkProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
