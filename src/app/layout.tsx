import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/layout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TalentDash — India's Career Intelligence Platform",
  description:
    "Compare salaries, research companies, read reviews, and discover interview experiences. India's largest career intelligence platform for tech professionals.",
  keywords: [
    "salary comparison",
    "tech salaries India",
    "company reviews",
    "interview experiences",
    "career intelligence",
    "compensation data",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
