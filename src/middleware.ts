import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const handleI18nRouting = createIntlMiddleware(routing);

// Rotas em que o idioma vem da URL: landing (/ e /en) e llms.txt, que existe em cada idioma.
// O resto do app (/app, /s/[id]) não tem prefixo; o idioma dele vem do cookie (src/i18n/request.ts).
const isI18nRoute = createRouteMatcher([
    "/",
    "/llms.txt",
    ...routing.locales.flatMap((locale) => [`/${locale}`, `/${locale}/(.*)`]),
]);

// Arquivos que buscadores e assistentes de IA precisam ler sem login.
// /s/[id] é a lista compartilhada: qualquer pessoa com o link pode ver; editar exige login (checado nas server actions).
const isPublicRoute = createRouteMatcher([
    "/s/(.*)",
    "/api/mobile(.*)",
    // Cron: autenticado por CRON_SECRET dentro do handler.
    "/api/cron(.*)",
    "/.well-known(.*)",
    "/robots.txt",
    "/sitemap.xml",
    "/og/(.*)",
]);

// Links de compartilhamento antigos: /app/[id]?share=true
const legacyShareLink = /^\/app\/([^/]+)\/?$/;

// As rotas /api/mobile autenticam via Bearer token do Clerk dentro do próprio handler e respondem 401 em JSON.
export default clerkMiddleware(async (auth, request) => {
    const legacy = legacyShareLink.exec(request.nextUrl.pathname);
    if (legacy && request.nextUrl.searchParams.get("share") === "true") {
        return NextResponse.redirect(new URL(`/s/${legacy[1]}`, request.url));
    }

    if (isI18nRoute(request)) {
        return handleI18nRouting(request);
    }

    if (!isPublicRoute(request)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
