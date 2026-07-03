import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Market Cards — Gerador de Cards Financeiros",
  description:
    "Ferramenta para gerar cards profissionais de fechamento de mercado para WhatsApp Status e LinkedIn.",
  keywords: [
    "mercado financeiro",
    "commodities",
    "cards",
    "cotações",
    "fechamento de mercado",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
