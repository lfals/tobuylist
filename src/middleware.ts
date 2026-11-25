import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Landing e arquivos que buscadores e assistentes de IA precisam ler sem login.
const isPublicRoute = createRouteMatcher([
    "/",
    "/api/mobile(.*)",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
    "/opengraph-image(.*)",
]);

// As rotas /api/mobile autenticam via Bearer token do Clerk dentro do próprio handler e respondem 401 em JSON.
export default clerkMiddleware(async (auth, request) => {
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
