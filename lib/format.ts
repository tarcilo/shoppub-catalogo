import type { Product } from "./feed";
import type { Tenant } from "./tenants";

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Monta o link do WhatsApp com mensagem pré-preenchida do produto.
export function whatsappLink(tenant: Tenant, product: Product): string {
  const msg = `Olá! Tenho interesse no produto "${product.title}" que vi no catálogo.`;
  return `https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(msg)}`;
}
