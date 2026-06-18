import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Apenas verifica presença do cookie. A validação real do JWT
  // acontece em `requireUser()` no server (não usar verify aqui pois
  // o middleware roda no edge e a chave fica em variável).
  const hasCookie = req.cookies.has("derci_session");
  if (!hasCookie) {
    // Reconstrói a URL pública usando os headers de proxy (Heroku, Cloudflare),
    // senão `req.nextUrl` pode trazer o host interno (`localhost:PORT`) na hora
    // do redirect, causando "Location: http://localhost:..." no navegador.
    const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "") ?? "https";
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
    const target = new URL(`${proto}://${host}/login`);
    target.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(target);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|public).*)",
  ],
};
