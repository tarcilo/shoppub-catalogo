// Autenticação do painel: sessão assinada (cookie HMAC) + tokens de magic link.
// Usa Web Crypto (funciona tanto no next dev/Node quanto no Cloudflare Workers).

export const SESSION_COOKIE = "catalogo_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
export const MAGIC_TTL_MS = 15 * 60 * 1000; // 15 min

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET não configurado.");
  return s;
}

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return b64url(sig);
}

// ---------- Sessão (cookie assinado) ----------

export async function signSession(email: string): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ email, exp: Date.now() + SESSION_TTL_MS })));
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

export async function verifySession(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  if ((await hmac(payload)) !== sig) return null;
  try {
    const bin = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(bin) as { email: string; exp: number };
    if (!data.email || !data.exp || data.exp < Date.now()) return null;
    return data.email;
  } catch {
    return null;
  }
}

// ---------- Magic link tokens ----------

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(token));
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
