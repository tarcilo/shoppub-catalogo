import { headers } from "next/headers";
import { getTenantBySlug } from "@/lib/tenant";
import { getCatalog } from "@/lib/feed";

// Sitemap por loja: catalogo.shoppub.io/{loja}/sitemap.xml
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ loja: string }> }
) {
  const { loja } = await params;
  const tenant = await getTenantBySlug(loja);
  if (!tenant) return new Response("Not found", { status: 404 });

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "catalogo.shoppub.io";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}/${loja}`;

  const { products, updatedAt } = await getCatalog(tenant);
  const lastmod = new Date(updatedAt).toISOString();

  const urls = [
    { loc: `${base}`, priority: "1.0" },
    { loc: `${base}/produtos`, priority: "0.8" },
    ...products.map((p) => ({
      loc: `${base}/produto/${p.id}`,
      priority: "0.6",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `<url><loc>${u.loc}</loc><lastmod>${lastmod}</lastmod><priority>${u.priority}</priority></url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
