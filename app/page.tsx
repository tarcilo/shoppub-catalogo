import Link from "next/link";
import { getTenantStore } from "@/lib/stores";

// Landing de catalogo.shoppub.io. Em dev lista as lojas do seed para facilitar
// a navegação; em produção é institucional (não expõe a lista de lojas).
export default async function Landing() {
  const lojas =
    process.env.NODE_ENV !== "production"
      ? await getTenantStore().list()
      : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Catálogo Shoppub</h1>
      <p className="mt-3 text-foreground/60">
        Catálogos online das lojas Shoppub. Cada loja tem o seu endereço em{" "}
        <code className="text-foreground/80">catalogo.shoppub.io/sua-loja</code>.
      </p>

      {lojas.length > 0 && (
        <div className="mt-10 text-left">
          <h2 className="text-sm font-semibold text-foreground/50 mb-2">
            Lojas (dev)
          </h2>
          <ul className="divide-y divide-black/10 border border-black/10 rounded-lg">
            {lojas.map((l) => (
              <li key={l.slug}>
                <Link
                  href={`/${l.slug}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-black/[0.02]"
                >
                  <span className="font-medium">{l.name}</span>
                  <span className="text-sm text-foreground/40">/{l.slug}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
