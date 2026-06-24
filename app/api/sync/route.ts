import { NextResponse } from "next/server";
import { getTenantStore } from "@/lib/stores";
import { refreshCatalog } from "@/lib/feed";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Sync diário do catálogo. Deve ser chamado 1x ao dia, de madrugada, por um cron
// (Vercel Cron ou crontab do servidor) que envie o token de autorização.
//
//   GET /api/sync   com header  Authorization: Bearer <SYNC_TOKEN>
//   ou              com query   ?token=<SYNC_TOKEN>
//
// Configure a env SYNC_TOKEN. Sem ela, o endpoint fica desabilitado.
export async function GET(request: Request) {
  const expected = process.env.SYNC_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "SYNC_TOKEN não configurado." },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("token");

  if (provided !== expected) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, {
      status: 401,
    });
  }

  const tenants = await getTenantStore().list();
  const results = await Promise.all(
    tenants.map(async (t) => {
      try {
        const catalog = await refreshCatalog(t);
        return { loja: t.slug, ok: true, produtos: catalog.products.length };
      } catch (e) {
        return {
          loja: t.slug,
          ok: false,
          erro: e instanceof Error ? e.message : String(e),
        };
      }
    })
  );

  return NextResponse.json({ ok: true, sincronizado: results });
}
