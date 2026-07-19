import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/app/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Golden Store",
  description: "E-commerce untuk produk pilihan terbaik.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Providers>
          <SiteHeader />
          <main className="main-shell">
            <div className="page-frame">{children}</div>
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
