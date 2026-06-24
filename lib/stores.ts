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

export interface AuthStore {
  // allowlist: só e-mails liberados entram no painel
  isAllowed(email: string): Promise<boolean>;
  // magic link: guarda só o hash do token
  saveMagicToken(hash: string, email: string, expiresAt: number): Promise<void>;
  // valida + marca como usado; retorna o e-mail se válido, senão null
  consumeMagicToken(hash: string): Promise<string | null>;
}

// E-mails liberados no painel (dev). Em prod vem da tabela allowed_emails (D1).
// Pode adicionar mais via env ADMIN_EMAILS="a@x.com,b@y.com".
const SEED_ALLOWED = [
  "tar@shoppub.com.br",
  ...(process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ??
    []),
].filter(Boolean);

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

class MemoryAuthStore implements AuthStore {
  private allowed = new Set(SEED_ALLOWED);
  private tokens = new Map<
    string,
    { email: string; expiresAt: number; used: boolean }
  >();
  async isAllowed(email: string) {
    return this.allowed.has(email.toLowerCase());
  }
  async saveMagicToken(hash: string, email: string, expiresAt: number) {
    this.tokens.set(hash, { email, expiresAt, used: false });
  }
  async consumeMagicToken(hash: string) {
    const t = this.tokens.get(hash);
    if (!t || t.used || t.expiresAt < Date.now()) return null;
    t.used = true;
    return t.email;
  }
}

// ---------- Seleção da implementação ----------
// Runtime Cloudflare (Worker) → D1/KV. Caso contrário (next dev) → memória.

import {
  D1TenantStore,
  KVCatalogStore,
  D1AuthStore,
  hasCloudflareBindings,
} from "./stores-cf";

const memoryTenantStore = new MemoryTenantStore();
const memoryCatalogStore = new MemoryCatalogStore();
const memoryAuthStore = new MemoryAuthStore();
const d1TenantStore = new D1TenantStore();
const kvCatalogStore = new KVCatalogStore();
const d1AuthStore = new D1AuthStore();

export function getTenantStore(): TenantStore {
  return hasCloudflareBindings() ? d1TenantStore : memoryTenantStore;
}

export function getCatalogStore(): CatalogStore {
  return hasCloudflareBindings() ? kvCatalogStore : memoryCatalogStore;
}

export function getAuthStore(): AuthStore {
  return hasCloudflareBindings() ? d1AuthStore : memoryAuthStore;
}
