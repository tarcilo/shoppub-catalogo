// Modelo da loja (tenant). Cada loja é identificada por um `slug` e o catálogo
// público vive em catalogo.shoppub.io/{slug}.
//
// Os dados ficam no TenantStore (lib/stores.ts). Em dev, a fonte é o SEED abaixo;
// em produção (Cloudflare) será a tabela `lojas` no D1, preenchida pelo painel.

export type Tenant = {
  /** identificador da loja na URL: catalogo.shoppub.io/{slug} */
  slug: string;
  /** nome exibido no catálogo */
  name: string;
  /** URL do feed XML (Atom + Google Shopping) da loja */
  feedUrl: string;
  /** telefone do WhatsApp com DDI+DDD, só números. Ex: 5511999999999 */
  whatsapp: string;
  /** cor primária (CSS) usada no tema da loja */
  primaryColor: string;
  /** URL do logo (opcional) */
  logo?: string;
  /**
   * Exibir preços no catálogo. Por padrão (undefined/false) o catálogo é
   * "sob consulta": preços ficam ocultos e o cliente fala no WhatsApp.
   * Defina `true` para a loja que quiser mostrar preço.
   */
  showPrice?: boolean;
  /** e-mail do dono da loja (quem edita no painel) */
  ownerEmail?: string;
};

// Slugs reservados (rotas do app) — não podem ser usados como loja.
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "new",
  "_next",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
]);

// Valida/normaliza um slug de loja. Retorna erro (string) ou null se ok.
export function validateSlug(slug: string): string | null {
  if (!slug) return "Informe o endereço da loja.";
  if (!/^[a-z0-9-]+$/.test(slug))
    return "Use só letras minúsculas, números e hífen.";
  if (slug.length < 2 || slug.length > 40)
    return "O endereço deve ter entre 2 e 40 caracteres.";
  if (RESERVED_SLUGS.has(slug)) return "Esse endereço é reservado.";
  return null;
}

// Seed de desenvolvimento. Em produção isso vem do D1 (tabela `lojas`).
export const SEED_TENANTS: Tenant[] = [
  {
    slug: "cavalaria",
    name: "Cavalaria",
    feedUrl: "https://www.cavalariashop.com.br/feed/todos-os-produtos1/",
    whatsapp: "5511999999999",
    primaryColor: "#4a3b2a",
    ownerEmail: "tar@shoppub.com.br",
  },
  {
    slug: "sacudidos",
    name: "Sacudido's",
    feedUrl: "https://www.sacudidos.com.br/feed/todos-os-produtos/",
    whatsapp: "5511999999999",
    primaryColor: "#8B4513",
    ownerEmail: "tar@shoppub.com.br",
  },
];

// Por padrão o catálogo é "sob consulta" — só mostra preço quando showPrice === true.
export function shouldShowPrice(tenant: Tenant): boolean {
  return tenant.showPrice === true;
}
