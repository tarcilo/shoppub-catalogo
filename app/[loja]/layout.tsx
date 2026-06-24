import type { Metadata } from "next";
import { requireTenant } from "@/lib/tenant";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SampleBanner } from "@/components/SampleBanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ loja: string }>;
}): Promise<Metadata> {
  const { loja } = await params;
  const tenant = await requireTenant(loja);
  return {
    title: `${tenant.name} — Catálogo`,
    description: `Catálogo de produtos de ${tenant.name}.`,
  };
}

export default async function LojaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ loja: string }>;
}) {
  const { loja } = await params;
  const tenant = await requireTenant(loja);

  return (
    <div
      className="flex-1 flex flex-col"
      style={{ ["--primary" as string]: tenant.primaryColor }}
    >
      <SampleBanner tenant={tenant} />
      <Header tenant={tenant} />
      <main className="flex-1">{children}</main>
      <Footer tenant={tenant} />
    </div>
  );
}
