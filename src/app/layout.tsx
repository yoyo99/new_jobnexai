import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobNexAI - L'Intelligence Artificielle au service de votre carrière",
  description: "Trouvez l'emploi de vos rêves avec JobNexAI. Notre IA analyse votre profil et vous connecte aux opportunités parfaites.",
  keywords: ["JobNexAI", "recherche d'emploi", "IA", "recrutement", "carrière", "job", "AI"],
  authors: [{ name: "JobNexAI Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "JobNexAI - Trouvez votre emploi idéal grâce à l'IA",
    description: "La plateforme de recherche d'emploi propulsée par l'intelligence artificielle",
    url: "https://jobnexai.com",
    siteName: "JobNexAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JobNexAI - Votre carrière propulsée par l'IA",
    description: "Trouvez l'emploi parfait grâce à notre algorithme intelligent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
