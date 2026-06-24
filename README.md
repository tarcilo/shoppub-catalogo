# Catálogo Shoppub

Catálogo online **multi-tenant** gerado a partir do feed XML (Atom + Google Shopping)
de cada loja Shoppub. Vitrine de consulta — **sem carrinho/checkout**. CTA por produto
leva ao **WhatsApp** da loja.

Cada loja roda no próprio subdomínio (ex: `catalogo.minhaloja.com.br`); a aplicação
identifica a loja pelo host da requisição.

## Rodando localmente

```bash
npm install
npm run dev
# http://localhost:3000  (em dev usa a loja padrão = Sacudido's)
```

## Como funciona

- **`lib/tenants.ts`** — cadastro das lojas (host → feed URL, WhatsApp, cor, logo).
  No MVP fica em memória; depois vira tabela/painel de cadastro.
- **`lib/tenant.ts`** — resolve a loja atual pelo header `host`.
- **`lib/feed.ts`** — busca o XML, parseia, **agrupa as variações por `g:item_group_id`**
  (cada grupo = 1 produto), normaliza preços/imagens/categorias e mantém um
  **cache em memória com TTL de 1h** por feed. Também tem os helpers de filtro/busca/ordenação.
- **`app/`** — Home (`/`), listagem (`/produtos`), produto (`/produto/[id]`).
- **`components/`** — Header, Footer, ProductCard, ProductDetail (galeria + variação +
  WhatsApp), SortSelect.

## Adicionar uma loja nova

Edite `lib/tenants.ts` e adicione uma entrada com o host do subdomínio:

```ts
"catalogo.outraloja.com.br": {
  slug: "outraloja",
  name: "Outra Loja",
  feedUrl: "https://www.outraloja.com.br/feed/todos-os-produtos/",
  whatsapp: "5511988887777",
  primaryColor: "#0a7d3b",
  logo: "https://.../logo.png", // opcional
  showPrice: false, // padrão: catálogo "sob consulta" (sem preço). true = mostra preço.
},
```

## Preço oculto (padrão)

Por padrão o catálogo é **"sob consulta"**: preços ficam ocultos em toda a vitrine e o
filtro de preço some. O cliente fala no WhatsApp para saber o valor. Para uma loja que
queira exibir preço, defina `showPrice: true` na config do tenant — aí aparecem preços,
filtro de preço e o `offers` no JSON-LD.

## Sync diário (de madrugada)

O catálogo é atualizado **1x ao dia, de madrugada**, via o endpoint protegido `/api/sync`,
disparado por cron. Entre syncs, o feed parseado fica em cache (TTL 24h como rede de
segurança). Se a origem cair, o catálogo continua servindo o último dado conhecido.

- **Token**: defina a env `SYNC_TOKEN` (veja `.env.example`). O endpoint exige
  `Authorization: Bearer <token>` ou `?token=<token>`.
- **Vercel**: o `vercel.json` agenda `"0 6 * * *"` (UTC) = **03h BRT**. Na Vercel, use o
  mesmo valor em `CRON_SECRET` (o Cron envia o header de Authorization automaticamente).
- **Servidor próprio (crontab)**:
  ```
  0 3 * * * curl -s "https://catalogo.minhaloja.com.br/api/sync?token=SEU_TOKEN" >/dev/null
  ```

## SEO

- `sitemap.xml` e `robots.txt` dinâmicos por loja (gerados pelo host).
- `generateMetadata` por produto (title, description, Open Graph com imagem).
- JSON-LD `Product` na PDP (inclui `offers` só quando `showPrice` é true).

## Fallback de desenvolvimento

Se o feed da loja estiver fora do ar **em dev**, a app usa a amostra em
`lib/sample-feed.ts` para não travar o trabalho local. Em produção isso nunca acontece —
o erro vira a tela "catálogo indisponível" (`app/error.tsx`).

## Pendências conhecidas (próximas fases)

- **Store compartilhado** (KV/Postgres) no lugar do cache em memória — necessário quando
  rodar multi-instância/serverless, senão cada instância tem seu próprio cache.
- **Blocklist de categorias** por loja (o feed expõe categorias internas, ex: "INATIVO").
- **DNS/SSL**: CNAME do cliente + emissão automática de certificado (on-demand TLS).
- **Painel de cadastro** de lojas substituindo o `lib/tenants.ts`.
- **Heurística de título**: alguns produtos do feed trazem a variação no nome de forma
  inconsistente; refinar a limpeza do título base.
