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
};

// Seed de desenvolvimento. Em produção isso vem do D1 (tabela `lojas`).
export const SEED_TENANTS: Tenant[] = [
  {
    slug: "cavalaria",
    name: "Cavalaria",
    feedUrl: "https://www.cavalariashop.com.br/feed/todos-os-produtos1/",
    whatsapp: "5511999999999",
    primaryColor: "#4a3b2a",
  },
  {
    slug: "sacudidos",
    name: "Sacudido's",
    feedUrl: "https://www.sacudidos.com.br/feed/todos-os-produtos/",
    whatsapp: "5511999999999",
    primaryColor: "#8B4513",
  },
];

// Por padrão o catálogo é "sob consulta" — só mostra preço quando showPrice === true.
export function shouldShowPrice(tenant: Tenant): boolean {
  return tenant.showPrice === true;
}
