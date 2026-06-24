import type { Metadata } from "next";

export const metadata: Metadata = { title: "Painel — Catálogo Shoppub" };

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string; erro?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-2xl font-bold text-center">Painel do Catálogo</h1>
      <p className="mt-2 text-center text-black/60 text-sm">
        Entre com seu e-mail para receber um link de acesso.
      </p>

      {sp.enviado && (
        <div className="mt-6 rounded-lg bg-green-50 text-green-800 text-sm px-4 py-3 border border-green-200">
          Se o e-mail estiver liberado, enviamos um link de acesso. Confira sua
          caixa de entrada (e o spam).
        </div>
      )}
      {sp.erro && (
        <div className="mt-6 rounded-lg bg-red-50 text-red-800 text-sm px-4 py-3 border border-red-200">
          Link inválido ou expirado. Peça um novo abaixo.
        </div>
      )}

      <form action="/admin/request" method="POST" className="mt-6 space-y-3">
        <input
          type="email"
          name="email"
          required
          placeholder="voce@email.com"
          autoComplete="email"
          className="w-full rounded-lg border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-black/40"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-black text-white font-medium px-4 py-2.5 text-sm hover:opacity-90"
        >
          Enviar link de acesso
        </button>
      </form>
    </div>
  );
}
