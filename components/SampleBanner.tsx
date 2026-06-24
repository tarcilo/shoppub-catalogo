import { getCatalog } from "@/lib/feed";
import type { Tenant } from "@/lib/tenants";

// Aviso (só dev) de que o feed real está fora do ar e estamos usando a amostra.
export async function SampleBanner({ tenant }: { tenant: Tenant }) {
  let isSample = false;
  try {
    const catalog = await getCatalog(tenant);
    isSample = catalog.isSample === true;
  } catch {
    return null;
  }
  if (!isSample) return null;

  return (
    <div className="bg-amber-100 text-amber-900 text-sm text-center px-4 py-2 border-b border-amber-200">
      ⚠️ Feed da loja indisponível (HTTP 500 na origem). Exibindo{" "}
      <strong>dados de amostra</strong> de desenvolvimento — não é o catálogo real.
    </div>
  );
}
