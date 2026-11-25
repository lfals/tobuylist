import { NextResponse } from "next/server"

/**
 * Digital Asset Links (Android App Links): permite que links https://<este site>/app/... abram o app Android.
 * Servido em /.well-known/assetlinks.json via rewrite (next.config.ts).
 *
 * ANDROID_CERT_SHA256: fingerprints SHA-256 dos certificados de assinatura do app, separados por vírgula
 * (formato AA:BB:... ou hex contínuo). Inclua o de debug, o de upload e o da assinatura da Play Store.
 */
const PACKAGE_NAME = process.env.ANDROID_APP_PACKAGE || "com.lfals.tobuylist"

function normalizeFingerprint(value: string) {
	const hex = value.replace(/[^0-9a-f]/gi, "").toUpperCase()
	return hex.length === 64 ? hex.match(/.{2}/g)!.join(":") : null
}

export function GET() {
	const fingerprints = (process.env.ANDROID_CERT_SHA256 ?? "")
		.split(",")
		.map(normalizeFingerprint)
		.filter((value): value is string => Boolean(value))

	if (!fingerprints.length) {
		return NextResponse.json({ error: "ANDROID_CERT_SHA256 não configurado" }, { status: 404 })
	}

	return NextResponse.json(
		[
			{
				relation: ["delegate_permission/common.handle_all_urls"],
				target: {
					namespace: "android_app",
					package_name: PACKAGE_NAME,
					sha256_cert_fingerprints: fingerprints,
				},
			},
		],
		{ headers: { "Cache-Control": "public, max-age=3600" } },
	)
}
