-- Allowlist do painel: só estes e-mails conseguem entrar (login por magic link).
CREATE TABLE IF NOT EXISTS allowed_emails (
  email      TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Libera o admin inicial. Adicione lojistas com:
--   INSERT OR IGNORE INTO allowed_emails (email) VALUES ('lojista@exemplo.com');
INSERT OR IGNORE INTO allowed_emails (email) VALUES ('tar@shoppub.com.br');
