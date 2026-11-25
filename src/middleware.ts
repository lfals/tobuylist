import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Landing e arquivos que buscadores e assistentes de IA precisam ler sem login.
// /s/[id] é a lista compartilhada: qualquer pessoa com o link pode ver; editar exige login (checado nas server actions).
const isPublicRoute = createRouteMatcher([
    "/",
    "/s/(.*)",
    "/api/mobile(.*)",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
    "/opengraph-image(.*)",
]);

// Links de compartilhamento antigos: /app/[id]?share=true
const legacyShareLink = /^\/app\/([^/]+)\/?$/;

// As rotas /api/mobile autenticam via Bearer token do Clerk dentro do próprio handler e respondem 401 em JSON.
export default clerkMiddleware(async (auth, request) => {
    const legacy = legacyShareLink.exec(request.nextUrl.pathname);
    if (legacy && request.nextUrl.searchParams.get("share") === "true") {
        return NextResponse.redirect(new URL(`/s/${legacy[1]}`, request.url));
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
