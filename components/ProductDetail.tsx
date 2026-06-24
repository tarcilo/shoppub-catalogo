"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/feed";
import { formatBRL } from "@/lib/format";

export function ProductDetail({
  product,
  whatsapp,
  showPrice,
}: {
  product: Product;
  whatsapp: string;
  showPrice: boolean;
}) {
  const [activeImage, setActiveImage] = useState(0);
  // variações com rótulo (tamanhos). Remove duplicados mantendo a primeira.
  const variations = product.variations.filter((v) => v.label);
  const [selected, setSelected] = useState<string | null>(
    variations.find((v) => v.inStock)?.id ?? variations[0]?.id ?? null
  );

  const current =
    product.variations.find((v) => v.id === selected) ?? product.variations[0];

  const price = current?.salePrice || product.salePriceMin || product.priceMin;
  const original = current?.price || product.priceMin;
  const hasDiscount = original > 0 && price < original;

  const msg = `Olá! Tenho interesse no produto "${product.title}"${
    current?.label ? ` (tam. ${current.label})` : ""
  } que vi no catálogo.${showPrice ? "" : " Pode me passar o preço?"}`;
  const waLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Galeria */}
      <div>
        <div className="relative aspect-square rounded-lg overflow-hidden bg-black/[0.03] border border-black/10">
          {product.images[activeImage] && (
            <Image
              src={product.images[activeImage]}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          )}
        </div>
        {product.images.length > 1 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {product.images.map((img, i) => (
              <button
                key={img}
                onClick={() => setActiveImage(i)}
                className={`relative w-16 h-16 rounded-md overflow-hidden border-2 ${
                  i === activeImage ? "border-primary" : "border-black/10"
                }`}
                aria-label={`Imagem ${i + 1}`}
              >
                <Image
                  src={img}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Infos */}
      <div>
        <h1 className="text-2xl font-bold">{product.title}</h1>

        {showPrice ? (
          <div className="mt-3 flex items-baseline gap-3">
            {hasDiscount && (
              <span className="text-foreground/40 line-through">
                {formatBRL(original)}
              </span>
            )}
            <span className="text-3xl font-bold text-primary">
              {formatBRL(price)}
            </span>
          </div>
        ) : (
          <p className="mt-3 text-lg font-medium text-foreground/50">
            Preço sob consulta
          </p>
        )}

        {!product.inStock && (
          <p className="mt-2 text-sm text-red-600">Produto esgotado</p>
        )}

        {/* Seleção de variação */}
        {variations.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium mb-2">Tamanho</p>
            <div className="flex flex-wrap gap-2">
              {variations.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelected(v.id)}
                  disabled={!v.inStock}
                  className={`min-w-11 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                    selected === v.id
                      ? "border-primary text-primary"
                      : "border-black/15 hover:border-primary"
                  } ${
                    !v.inStock
                      ? "opacity-40 line-through cursor-not-allowed"
                      : ""
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CTA WhatsApp */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 flex items-center justify-center gap-2 w-full rounded-full bg-[#25D366] text-white font-semibold px-6 py-3.5 hover:opacity-90"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 fill-current"
            aria-hidden="true"
          >
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.01c-.24.68-1.42 1.31-1.95 1.36-.5.05-1.13.27-3.66-.76-3.07-1.24-5.04-4.37-5.2-4.58-.15-.2-1.24-1.65-1.24-3.15s.79-2.24 1.07-2.54c.27-.3.59-.38.79-.38.2 0 .4.002.57.01.18.008.43-.07.67.51.24.59.83 2.04.9 2.19.07.15.12.32.02.51-.1.2-.15.32-.3.49-.15.18-.31.39-.45.53-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.36 1.45.3.15.47.12.64-.07.18-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.7.8 1.99.95.3.15.49.22.56.34.07.12.07.7-.17 1.38z" />
          </svg>
          {showPrice ? "Comprar pelo WhatsApp" : "Consultar pelo WhatsApp"}
        </a>

        {product.description && (
          <div className="mt-8 text-sm text-foreground/70 leading-relaxed whitespace-pre-line">
            {product.description}
          </div>
        )}
      </div>
    </div>
  );
}
