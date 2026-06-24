import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getTenantByHost } from "@/lib/tenants";
import { getCatalog } from "@/lib/feed";

// Sitemap dinâmico por loja (gerado a partir do host da requisição).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;

  const tenant = getTenantByHost(host);
  const { products, updatedAt } = await getCatalog(tenant);
  const lastModified = new Date(updatedAt);

  return [
    { url: `${base}/`, lastModified, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/produtos`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...products.map((p) => ({
      url: `${base}/produto/${p.id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
