import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // O feed já entrega imagens otimizadas pelo CDN da Shoppub
    // (cdn.shoppub.io/cdn-cgi/image/... com resize + WebP/AVIF). Então não
    // usamos o otimizador do Next — que, além de redundante, não roda no
    // Cloudflare Workers. Usamos a URL do CDN direto.
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "cdn.shoppub.io" }],
  },
};

export default nextConfig;
