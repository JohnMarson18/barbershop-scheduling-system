import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { siteConfig } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  title: `${siteConfig.name} - Agendamento Online`,
  description: `${siteConfig.description}. Agende seu atendimento online em instantes.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
