import { getAssetStore } from "@/lib/stores";

// Serve os arquivos enviados (logos) do AssetStore (R2 em prod, memória em dev).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const asset = await getAssetStore().get(key.join("/"));
  if (!asset) return new Response("Not found", { status: 404 });

  return new Response(asset.body, {
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "public, max-age=86400",
      // SVG pode conter script: neutraliza execução se acessado direto.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
