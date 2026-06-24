// Configuração do adaptador OpenNext para Cloudflare Workers.
// Build de deploy: `npx opennextjs-cloudflare build && npx wrangler deploy`.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
