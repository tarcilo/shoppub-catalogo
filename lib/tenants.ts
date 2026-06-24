// Configuração multi-tenant do catálogo.
// Cada loja é identificada pelo host (subdomínio) da requisição.
// No MVP isso vive aqui em memória; depois vira tabela/painel de cadastro.

export type Tenant = {
  /** identificador interno da loja */
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

// Lista de lojas atendidas. A chave é o host completo do subdomínio.
const TENANTS: Record<string, Tenant> = {
  "catalogo.cavalariashop.com.br": {
    slug: "cavalaria",
    name: "Cavalaria",
    feedUrl: "https://www.cavalariashop.com.br/feed/todos-os-produtos1/",
    whatsapp: "5511999999999",
    primaryColor: "#4a3b2a",
  },
  "catalogo.sacudidos.com.br": {
    slug: "sacudidos",
    name: "Sacudido's",
    feedUrl: "https://www.sacudidos.com.br/feed/todos-os-produtos/",
    whatsapp: "5511999999999",
    primaryColor: "#8B4513",
  },
};

// Loja usada em desenvolvimento local (localhost) e como fallback.
export const DEFAULT_TENANT_HOST = "catalogo.cavalariashop.com.br";

export function getAllTenants(): Tenant[] {
  return Object.values(TENANTS);
}

// Por padrão o catálogo é "sob consulta" — só mostra preço quando showPrice === true.
export function shouldShowPrice(tenant: Tenant): boolean {
  return tenant.showPrice === true;
}

export function getTenantByHost(host: string | null | undefined): Tenant {
  if (host) {
    // remove porta (localhost:3000) e normaliza
    const clean = host.split(":")[0].toLowerCase();
    if (TENANTS[clean]) return TENANTS[clean];
  }
  return TENANTS[DEFAULT_TENANT_HOST];
}
