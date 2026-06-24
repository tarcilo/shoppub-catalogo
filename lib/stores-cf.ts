// Implementação Cloudflare (D1 + KV) do TenantStore/CatalogStore.
// Selecionada automaticamente em lib/stores.ts quando há bindings (runtime
// Worker). Em `next dev` não há bindings, então cai para as versões em memória.
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Catalog } from "./feed";
import type { Tenant } from "./tenants";
import type {
  TenantStore,
  CatalogStore,
  CatalogEntry,
  AuthStore,
} from "./stores";

type Bindings = { DB: D1Database; CATALOG_KV: KVNamespace };

function bindings(): Bindings {
  return getCloudflareContext().env as unknown as Bindings;
}

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
    const row = await bindings()
      .DB.prepare(`${SELECT} AND slug = ?`)
      .bind(slug)
      .first<LojaRow>();
    return row ? rowToTenant(row) : null;
  }
  async list(): Promise<Tenant[]> {
    const { results } = await bindings().DB.prepare(SELECT).all<LojaRow>();
    return (results ?? []).map(rowToTenant);
  }
}

export class KVCatalogStore implements CatalogStore {
  async get(slug: string): Promise<CatalogEntry | null> {
    return bindings().CATALOG_KV.get<CatalogEntry>(`catalog:${slug}`, "json");
  }
  async set(slug: string, catalog: Catalog): Promise<void> {
    const entry: CatalogEntry = { catalog, at: Date.now() };
    await bindings().CATALOG_KV.put(`catalog:${slug}`, JSON.stringify(entry));
  }
}

export class D1AuthStore implements AuthStore {
  async isAllowed(email: string): Promise<boolean> {
    const row = await bindings()
      .DB.prepare("SELECT 1 FROM allowed_emails WHERE email = ?")
      .bind(email.toLowerCase())
      .first();
    return !!row;
  }
  async saveMagicToken(hash: string, email: string, expiresAt: number) {
    await bindings()
      .DB.prepare(
        "INSERT INTO magic_tokens (token_hash, email, expires_at) VALUES (?, ?, ?)"
      )
      .bind(hash, email, new Date(expiresAt).toISOString())
      .run();
  }
  async consumeMagicToken(hash: string): Promise<string | null> {
    const db = bindings().DB;
    const row = await db
      .prepare(
        "SELECT email, expires_at, used FROM magic_tokens WHERE token_hash = ?"
      )
      .bind(hash)
      .first<{ email: string; expires_at: string; used: number }>();
    if (!row || row.used === 1) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) return null;
    await db
      .prepare("UPDATE magic_tokens SET used = 1 WHERE token_hash = ?")
      .bind(hash)
      .run();
    return row.email;
  }
}

// True quando rodando no Worker (bindings disponíveis); false em next dev.
export function hasCloudflareBindings(): boolean {
  try {
    const env = getCloudflareContext().env as unknown as Partial<Bindings>;
    return !!env?.DB && !!env?.CATALOG_KV;
  } catch {
    return false;
  }
}
