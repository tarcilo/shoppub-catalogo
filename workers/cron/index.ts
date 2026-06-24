// Worker de cron: dispara o sync diário do catálogo.
// Roda 1x ao dia (03h BRT) e só chama o endpoint /api/sync do app por HTTP —
// não acopla nada do OpenNext. Mantém a responsabilidade do sync no próprio app.

interface Env {
  CATALOG_URL: string; // ex: https://catalogo.shoppub.io
  SYNC_TOKEN: string; // secret (mesmo valor do SYNC_TOKEN do app)
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const run = async () => {
      const res = await fetch(`${env.CATALOG_URL}/api/sync`, {
        headers: { Authorization: `Bearer ${env.SYNC_TOKEN}` },
      });
      const body = await res.text();
      console.log(`[cron] sync ${res.status}: ${body.slice(0, 500)}`);
    };
    ctx.waitUntil(run());
  },
} satisfies ExportedHandler<Env>;
