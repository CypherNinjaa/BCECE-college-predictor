import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { MobileBottomNav } from "@/components/MobileBottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bcececollege-predictor.vercel.app"),
  title: "Study With Ritesh | BCECE College Predictor 2026",
  description:
    "Predict your Bihar BCECE colleges based on 2025 cutoff ranks. Includes PCM/PCB rank analysis, reservation category filters, and detailed college closing ranks. Guided by Study With Ritesh coaching.",
  keywords: [
    "BCECE",
    "BCECE Predictor",
    "BCECE College Predictor",
    "Study With Ritesh",
    "Ritesh Sir",
    "Bihar Nursing College Predictor",
    "Bihar College Predictor 2026",
    "BCECE Cutoffs 2025",
    "BCECE Joint Counseling",
  ],
  openGraph: {
    title: "Study With Ritesh | BCECE College Predictor 2026",
    description:
      "Predict your Bihar nursing, engineering, agriculture, and pharmacy allotments based on historical counseling data. Guided by Study With Ritesh coaching.",
    url: "https://bcececollege-predictor.vercel.app",
    siteName: "Study With Ritesh Predictor",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BCECE College Predictor 2026",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <head>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 font-medium pb-16 md:pb-0">
        {children}
        <MobileBottomNav />
      </body>
    </html>
  );
}
