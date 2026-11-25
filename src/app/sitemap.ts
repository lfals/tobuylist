import { siteConfig } from "@/lib/site"
import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: siteConfig.url,
			changeFrequency: "monthly",
			priority: 1,
		},
	]
}
