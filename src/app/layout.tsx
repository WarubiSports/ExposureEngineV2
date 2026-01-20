import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ExposureEngine | College Soccer Recruiting Visibility Analysis",
  description: "AI-powered college soccer recruiting tool. Get honest visibility scores for D1, D2, D3, NAIA, and JUCO with a personalized 90-day action plan.",
  keywords: ["college soccer recruiting", "soccer visibility score", "D1 soccer", "ECNL", "MLS NEXT", "recruiting analysis"],
  openGraph: {
    title: "ExposureEngine | College Soccer Recruiting Analysis",
    description: "What level would a college coach put you at today? Get your AI-powered visibility score.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
