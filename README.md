# Catálogo Shoppub

Catálogo online **multi-tenant** gerado a partir do feed XML (Atom + Google Shopping)
de cada loja Shoppub. Vitrine de consulta — **sem carrinho/checkout**. CTA por produto
leva ao **WhatsApp** da loja.

O catálogo é **path-based**: cada loja vive em `catalogo.shoppub.io/{slug}` e é
resolvida pelo segmento da URL. Hospedagem alvo: **Cloudflare Workers** (via OpenNext),
com **D1** (lojas) e **KV** (catálogo parseado).

## Rodando localmente

```bash
npm install
npm run dev
# http://localhost:3000
#   /                    -> landing (lista as lojas do seed)
#   /cavalaria           -> catálogo da loja
#   /cavalaria/produtos  -> listagem com filtros
```

Em dev, os dados vêm do **seed** em `lib/tenants.ts` e o catálogo fica em memória
(`MemoryCatalogStore`). Em produção, vêm do D1/KV (ver "Deploy").

## Como funciona

- **`lib/stores.ts`** — abstração de armazenamento (`TenantStore` / `CatalogStore`).
  Em dev: memória. Em produção: D1/KV (ver `lib/stores-cf.ts`). É o único ponto de troca.
- **`lib/tenants.ts`** — tipo `Tenant` + seed de dev das lojas.
- **`lib/tenant.ts`** — resolve a loja pelo `slug` da URL (`requireTenant` → 404 se não existir).
- **`lib/feed.ts`** — busca o XML, parseia, **agrupa as variações por `g:item_group_id`**
  (cada grupo = 1 produto), normaliza preços/imagens/categorias, guarda no CatalogStore
  (TTL 24h) e tem os helpers de filtro/busca/ordenação/facets.
- **`app/[loja]/`** — Home, listagem (`/[loja]/produtos`) e produto (`/[loja]/produto/[id]`).
- **`app/page.tsx`** — landing de `catalogo.shoppub.io`.

## Adicionar uma loja (dev)

Edite o seed em `lib/tenants.ts`:

```ts
{
  slug: "outraloja",                // catalogo.shoppub.io/outraloja
  name: "Outra Loja",
  feedUrl: "https://www.outraloja.com.br/feed/todos-os-produtos/",
  whatsapp: "5511988887777",
  primaryColor: "#0a7d3b",
  logo: "https://.../logo.png",     // opcional
  showPrice: false,                 // padrão "sob consulta"; true mostra preço
}
```

Em produção, a loja é cadastrada no painel (próxima fase), que grava na tabela `lojas` do D1.

## Preço oculto (padrão)

Por padrão o catálogo é **"sob consulta"**: preços ficam ocultos e o filtro de preço some.
O cliente fala no WhatsApp. Para exibir preço, defina `showPrice: true` na loja — aí
aparecem preços, filtro de preço e o `offers` no JSON-LD.

## SEO

- `robots.txt` lista o sitemap de cada loja.
- `/[loja]/sitemap.xml` por loja (home + listagem + todos os produtos).
- `generateMetadata` por produto (title, description, Open Graph com imagem).
- JSON-LD `Product` na PDP (inclui `offers` só quando `showPrice`).

## Sync diário (de madrugada)

O catálogo é atualizado **1x ao dia, de madrugada** (03h BRT). Entre syncs o catálogo
fica no KV; se a origem cair, continua servindo o último dado conhecido.

- **Endpoint**: `/api/sync` protegido por `SYNC_TOKEN` (`Authorization: Bearer <token>`
  ou `?token=`).
- **Cloudflare**: o `wrangler.jsonc` agenda `"0 6 * * *"` (UTC = 03h BRT) via Cron Trigger.

## Fallback de desenvolvimento

Se o feed da loja estiver fora do ar **em dev**, a app usa a amostra em
`lib/sample-feed.ts` para não travar o trabalho local (mostra um aviso amarelo no topo).
Em produção isso nunca acontece — o erro vira a tela "catálogo indisponível"
(`app/error.tsx`).

## Deploy (Cloudflare)

O adaptador (`@opennextjs/cloudflare`), o wrangler e a seleção D1/KV em `lib/stores.ts`
**já estão prontos** — `lib/stores.ts` usa D1/KV quando há bindings (Worker) e memória em
`next dev`. Falta apenas rodar os comandos autenticados na conta Cloudflare.

**App (catalogo.shoppub.io):**

1. `npx wrangler login`
2. `npx wrangler d1 create catalogo-shoppub` → cole o `database_id` no `wrangler.jsonc`.
3. `npx wrangler kv namespace create CATALOG_KV` → cole o `id` no `wrangler.jsonc`.
4. `npx wrangler d1 migrations apply catalogo-shoppub --remote` (cria tabelas + seed).
5. `npx wrangler secret put SYNC_TOKEN` (cole um valor aleatório).
6. `npx opennextjs-cloudflare build && npx wrangler deploy`
   → o domínio `catalogo.shoppub.io` é provisionado automaticamente (DNS + SSL).

> Ao editar `wrangler.jsonc`, rode `npx wrangler types` para atualizar `worker-configuration.d.ts`.

**Cron de sync (worker separado, `workers/cron/`):**

7. `cd workers/cron && npx wrangler secret put SYNC_TOKEN` (mesmo valor do passo 5).
8. `npx wrangler deploy` → agenda o disparo diário (03h BRT) chamando `/api/sync`.

## Pendências (próximas fases)

- **Painel + login** (`/admin`, magic link por e-mail) para o lojista cadastrar a loja.
- **Domínio próprio** opcional do cliente via Cloudflare for SaaS (custom hostnames).
- **Blocklist de categorias** por loja (o feed expõe categorias internas, ex: "INATIVO").
- **Heurística de título**: refinar a limpeza do título base em feeds inconsistentes.
