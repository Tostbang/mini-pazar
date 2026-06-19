import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { cn } from "@/lib/utils";
import { Geist, Inter } from "next/font/google";
import localFont from "next/font/local";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const intro = localFont({
  src: [
    {
      path: "./fonts/intro/Intro Black Alt.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/intro/Intro Bold Alt.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/intro/Intro Regular Alt.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/intro/Intro Light Alt.otf",
      weight: "300",
      style: "normal",
    },
  ],
  variable: "--font-intro",
});

const helvetica = localFont({
  src: [
    {
      path: "./fonts/HelveticaNeueThin.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/HelveticaNeueUltraLight.otf",
      weight: "200",
      style: "normal",
    },
    {
      path: "./fonts/HelveticaNeueLight.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/HelveticaNeueRoman.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/HelveticaNeueMedium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/HelveticaNeueBold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-helvetica",
});

export const metadata: Metadata = {
  title: "Gromuse — Market Alışverişi ve Teslimat",
  description:
    "Tazeliği hemen yaşayın. Organik ürünler ve sürdürülebilir kaynaklı market alışverişiniz kapınıza gelsin.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="bg-background">
      <body
        className={`${helvetica.className}
          ${intro.variable}
	  font-sans antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
