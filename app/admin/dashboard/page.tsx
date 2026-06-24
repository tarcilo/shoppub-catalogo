import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Painel — Catálogo Shoppub" };

export default async function Dashboard() {
  const email = await requireAdmin();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel do Catálogo</h1>
        <form action="/admin/logout" method="POST">
          <button className="text-sm text-black/50 underline hover:text-black">
            Sair
          </button>
        </form>
      </div>
      <p className="mt-1 text-sm text-black/50">Logado como {email}</p>

      <div className="mt-8 rounded-lg border border-black/10 p-6 text-black/60 text-sm">
        Suas lojas aparecerão aqui. (Cadastro e edição de loja — próxima etapa.)
      </div>
    </div>
  );
}
