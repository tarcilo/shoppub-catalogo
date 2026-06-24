import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, isSuperAdmin, SESSION_COOKIE } from "./auth";

// E-mail do admin logado, ou null.
export async function getAdminEmail(): Promise<string | null> {
  const c = await cookies();
  return verifySession(c.get(SESSION_COOKIE)?.value);
}

// Exige login: redireciona para /admin se não houver sessão válida.
export async function requireAdmin(): Promise<string> {
  const email = await getAdminEmail();
  if (!email) redirect("/admin");
  return email;
}

// Exige super admin (gerencia usuários).
export async function requireSuperAdmin(): Promise<string> {
  const email = await requireAdmin();
  if (!isSuperAdmin(email)) redirect("/admin/dashboard");
  return email;
}
