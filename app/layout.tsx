import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Oryze — Le geste complète votre marque",
  description:
    "Étude d'interaction sur une relance préparée par Oryze Intelligence et confirmée par un maintien.",
};

export const viewport: Viewport = {
  themeColor: "#FAF8F2",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`} lang="fr">
      <body>{children}</body>
    </html>
  );
}
