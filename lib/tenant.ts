import { headers } from "next/headers";
import { getTenantByHost, type Tenant } from "./tenants";

// Resolve a loja atual a partir do host da requisição (subdomínio).
export async function getCurrentTenant(): Promise<Tenant> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return getTenantByHost(host);
}
