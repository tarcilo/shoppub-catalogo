import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Catálogo Shoppub",
  description: "Catálogos online das lojas Shoppub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} h-full antialiased`}
      // Extensões de navegador (ex: gravadores de tela) injetam atributos no
      // <html> antes do React hidratar, gerando aviso de hidratação. Suprime
      // só neste nível — não afeta o resto da árvore.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
