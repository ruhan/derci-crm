import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST(req: Request) {
  await destroySession();
  const headers = req.headers;
  const proto = headers.get("x-forwarded-proto") ?? "https";
  const host =
    headers.get("x-forwarded-host") ??
    headers.get("host") ??
    new URL(req.url).host;
  const url = `${proto}://${host}/login`;
  return NextResponse.redirect(url, { status: 303 });
}
