import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { getCurrentTenant } from "@/lib/tenant";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SampleBanner } from "@/components/SampleBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  return {
    title: `${tenant.name} — Catálogo`,
    description: `Catálogo de produtos de ${tenant.name}.`,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = await getCurrentTenant();
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} h-full antialiased`}
      style={{ ["--primary" as string]: tenant.primaryColor }}
      // Extensões de navegador (ex: gravadores de tela) injetam atributos no
      // <html> antes do React hidratar, gerando aviso de hidratação. Suprime
      // só neste nível — não afeta o resto da árvore.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <SampleBanner />
        <Header tenant={tenant} />
        <main className="flex-1">{children}</main>
        <Footer tenant={tenant} />
      </body>
    </html>
  );
}
