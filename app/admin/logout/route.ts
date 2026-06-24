import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const base = new URL(request.url).origin;
  const res = NextResponse.redirect(`${base}/admin`, 303);
  res.cookies.set(SESSION_COOKIE, "", { path: "/admin", maxAge: 0 });
  return res;
}
