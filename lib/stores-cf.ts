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
  AdminUser,
  AssetStore,
  StoredAsset,
} from "./stores";

type Bindings = { DB: D1Database; CATALOG_KV: KVNamespace; LOGOS: R2Bucket };

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
  owner_email?: string | null;
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
    ownerEmail: r.owner_email ?? undefined,
  };
}

const COLS =
  "slug, name, feed_url, whatsapp, primary_color, logo_url, show_price, owner_email";
const SELECT = `SELECT ${COLS} FROM lojas WHERE ativo = 1`;

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
  async listByOwner(email: string): Promise<Tenant[]> {
    const { results } = await bindings()
      .DB.prepare(`SELECT ${COLS} FROM lojas WHERE owner_email = ?`)
      .bind(email.toLowerCase())
      .all<LojaRow>();
    return (results ?? []).map(rowToTenant);
  }
  async slugExists(slug: string): Promise<boolean> {
    const row = await bindings()
      .DB.prepare("SELECT 1 FROM lojas WHERE slug = ?")
      .bind(slug)
      .first();
    return !!row;
  }
  async create(t: Tenant): Promise<void> {
    await bindings()
      .DB.prepare(
        `INSERT INTO lojas (slug, name, feed_url, whatsapp, primary_color, logo_url, show_price, owner_email, ativo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
      )
      .bind(
        t.slug,
        t.name,
        t.feedUrl,
        t.whatsapp,
        t.primaryColor,
        t.logo ?? null,
        t.showPrice ? 1 : 0,
        t.ownerEmail ?? null
      )
      .run();
  }
  async update(slug: string, f: Partial<Tenant>): Promise<void> {
    await bindings()
      .DB.prepare(
        `UPDATE lojas SET name = ?, feed_url = ?, whatsapp = ?, primary_color = ?, logo_url = ?, show_price = ?, updated_at = datetime('now')
         WHERE slug = ?`
      )
      .bind(
        f.name ?? "",
        f.feedUrl ?? "",
        f.whatsapp ?? "",
        f.primaryColor ?? "#4a3b2a",
        f.logo ?? null,
        f.showPrice ? 1 : 0,
        slug
      )
      .run();
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

export class R2AssetStore implements AssetStore {
  async put(key: string, body: ArrayBuffer, contentType: string) {
    await bindings().LOGOS.put(key, body, {
      httpMetadata: { contentType },
    });
  }
  async get(key: string): Promise<StoredAsset | null> {
    const obj = await bindings().LOGOS.get(key);
    if (!obj) return null;
    return {
      body: await obj.arrayBuffer(),
      contentType:
        obj.httpMetadata?.contentType ?? "application/octet-stream",
    };
  }
}

export class D1AuthStore implements AuthStore {
  async findUser(email: string): Promise<AdminUser | null> {
    const row = await bindings()
      .DB.prepare(
        "SELECT email, password_hash FROM usuarios WHERE email = ? AND password_hash IS NOT NULL"
      )
      .bind(email.toLowerCase())
      .first<{ email: string; password_hash: string }>();
    return row ? { email: row.email, passwordHash: row.password_hash } : null;
  }
  async createUser(email: string, passwordHash: string): Promise<void> {
    await bindings()
      .DB.prepare(
        `INSERT INTO usuarios (email, password_hash) VALUES (?, ?)
         ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash`
      )
      .bind(email.toLowerCase(), passwordHash)
      .run();
  }
  async listUsers(): Promise<AdminUser[]> {
    const { results } = await bindings()
      .DB.prepare(
        "SELECT email, password_hash FROM usuarios WHERE password_hash IS NOT NULL ORDER BY email"
      )
      .all<{ email: string; password_hash: string }>();
    return (results ?? []).map((r) => ({
      email: r.email,
      passwordHash: r.password_hash,
    }));
  }
  async deleteUser(email: string): Promise<void> {
    await bindings()
      .DB.prepare("DELETE FROM usuarios WHERE email = ?")
      .bind(email.toLowerCase())
      .run();
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
