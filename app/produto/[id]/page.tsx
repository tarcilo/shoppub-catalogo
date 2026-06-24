import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentTenant } from "@/lib/tenant";
import { shouldShowPrice } from "@/lib/tenants";
import { getProduct } from "@/lib/feed";
import { ProductDetail } from "@/components/ProductDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getCurrentTenant();
  const product = await getProduct(tenant, id);
  if (!product) return { title: "Produto não encontrado" };

  const title = `${product.title} — ${tenant.name}`;
  const description =
    product.description || `${product.title} no catálogo de ${tenant.name}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.images[0] ? [product.images[0]] : undefined,
      type: "website",
    },
  };
}

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getCurrentTenant();
  const product = await getProduct(tenant, id);

  if (!product) notFound();

  const showPrice = shouldShowPrice(tenant);

  // JSON-LD Schema.org Product (inclui preço só quando a loja exibe preço).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images,
    description: product.description || product.title,
    category: product.category || undefined,
    ...(showPrice && product.salePriceMin > 0
      ? {
          offers: {
            "@type": "Offer",
            price: product.salePriceMin.toFixed(2),
            priceCurrency: "BRL",
            availability: product.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb */}
      <nav className="text-sm text-foreground/50 mb-5 flex flex-wrap gap-1">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>
        <span>/</span>
        <Link href="/produtos" className="hover:text-primary">
          Produtos
        </Link>
        {product.categories[0] && (
          <>
            <span>/</span>
            <Link
              href={`/produtos?categoria=${encodeURIComponent(product.category)}`}
              className="hover:text-primary"
            >
              {product.categories[0]}
            </Link>
          </>
        )}
      </nav>

      <ProductDetail
        product={product}
        whatsapp={tenant.whatsapp}
        showPrice={showPrice}
      />
    </div>
  );
}
