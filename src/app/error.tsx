"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AlertCircle, RotateCcw, Compass } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-rose-200/20 blur-3xl pointer-events-none"></div>

      <Header />

      <main className="flex-1 flex items-center justify-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="glass-panel border border-slate-200/60 rounded-3xl p-8 sm:p-12 text-center max-w-md w-full shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mx-auto shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full uppercase tracking-wider">
              System Error
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-800 tracking-tight leading-tight">
              Something Went Wrong
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              An unexpected error occurred while loading this page. Our team has been notified.
            </p>
            {error.digest && (
              <p className="text-[10px] text-slate-400 font-mono">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            <button
              onClick={() => reset()}
              className="px-6 py-3 rounded-2xl font-semibold text-white gradient-bg gradient-hover flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md shadow-indigo-150"
            >
              <RotateCcw className="w-4 h-4" />
              Try Reloading Page
            </button>

            <Link
              href="/"
              className="px-6 py-3 rounded-2xl font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              Go to Predictor Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
