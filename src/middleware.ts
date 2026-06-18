import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Resolve o protocolo e host públicos (atrás do proxy do Heroku/Cloudflare).
  const fwdProto = req.headers.get("x-forwarded-proto");
  const proto = fwdProto ?? req.nextUrl.protocol.replace(":", "") ?? "https";
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    req.nextUrl.host;

  // Em produção, força HTTPS. Sem isso, o cookie de sessão (secure: true)
  // nunca é enviado e o usuário fica em loop de redirect para /login.
  if (
    process.env.NODE_ENV === "production" &&
    fwdProto &&
    fwdProto !== "https"
  ) {
    const httpsUrl = new URL(
      `https://${host}${pathname}${req.nextUrl.search}`,
    );
    return NextResponse.redirect(httpsUrl, 308);
  }

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

  const hasCookie = req.cookies.has("derci_session");
  if (!hasCookie) {
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
