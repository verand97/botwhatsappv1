import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kendali.Bot — Dashboard & Control Room Bot WhatsApp Multifungsi",
  description: "Platform kontrol visual untuk menghubungkan dan mengelola bot WhatsApp personal & komunitas: Stiker maker, downloader, auto-reply, grup tools, dan AI chat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-panel-950 text-gray-200 antialiased min-h-screen selection:bg-circuit-500/30 selection:text-circuit-400">
        {children}
      </body>
    </html>
  );
}
