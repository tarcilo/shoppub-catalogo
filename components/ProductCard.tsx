import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/feed";
import { formatBRL } from "@/lib/format";

export function ProductCard({
  product,
  showPrice,
  priority = false,
}: {
  product: Product;
  showPrice: boolean;
  priority?: boolean;
}) {
  const hasDiscount =
    product.salePriceMin > 0 && product.salePriceMin < product.priceMin;

  return (
    <Link
      href={`/produto/${product.id}`}
      className="group flex flex-col rounded-lg border border-black/10 overflow-hidden bg-white hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-square bg-black/[0.03]">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-[1.03] transition-transform"
            priority={priority}
          />
        ) : null}
        {!product.inStock && (
          <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
            Esgotado
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <h3 className="text-sm font-medium line-clamp-2 flex-1">
          {product.title}
        </h3>
        {showPrice ? (
          <div className="flex items-baseline gap-2">
            {hasDiscount && (
              <span className="text-xs text-foreground/40 line-through">
                {formatBRL(product.priceMin)}
              </span>
            )}
            <span className="text-base font-semibold text-primary">
              {formatBRL(hasDiscount ? product.salePriceMin : product.priceMin)}
            </span>
          </div>
        ) : (
          <span className="text-sm font-medium text-foreground/50">
            Sob consulta
          </span>
        )}
      </div>
    </Link>
  );
}
