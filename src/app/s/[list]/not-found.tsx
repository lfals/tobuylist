import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"

export default async function SharedListNotFound() {
	const t = await getTranslations("SharedList")

	return (
		<div className="flex flex-col items-start gap-4 py-10">
			<h1 className="text-3xl font-bold">{t("notFoundTitle")}</h1>
			<p className="text-muted-foreground">
				{t("notFoundText")}
			</p>
			<Button asChild>
				<Link href="/">{t("goHome")}</Link>
			</Button>
		</div>
	)
}
