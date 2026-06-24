import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-session";
import { isSuperAdmin } from "@/lib/auth";
import { getTenantStore } from "@/lib/stores";

export const metadata: Metadata = { title: "Painel — Catálogo Shoppub" };

export default async function Dashboard() {
  const email = await requireAdmin();
  const lojas = await getTenantStore().listByOwner(email);
  const superAdmin = isSuperAdmin(email);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Minhas lojas</h1>
        <form action="/admin/logout" method="POST">
          <button className="text-sm text-black/50 underline hover:text-black">
            Sair
          </button>
        </form>
      </div>
      <p className="mt-1 text-sm text-black/50">Logado como {email}</p>

      <div className="mt-8 space-y-3">
        {lojas.length === 0 && (
          <p className="text-black/60 text-sm">
            Você ainda não tem lojas. Crie a primeira abaixo.
          </p>
        )}
        {lojas.map((l) => (
          <div
            key={l.slug}
            className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3"
          >
            <div>
              <div className="font-medium">{l.name}</div>
              <a
                href={`/${l.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-black/50 hover:underline"
              >
                catalogo.shoppub.io/{l.slug} ↗
              </a>
            </div>
            <Link
              href={`/admin/loja/${l.slug}`}
              className="text-sm font-medium text-black/70 hover:text-black"
            >
              Editar
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <Link
          href="/admin/loja/new"
          className="inline-block rounded-lg bg-black text-white font-medium px-5 py-2.5 text-sm hover:opacity-90"
        >
          + Nova loja
        </Link>
        {superAdmin && (
          <Link
            href="/admin/usuarios"
            className="text-sm font-medium text-black/60 hover:text-black"
          >
            Gerenciar usuários
          </Link>
        )}
      </div>
    </div>
  );
}
