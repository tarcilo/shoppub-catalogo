import { NextResponse } from "next/server";
import { getAuthStore } from "@/lib/stores";
import { hashToken, signSession, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const base = url.origin;

  const email = token
    ? await getAuthStore().consumeMagicToken(await hashToken(token))
    : null;

  if (!email) {
    return NextResponse.redirect(`${base}/admin?erro=1`, 303);
  }

  const res = NextResponse.redirect(`${base}/admin/dashboard`, 303);
  res.cookies.set(SESSION_COOKIE, await signSession(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
