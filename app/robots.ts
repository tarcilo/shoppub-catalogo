import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getTenantStore } from "@/lib/stores";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "catalogo.shoppub.io";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;

  const lojas = await getTenantStore().list();

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: lojas.map((l) => `${base}/${l.slug}/sitemap.xml`),
  };
}
