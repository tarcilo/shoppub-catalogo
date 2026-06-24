import Link from "next/link";
import { getCurrentTenant } from "@/lib/tenant";
import { shouldShowPrice } from "@/lib/tenants";
import {
  getCatalog,
  filterProducts,
  topCategories,
  facets,
  type ProductQuery,
} from "@/lib/feed";
import { ProductCard } from "@/components/ProductCard";
import { SortSelect } from "@/components/SortSelect";

const PAGE_SIZE = 24;

// Faixas de preço pré-definidas (param `preco` = "min-max", aberto à direita com "500-").
const PRICE_RANGES = [
  { value: "0-100", label: "Até R$ 100" },
  { value: "100-300", label: "R$ 100 a R$ 300" },
  { value: "300-500", label: "R$ 300 a R$ 500" },
  { value: "500-", label: "Acima de R$ 500" },
];

function parsePreco(preco?: string): { min?: number; max?: number } {
  if (!preco) return {};
  const [a, b] = preco.split("-");
  const min = a !== "" && a !== undefined ? parseFloat(a) : undefined;
  const max = b !== "" && b !== undefined ? parseFloat(b) : undefined;
  return { min, max };
}

type SearchParams = Promise<{
  busca?: string;
  categoria?: string;
  tamanho?: string;
  cor?: string;
  preco?: string;
  ordenar?: string;
  page?: string;
}>;

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const tenant = await getCurrentTenant();
  const catalog = await getCatalog(tenant);
  const showPrice = shouldShowPrice(tenant);

  const { min: precoMin, max: precoMax } = parsePreco(sp.preco);

  const query: ProductQuery = {
    busca: sp.busca,
    categoria: sp.categoria,
    tamanho: sp.tamanho,
    cor: sp.cor,
    precoMin: showPrice ? precoMin : undefined,
    precoMax: showPrice ? precoMax : undefined,
    ordenar: sp.ordenar as ProductQuery["ordenar"],
  };
  const filtered = filterProducts(catalog.products, query);

  // Facets calculados sobre o recorte de categoria+busca (sem aplicar o próprio
  // facet), para o usuário poder trocar de tamanho/cor sem zerar as opções.
  const facetBase = filterProducts(catalog.products, {
    categoria: sp.categoria,
    busca: sp.busca,
  });
  const { sizes, colors } = facets(facetBase);

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const categories = topCategories(catalog.products);

  // Monta URL preservando filtros. page é sempre resetada ao mexer em filtro.
  const buildUrl = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...sp, page: undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return `/produtos${qs ? `?${qs}` : ""}`;
  };

  // toggle: se já está ativo, remove o filtro
  const toggle = (key: string, value: string, active: boolean) =>
    buildUrl({ [key]: active ? undefined : value });

  const hasActiveFilters =
    !!sp.categoria || !!sp.tamanho || !!sp.cor || !!sp.preco;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar de filtros */}
        <aside className="sm:w-56 shrink-0 space-y-6">
          {/* Categorias */}
          <div>
            <h2 className="text-sm font-semibold mb-2">Categorias</h2>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href={buildUrl({ categoria: undefined })}
                  className={`block py-1 hover:text-primary ${
                    !sp.categoria
                      ? "text-primary font-medium"
                      : "text-foreground/70"
                  }`}
                >
                  Todas
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.name}>
                  <Link
                    href={buildUrl({ categoria: c.full })}
                    className={`block py-1 hover:text-primary ${
                      sp.categoria === c.full
                        ? "text-primary font-medium"
                        : "text-foreground/70"
                    }`}
                  >
                    {c.name}{" "}
                    <span className="text-foreground/40">({c.count})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tamanho */}
          {sizes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-2">Tamanho</h2>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const active = sp.tamanho === s;
                  return (
                    <Link
                      key={s}
                      href={toggle("tamanho", s, active)}
                      className={`min-w-9 text-center px-2.5 py-1 rounded-md border text-sm ${
                        active
                          ? "border-primary text-primary font-medium"
                          : "border-black/15 text-foreground/70 hover:border-primary"
                      }`}
                    >
                      {s}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cor */}
          {colors.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-2">Cor</h2>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => {
                  const active = sp.cor === c;
                  return (
                    <Link
                      key={c}
                      href={toggle("cor", c, active)}
                      className={`px-2.5 py-1 rounded-md border text-sm ${
                        active
                          ? "border-primary text-primary font-medium"
                          : "border-black/15 text-foreground/70 hover:border-primary"
                      }`}
                    >
                      {c}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preço (só quando a loja mostra preço) */}
          {showPrice && (
            <div>
              <h2 className="text-sm font-semibold mb-2">Preço</h2>
              <ul className="space-y-1 text-sm">
                {PRICE_RANGES.map((r) => {
                  const active = sp.preco === r.value;
                  return (
                    <li key={r.value}>
                      <Link
                        href={toggle("preco", r.value, active)}
                        className={`block py-1 hover:text-primary ${
                          active
                            ? "text-primary font-medium"
                            : "text-foreground/70"
                        }`}
                      >
                        {r.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {hasActiveFilters && (
            <Link
              href="/produtos"
              className="inline-block text-sm text-foreground/50 underline hover:text-primary"
            >
              Limpar filtros
            </Link>
          )}
        </aside>

        {/* Resultados */}
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="text-sm text-foreground/60">
              {sp.busca && (
                <span>
                  Resultados para <strong>“{sp.busca}”</strong> ·{" "}
                </span>
              )}
              {filtered.length}{" "}
              {filtered.length === 1 ? "produto" : "produtos"}
            </div>
            <SortSelect />
          </div>

          {pageItems.length === 0 ? (
            <p className="text-foreground/60 py-12 text-center">
              Nenhum produto encontrado.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {pageItems.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  showPrice={showPrice}
                  priority={i === 0}
                />
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 text-sm">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="rounded-md border border-black/15 px-3 py-1.5 hover:border-primary"
                >
                  Anterior
                </Link>
              )}
              <span className="text-foreground/60">
                Página {page} de {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="rounded-md border border-black/15 px-3 py-1.5 hover:border-primary"
                >
                  Próxima
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
