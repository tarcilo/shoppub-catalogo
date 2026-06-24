import { notFound } from "next/navigation";
import { getTenantStore } from "./stores";
import type { Tenant } from "./tenants";

// Resolve a loja pelo slug da URL (catalogo.shoppub.io/{slug}).
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return getTenantStore().getBySlug(slug);
}

// Igual ao acima, mas dispara 404 quando a loja não existe.
export async function requireTenant(slug: string): Promise<Tenant> {
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  return tenant;
}
