import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BCECE College Predictor 2026 | Bihar Engineering & Medical Admission",
  description:
    "Predict your Bihar BCECE colleges based on 2025 cutoff ranks. Includes PCM/PCB rank analysis, reservation category filters, and detailed college closing ranks.",
  keywords: [
    "BCECE",
    "BCECE Predictor",
    "BCECE College Predictor",
    "Bihar College Predictor 2026",
    "BCECE Cutoffs 2025",
    "BCECE Joint Counseling",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
        {children}
      </body>
    </html>
  );
}
