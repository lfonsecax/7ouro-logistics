import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "7Ouro Logistics",
  description: "Sistema de gestão de frota",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-950 text-gray-100">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
