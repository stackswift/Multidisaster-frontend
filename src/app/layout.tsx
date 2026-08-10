import type { Metadata } from "next";
import { Inter, Outfit, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AAS Command Center",
  description: "Multi-Disaster Autonomous Aerial Swarm Command Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${inter.variable} ${outfit.variable} ${robotoMono.variable} h-full antialiased bg-slate-950 text-slate-100`}
    >
      <body suppressHydrationWarning className="h-full flex flex-col overflow-hidden">{children}</body>
    </html>
  );
}
