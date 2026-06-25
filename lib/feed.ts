import { XMLParser } from "fast-xml-parser";
import type { Tenant } from "./tenants";
import { SAMPLE_FEED } from "./sample-feed";
import { getCatalogStore } from "./stores";

// ---------- Tipos do catálogo normalizado ----------

export type Variation = {
  id: string;
  label: string; // tamanho / valor do atributo principal (ex: "44", "M")
  color: string;
  price: number;
  salePrice: number;
  inStock: boolean;
  gtin: string;
  image: string;
};

export type Product = {
  id: string; // item_group_id (ou id quando não houver grupo)
  title: string;
  description: string;
  link: string;
  images: string[];
  categories: string[]; // árvore do product_type, ex: ["Masculino", "Calçados", "Botas e Botinas"]
  category: string; // product_type completo, usado como chave de filtro
  variations: Variation[];
  priceMin: number;
  priceMax: number;
  salePriceMin: number;
  inStock: boolean;
};

export type Catalog = {
  products: Product[];
  categories: string[]; // categorias distintas (product_type completo)
  updatedAt: string;
  isSample?: boolean; // true quando veio da amostra de dev (feed fora do ar)
};

// ---------- Parsing do feed ----------

type RawEntry = {
  "g:id"?: string | number;
  "g:title"?: string;
  "g:description"?: string;
  "g:link"?: string;
  "g:image_link"?: string;
  "g:additional_image_link"?: string | string[];
  "g:availability"?: string;
  "g:price"?: string;
  "g:sale_price"?: string;
  "g:color"?: string;
  "g:gtin"?: string | number;
  "g:product_type"?: string;
  "g:size"?: string | number;
  "g:item_group_id"?: string | number;
  "c:main_attribute_value"?: string | number;
};

const parser = new XMLParser({
  ignoreAttributes: true,
  processEntities: true,
  trimValues: true,
  isArray: (name) =>
    name === "entry" || name === "g:additional_image_link",
});

// Decodifica entidades numéricas que sobram após o parse (ex: &#x27; em "Sacudido's").
function decodeEntities(input: string): string {
  if (!input) return "";
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();
}

function toNumber(price: string | undefined): number {
  if (!price) return 0;
  // "419.90 BRL" -> 419.90
  const n = parseFloat(String(price).replace(",", ".").split(/\s+/)[0]);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return v === undefined || v === null ? "" : decodeEntities(String(v));
}

// Remove o sufixo de variação do título (ex: "Botina ... - 44" -> "Botina ...").
function baseTitle(title: string, variationLabel: string): string {
  if (!variationLabel) return title;
  const suffix = ` - ${variationLabel}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}

function parseFeed(xml: string): Catalog {
  const data = parser.parse(xml);
  const feed = data?.feed ?? {};
  const entries: RawEntry[] = Array.isArray(feed.entry) ? feed.entry : [];
  const updatedAt = str(feed.updated) || new Date().toISOString();

  // Agrupa entries por item_group_id (cada grupo = 1 produto).
  const groups = new Map<string, RawEntry[]>();
  for (const e of entries) {
    const groupId = str(e["g:item_group_id"]) || str(e["g:id"]);
    if (!groupId) continue;
    const list = groups.get(groupId);
    if (list) list.push(e);
    else groups.set(groupId, [e]);
  }

  const products: Product[] = [];
  const categorySet = new Set<string>();

  for (const [groupId, list] of groups) {
    const first = list[0];

    const variations: Variation[] = list.map((e) => {
      const label = str(e["c:main_attribute_value"]) || str(e["g:size"]);
      return {
        id: str(e["g:id"]),
        label,
        color: str(e["g:color"]),
        price: toNumber(e["g:price"]),
        salePrice: toNumber(e["g:sale_price"]) || toNumber(e["g:price"]),
        inStock: str(e["g:availability"]).toLowerCase() === "in stock",
        gtin: str(e["g:gtin"]),
        image: str(e["g:image_link"]),
      };
    });

    const firstLabel =
      str(first["c:main_attribute_value"]) || str(first["g:size"]);
    const title = baseTitle(str(first["g:title"]), firstLabel);

    const category = str(first["g:product_type"]);
    if (category) categorySet.add(category);
    const categories = category
      .split(">")
      .map((c) => c.trim())
      .filter(Boolean);

    // Imagens: principal + adicionais da primeira variação.
    const additional = Array.isArray(first["g:additional_image_link"])
      ? first["g:additional_image_link"]
      : first["g:additional_image_link"]
        ? [first["g:additional_image_link"]]
        : [];
    const images = [
      str(first["g:image_link"]),
      ...additional.map((i) => str(i)),
    ].filter(Boolean);

    const prices = variations.map((v) => v.price).filter((p) => p > 0);
    const salePrices = variations.map((v) => v.salePrice).filter((p) => p > 0);

    products.push({
      id: groupId,
      title,
      description: str(first["g:description"]).replace(/^\.$/, ""),
      link: str(first["g:link"]),
      images,
      categories,
      category,
      variations,
      priceMin: prices.length ? Math.min(...prices) : 0,
      priceMax: prices.length ? Math.max(...prices) : 0,
      salePriceMin: salePrices.length ? Math.min(...salePrices) : 0,
      inStock: variations.some((v) => v.inStock),
    });
  }

  return {
    products,
    categories: Array.from(categorySet).sort((a, b) => a.localeCompare(b)),
    updatedAt,
  };
}

// ---------- Catálogo: store + TTL ----------
// O catálogo parseado vive no CatalogStore (memória em dev, KV em produção).
// O refresh "oficial" é 1x ao dia de madrugada (cron). O TTL é rede de
// segurança caso o cron falhe.

const TTL_MS = 24 * 60 * 60 * 1000;
const inflight = new Map<string, Promise<Catalog>>();

async function fetchAndParse(feedUrl: string): Promise<Catalog> {
  try {
    const res = await fetch(feedUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Feed retornou ${res.status}`);
    const xml = await res.text();
    return parseFeed(xml);
  } catch (err) {
    // Em desenvolvimento, se a origem cair, usa a amostra local para não travar.
    // Em produção o erro propaga (vira a tela "catálogo indisponível").
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[feed] origem indisponível (${feedUrl}); usando amostra local de desenvolvimento.`
      );
      return { ...parseFeed(SAMPLE_FEED), isSample: true };
    }
    throw err;
  }
}

export async function getCatalog(tenant: Tenant): Promise<Catalog> {
  const store = getCatalogStore();
  const hit = await store.get(tenant.slug);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.catalog;

  // dedupe de requisições simultâneas para a mesma loja
  const existing = inflight.get(tenant.slug);
  if (existing) return existing;

  const promise = fetchAndParse(tenant.feedUrl)
    .then(async (data) => {
      await store.set(tenant.slug, data);
      return data;
    })
    .catch((err) => {
      // Degradação graciosa: se o feed cair, servimos o último catálogo
      // conhecido (mesmo expirado). Só propaga o erro se nunca tivemos dados.
      if (hit) {
        console.error(
          `[feed] falha ao atualizar ${tenant.slug}, servindo catálogo antigo:`,
          err
        );
        return hit.catalog;
      }
      throw err;
    })
    .finally(() => inflight.delete(tenant.slug));

  inflight.set(tenant.slug, promise);
  return promise;
}

// Força a releitura do feed e atualiza o store (usado pelo sync de madrugada).
export async function refreshCatalog(tenant: Tenant): Promise<Catalog> {
  const data = await fetchAndParse(tenant.feedUrl);
  await getCatalogStore().set(tenant.slug, data);
  return data;
}

// ---------- Consultas ----------

export async function getProduct(
  tenant: Tenant,
  id: string
): Promise<Product | undefined> {
  const { products } = await getCatalog(tenant);
  return products.find((p) => p.id === id);
}

export type ProductQuery = {
  busca?: string;
  categoria?: string;
  tamanho?: string;
  cor?: string;
  precoMin?: number;
  precoMax?: number;
  ordenar?: "relevancia" | "menor-preco" | "maior-preco" | "nome";
};

export function filterProducts(
  products: Product[],
  q: ProductQuery
): Product[] {
  let out = products;

  if (q.categoria) {
    // filtra pela categoria de topo (1º nível do product_type), batendo com a
    // contagem da barra lateral. Aceita também o product_type completo (compat).
    out = out.filter(
      (p) => (p.categories[0] ?? p.category) === q.categoria || p.category === q.categoria
    );
  }

  if (q.tamanho) {
    const t = q.tamanho.toLowerCase();
    out = out.filter((p) =>
      p.variations.some((v) => v.label.toLowerCase() === t)
    );
  }

  if (q.cor) {
    const c = q.cor.toLowerCase();
    out = out.filter((p) =>
      p.variations.some((v) => v.color.toLowerCase() === c)
    );
  }

  if (q.precoMin !== undefined) {
    out = out.filter((p) => p.salePriceMin >= q.precoMin!);
  }
  if (q.precoMax !== undefined) {
    out = out.filter((p) => p.salePriceMin <= q.precoMax!);
  }

  if (q.busca) {
    const term = q.busca.toLowerCase().trim();
    out = out.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }

  const sorted = [...out];
  switch (q.ordenar) {
    case "menor-preco":
      sorted.sort((a, b) => a.salePriceMin - b.salePriceMin);
      break;
    case "maior-preco":
      sorted.sort((a, b) => b.salePriceMin - a.salePriceMin);
      break;
    case "nome":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }
  return sorted;
}

// Facets (tamanhos e cores disponíveis) a partir de um conjunto de produtos.
export function facets(products: Product[]): {
  sizes: string[];
  colors: string[];
} {
  const sizeSet = new Set<string>();
  const colorSet = new Set<string>();
  for (const p of products) {
    for (const v of p.variations) {
      if (v.label) sizeSet.add(v.label);
      if (v.color) colorSet.add(v.color);
    }
  }
  const sizes = Array.from(sizeSet).sort((a, b) => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b);
  });
  const colors = Array.from(colorSet).sort((a, b) => a.localeCompare(b));
  return { sizes, colors };
}

// Categorias de topo (primeiro nível do product_type) com contagem.
export function topCategories(
  products: Product[]
): { name: string; full: string; count: number }[] {
  const map = new Map<string, { full: string; count: number }>();
  for (const p of products) {
    if (!p.category) continue;
    const top = p.categories[0] ?? p.category;
    const cur = map.get(top);
    if (cur) cur.count++;
    else map.set(top, { full: p.category, count: 1 });
  }
  return Array.from(map.entries())
    .map(([name, v]) => ({ name, full: v.full, count: v.count }))
    .sort((a, b) => b.count - a.count);
}
