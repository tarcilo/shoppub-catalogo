import type { Catalog } from "./feed";
import type { Tenant } from "./tenants";
import { SEED_TENANTS } from "./tenants";

// Abstração de armazenamento. Em dev usamos memória; em produção (Cloudflare)
// trocamos por D1 (lojas) e KV (catálogo parseado) — ver lib/stores-cf.ts.
// As páginas e o feed só dependem destas interfaces, então a troca é drop-in.

export interface TenantStore {
  getBySlug(slug: string): Promise<Tenant | null>;
  list(): Promise<Tenant[]>;
}

export interface CatalogEntry {
  catalog: Catalog;
  at: number; // epoch ms da última atualização
}

export interface CatalogStore {
  get(slug: string): Promise<CatalogEntry | null>;
  set(slug: string, catalog: Catalog): Promise<void>;
}

// ---------- Implementação em memória (desenvolvimento) ----------

class MemoryTenantStore implements TenantStore {
  private bySlug = new Map(SEED_TENANTS.map((t) => [t.slug, t]));
  async getBySlug(slug: string) {
    return this.bySlug.get(slug) ?? null;
  }
  async list() {
    return [...this.bySlug.values()];
  }
}

class MemoryCatalogStore implements CatalogStore {
  private map = new Map<string, CatalogEntry>();
  async get(slug: string) {
    return this.map.get(slug) ?? null;
  }
  async set(slug: string, catalog: Catalog) {
    this.map.set(slug, { catalog, at: Date.now() });
  }
}

// ---------- Seleção da implementação ----------
// Hoje sempre memória. Quando o runtime Cloudflare estiver ligado, este é o
// único ponto a trocar para as implementações D1/KV (sem mexer no resto).

const tenantStore: TenantStore = new MemoryTenantStore();
const catalogStore: CatalogStore = new MemoryCatalogStore();

export function getTenantStore(): TenantStore {
  return tenantStore;
}

export function getCatalogStore(): CatalogStore {
  return catalogStore;
}
