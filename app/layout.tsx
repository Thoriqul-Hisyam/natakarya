import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Natakarya — Task Management",
  description:
    "Organize your projects with visual Kanban boards. Collaborate with your team, track progress, and deliver results with Natakarya.",
  keywords: ["natakarya", "kanban", "project management", "task management", "collaboration", "agile"],
  openGraph: {
    title: "Natakarya",
    description: "Visual Task Management for High-Performing Teams",
    type: "website",
    locale: "en_US",
    siteName: "Natakarya",
  },
  twitter: {
    card: "summary_large_image",
    title: "Natakarya",
    description: "Visual Task Management for High-Performing Teams",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
