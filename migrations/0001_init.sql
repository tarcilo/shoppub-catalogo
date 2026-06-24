-- Schema inicial do catálogo (Cloudflare D1).
-- Aplicar com: npx wrangler d1 migrations apply catalogo-shoppub

-- Lojas (tenants). Substitui o seed de lib/tenants.ts em produção.
CREATE TABLE IF NOT EXISTS lojas (
  slug          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  feed_url      TEXT NOT NULL,
  whatsapp      TEXT NOT NULL,
  primary_color TEXT NOT NULL DEFAULT '#4a3b2a',
  logo_url      TEXT,
  show_price    INTEGER NOT NULL DEFAULT 0,  -- 0 = "sob consulta" (padrão), 1 = mostra preço
  owner_email   TEXT NOT NULL,               -- dono da loja (login por magic link)
  ativo         INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lojas_owner ON lojas(owner_email);

-- Usuários do painel (donos de loja).
CREATE TABLE IF NOT EXISTS usuarios (
  email      TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tokens de login por magic link (guardamos só o hash do token).
CREATE TABLE IF NOT EXISTS magic_tokens (
  token_hash TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tokens_email ON magic_tokens(email);
