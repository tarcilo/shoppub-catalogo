import { getAssetStore } from "./stores";

// Formatos aceitos para a logo e a extensão de cada um.
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export class LogoError extends Error {}

// Valida e salva o arquivo da logo; retorna a URL pública (servida em /assets/...).
export async function saveLogo(file: File, slug: string): Promise<string> {
  const ext = ALLOWED[file.type];
  if (!ext) {
    throw new LogoError(
      "Formato de logo inválido. Use PNG, JPG, GIF, WEBP, AVIF ou SVG."
    );
  }
  if (file.size > MAX_BYTES) {
    throw new LogoError("A logo deve ter no máximo 2 MB.");
  }

  const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
  const key = `logos/${slug}-${rand}.${ext}`;

  await getAssetStore().put(key, await file.arrayBuffer(), file.type);
  return `/assets/${key}`;
}
