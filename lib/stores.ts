import type { Catalog } from "./feed";
import type { Tenant } from "./tenants";
import { SEED_TENANTS } from "./tenants";

// Abstração de armazenamento. Em dev usamos memória; em produção (Cloudflare)
// trocamos por D1 (lojas) e KV (catálogo parseado) — ver lib/stores-cf.ts.
// As páginas e o feed só dependem destas interfaces, então a troca é drop-in.

export interface TenantStore {
  getBySlug(slug: string): Promise<Tenant | null>;
  list(): Promise<Tenant[]>;
  // ---- usado pelo painel ----
  listByOwner(email: string): Promise<Tenant[]>;
  slugExists(slug: string): Promise<boolean>;
  create(tenant: Tenant): Promise<void>;
  update(slug: string, fields: Partial<Tenant>): Promise<void>;
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

export interface StoredAsset {
  body: ArrayBuffer;
  contentType: string;
}

// Armazenamento de arquivos (logos das lojas). Dev: memória. Prod: R2.
export interface AssetStore {
  put(key: string, body: ArrayBuffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredAsset | null>;
}

// E-mails liberados no painel (dev). Em prod vem da tabela allowed_emails (D1).
// Pode adicionar mais via env ADMIN_EMAILS="a@x.com,b@y.com".
const SEED_ALLOWED = [
  "tar@shoppub.com.br",
  ...(process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ??
    []),
].filter(Boolean);

// ---------- Implementação em memória (desenvolvimento) ----------
// Os dados ficam em globalThis para serem compartilhados entre rotas e
// sobreviverem ao HMR do next dev (em produção quem guarda é D1/KV/R2).

const mem = globalThis as unknown as {
  __tenants?: Map<string, Tenant>;
  __catalog?: Map<string, CatalogEntry>;
  __allowed?: Set<string>;
  __tokens?: Map<string, { email: string; expiresAt: number; used: boolean }>;
  __assets?: Map<string, StoredAsset>;
};
mem.__tenants ??= new Map(SEED_TENANTS.map((t) => [t.slug, t]));
mem.__catalog ??= new Map();
mem.__allowed ??= new Set(SEED_ALLOWED);
mem.__tokens ??= new Map();
mem.__assets ??= new Map();

class MemoryTenantStore implements TenantStore {
  private bySlug = mem.__tenants!;
  async getBySlug(slug: string) {
    return this.bySlug.get(slug) ?? null;
  }
  async list() {
    return [...this.bySlug.values()];
  }
  async listByOwner(email: string) {
    const e = email.toLowerCase();
    return [...this.bySlug.values()].filter(
      (t) => t.ownerEmail?.toLowerCase() === e
    );
  }
  async slugExists(slug: string) {
    return this.bySlug.has(slug);
  }
  async create(tenant: Tenant) {
    this.bySlug.set(tenant.slug, tenant);
  }
  async update(slug: string, fields: Partial<Tenant>) {
    const cur = this.bySlug.get(slug);
    if (cur) this.bySlug.set(slug, { ...cur, ...fields, slug });
  }
}

class MemoryCatalogStore implements CatalogStore {
  private map = mem.__catalog!;
  async get(slug: string) {
    return this.map.get(slug) ?? null;
  }
  async set(slug: string, catalog: Catalog) {
    this.map.set(slug, { catalog, at: Date.now() });
  }
}

class MemoryAuthStore implements AuthStore {
  private allowed = mem.__allowed!;
  private tokens = mem.__tokens!;
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

class MemoryAssetStore implements AssetStore {
  private map = mem.__assets!;
  async put(key: string, body: ArrayBuffer, contentType: string) {
    this.map.set(key, { body, contentType });
  }
  async get(key: string) {
    return this.map.get(key) ?? null;
  }
}

// ---------- Seleção da implementação ----------
// Runtime Cloudflare (Worker) → D1/KV/R2. Caso contrário (next dev) → memória.

import {
  D1TenantStore,
  KVCatalogStore,
  D1AuthStore,
  R2AssetStore,
  hasCloudflareBindings,
} from "./stores-cf";

const memoryTenantStore = new MemoryTenantStore();
const memoryCatalogStore = new MemoryCatalogStore();
const memoryAuthStore = new MemoryAuthStore();
const memoryAssetStore = new MemoryAssetStore();
const d1TenantStore = new D1TenantStore();
const kvCatalogStore = new KVCatalogStore();
const d1AuthStore = new D1AuthStore();
const r2AssetStore = new R2AssetStore();

export function getTenantStore(): TenantStore {
  return hasCloudflareBindings() ? d1TenantStore : memoryTenantStore;
}

export function getCatalogStore(): CatalogStore {
  return hasCloudflareBindings() ? kvCatalogStore : memoryCatalogStore;
}

export function getAuthStore(): AuthStore {
  return hasCloudflareBindings() ? d1AuthStore : memoryAuthStore;
}

export function getAssetStore(): AssetStore {
  return hasCloudflareBindings() ? r2AssetStore : memoryAssetStore;
}
