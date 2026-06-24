import Link from "next/link";
import { requireTenant } from "@/lib/tenant";
import { shouldShowPrice } from "@/lib/tenants";
import { getCatalog, topCategories } from "@/lib/feed";
import { ProductCard } from "@/components/ProductCard";

export default async function LojaHome({
  params,
}: {
  params: Promise<{ loja: string }>;
}) {
  const { loja } = await params;
  const tenant = await requireTenant(loja);
  const catalog = await getCatalog(tenant);
  const showPrice = shouldShowPrice(tenant);
  const categories = topCategories(catalog.products).slice(0, 8);
  const destaques = catalog.products.filter((p) => p.inStock).slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="py-10 sm:py-14 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Catálogo {tenant.name}
        </h1>
        <p className="mt-3 text-foreground/60 max-w-xl mx-auto">
          Confira nossos produtos. Gostou de algo? Fale com a gente no WhatsApp.
        </p>
        <Link
          href={`/${loja}/produtos`}
          className="inline-block mt-5 rounded-full bg-primary text-white px-6 py-2.5 text-sm font-medium hover:opacity-90"
        >
          Ver todos os produtos
        </Link>
      </section>

      {/* Categorias */}
      {categories.length > 0 && (
        <section className="py-4">
          <h2 className="text-lg font-semibold mb-3">Categorias</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={`/${loja}/produtos?categoria=${encodeURIComponent(c.full)}`}
                className="rounded-lg border border-black/10 px-4 py-3 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
              >
                {c.name}
                <span className="block text-xs text-foreground/40 font-normal">
                  {c.count} {c.count === 1 ? "produto" : "produtos"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Destaques */}
      <section className="py-8">
        <h2 className="text-lg font-semibold mb-3">Destaques</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {destaques.map((p, i) => (
            <ProductCard
              key={p.id}
              loja={loja}
              product={p}
              showPrice={showPrice}
              priority={i === 0}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
