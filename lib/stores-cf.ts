// ============================================================================
// Implementação Cloudflare (D1 + KV) do TenantStore/CatalogStore.
//
// ATIVAR NO DEPLOY — este arquivo é referência e fica FORA do build atual
// (excluído no tsconfig.json) porque depende de pacotes que só instalamos na
// etapa de deploy. Para ligar:
//
//   1. npm i @opennextjs/cloudflare && npm i -D wrangler @cloudflare/workers-types
//   2. Criar D1 e KV (ver wrangler.jsonc) e preencher os ids.
//   3. npx wrangler types   (gera os tipos das bindings DB / CATALOG_KV)
//   4. Remover este arquivo do "exclude" no tsconfig.json.
//   5. Em lib/stores.ts, selecionar estas implementações quando houver bindings.
// ============================================================================
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Catalog } from "./feed";
import type { Tenant } from "./tenants";
import type { TenantStore, CatalogStore, CatalogEntry } from "./stores";

type LojaRow = {
  slug: string;
  name: string;
  feed_url: string;
  whatsapp: string;
  primary_color: string;
  logo_url: string | null;
  show_price: number;
};

function rowToTenant(r: LojaRow): Tenant {
  return {
    slug: r.slug,
    name: r.name,
    feedUrl: r.feed_url,
    whatsapp: r.whatsapp,
    primaryColor: r.primary_color,
    logo: r.logo_url ?? undefined,
    showPrice: r.show_price === 1,
  };
}

const SELECT =
  "SELECT slug, name, feed_url, whatsapp, primary_color, logo_url, show_price FROM lojas WHERE ativo = 1";

export class D1TenantStore implements TenantStore {
  async getBySlug(slug: string): Promise<Tenant | null> {
    const { env } = getCloudflareContext();
    const row = await env.DB.prepare(`${SELECT} AND slug = ?`)
      .bind(slug)
      .first<LojaRow>();
    return row ? rowToTenant(row) : null;
  }
  async list(): Promise<Tenant[]> {
    const { env } = getCloudflareContext();
    const { results } = await env.DB.prepare(SELECT).all<LojaRow>();
    return (results ?? []).map(rowToTenant);
  }
}

export class KVCatalogStore implements CatalogStore {
  async get(slug: string): Promise<CatalogEntry | null> {
    const { env } = getCloudflareContext();
    return env.CATALOG_KV.get(`catalog:${slug}`, "json") as Promise<CatalogEntry | null>;
  }
  async set(slug: string, catalog: Catalog): Promise<void> {
    const { env } = getCloudflareContext();
    const entry: CatalogEntry = { catalog, at: Date.now() };
    await env.CATALOG_KV.put(`catalog:${slug}`, JSON.stringify(entry));
  }
}
