import { NextResponse } from "next/server";
import { getAuthStore } from "@/lib/stores";
import {
  signSession,
  verifyPassword,
  normalizeEmail,
  isSuperAdmin,
  verifySuperAdminPassword,
  SESSION_COOKIE,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = normalizeEmail(String(form.get("email") ?? ""));
  const password = String(form.get("password") ?? "");
  const base = new URL(request.url).origin;

  let ok = false;
  if (email && password) {
    if (isSuperAdmin(email) && verifySuperAdminPassword(password)) {
      ok = true;
    } else {
      const user = await getAuthStore().findUser(email);
      if (user && (await verifyPassword(password, user.passwordHash))) {
        ok = true;
      }
    }
  }

  if (!ok) {
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
