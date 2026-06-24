// Autenticação do painel: sessão assinada (cookie HMAC) + senha (PBKDF2).
// Usa Web Crypto (funciona tanto no next dev/Node quanto no Cloudflare Workers).

export const SESSION_COOKIE = "catalogo_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
const PBKDF2_ITERATIONS = 100_000;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET não configurado.");
  return s;
}

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return arr;
}

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
  const payload = b64url(
    enc.encode(JSON.stringify({ email, exp: Date.now() + SESSION_TTL_MS }))
  );
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

export async function verifySession(
  value: string | undefined
): Promise<string | null> {
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

// ---------- Senha (PBKDF2 + salt) ----------

async function derive(
  password: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  return toHex(bits);
}

// Gera "saltHex:hashHex" para guardar.
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt);
  return `${toHex(salt)}:${hash}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const hash = await derive(password, fromHex(saltHex));
  return timingSafeEqual(hash, hashHex);
}

// Comparação de tempo constante (mesmo comprimento -> hex).
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------- Super admin ----------

// E-mails super admin (gerenciam usuários). Default + env SUPER_ADMINS.
const SUPER_ADMINS = new Set(
  [
    "tar@shoppub.com.br",
    ...(process.env.SUPER_ADMINS?.split(",").map((e) =>
      e.trim().toLowerCase()
    ) ?? []),
  ].filter(Boolean)
);

export function isSuperAdmin(email: string): boolean {
  return SUPER_ADMINS.has(email.toLowerCase());
}

// Senha do super admin vem da env ADMIN_PASSWORD (secret).
export function verifySuperAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && timingSafeEqual(password, expected);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
