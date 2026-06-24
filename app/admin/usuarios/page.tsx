import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin-session";
import { getAuthStore } from "@/lib/stores";
import { hashPassword, normalizeEmail } from "@/lib/auth";

export const metadata: Metadata = { title: "Usuários — Catálogo Shoppub" };

async function addUser(formData: FormData) {
  "use server";
  await requireSuperAdmin();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    redirect(`/admin/usuarios?erro=${encodeURIComponent("E-mail inválido.")}`);
  }
  if (password.length < 6) {
    redirect(
      `/admin/usuarios?erro=${encodeURIComponent("A senha precisa ter ao menos 6 caracteres.")}`
    );
  }

  await getAuthStore().createUser(email, await hashPassword(password));
  redirect("/admin/usuarios?ok=1");
}

async function removeUser(formData: FormData) {
  "use server";
  await requireSuperAdmin();
  const email = String(formData.get("email") ?? "");
  await getAuthStore().deleteUser(email);
  redirect("/admin/usuarios");
}

export default async function Usuarios({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const users = await getAuthStore().listUsers();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/admin/dashboard" className="text-sm text-black/50 hover:text-black">
        ← Voltar
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Usuários (lojistas)</h1>
      <p className="mt-1 text-sm text-black/50">
        Cadastre o e-mail e a senha de cada lojista que pode entrar no painel.
      </p>

      {sp.ok && (
        <div className="mt-5 rounded-lg bg-green-50 text-green-800 text-sm px-4 py-3 border border-green-200">
          Usuário salvo.
        </div>
      )}
      {sp.erro && (
        <div className="mt-5 rounded-lg bg-red-50 text-red-800 text-sm px-4 py-3 border border-red-200">
          {sp.erro}
        </div>
      )}

      {/* Cadastro */}
      <form
        action={addUser}
        className="mt-6 flex flex-col sm:flex-row gap-2 items-stretch"
      >
        <input
          name="email"
          type="email"
          required
          placeholder="lojista@cliente.com"
          className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40"
        />
        <input
          name="password"
          type="text"
          required
          placeholder="senha (mín. 6)"
          className="sm:w-44 rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40"
        />
        <button className="rounded-lg bg-black text-white font-medium px-4 py-2 text-sm hover:opacity-90">
          Adicionar
        </button>
      </form>
      <p className="mt-1 text-xs text-black/40">
        Você define a senha e passa pro lojista. Cadastrar de novo o mesmo
        e-mail troca a senha.
      </p>

      {/* Lista */}
      <div className="mt-8 space-y-2">
        {users.length === 0 && (
          <p className="text-sm text-black/50">Nenhum lojista cadastrado ainda.</p>
        )}
        {users.map((u) => (
          <div
            key={u.email}
            className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-2.5"
          >
            <span className="text-sm">{u.email}</span>
            <form action={removeUser}>
              <input type="hidden" name="email" value={u.email} />
              <button className="text-sm text-red-600/80 hover:text-red-600">
                Remover
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
