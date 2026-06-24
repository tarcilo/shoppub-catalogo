import { NextResponse } from "next/server";
import { getAuthStore } from "@/lib/stores";
import {
  randomToken,
  hashToken,
  normalizeEmail,
  MAGIC_TTL_MS,
} from "@/lib/auth";
import { sendMagicLink } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = normalizeEmail(String(form.get("email") ?? ""));

  const base = new URL(request.url).origin;
  const redirect = NextResponse.redirect(`${base}/admin?enviado=1`, 303);

  // Anti-enumeração: a resposta é sempre a mesma, exista ou não o e-mail.
  if (email && (await getAuthStore().isAllowed(email))) {
    const token = randomToken();
    await getAuthStore().saveMagicToken(
      await hashToken(token),
      email,
      Date.now() + MAGIC_TTL_MS
    );
    const url = `${base}/admin/verify?token=${token}`;
    try {
      await sendMagicLink(email, url);
    } catch (e) {
      console.error("[admin] falha ao enviar magic link:", e);
    }
  }

  return redirect;
}
