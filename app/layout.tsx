import type React from "react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Montserrat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/contexts/language-context";
import ScrollToTop from "@/components/ScrollToTop";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chile Adicto Hoteles - Los + lindos hoteles para visitar en Chile",
  description: "",
  generator: "",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${montserrat.className} font-sans antialiased`}>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-P1YHK13HP8"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-P1YHK13HP8');`}
        </Script>
        <LanguageProvider>
          {/* Suspense para cualquier hook de navegación dentro de hijos */}
          <Suspense fallback={null}>{children}</Suspense>
          <ScrollToTop />
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
