import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HelpCircle, ChevronRight, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-200/20 blur-3xl pointer-events-none"></div>

      <Header />

      <main className="flex-1 flex items-center justify-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="glass-panel border border-slate-200/60 rounded-3xl p-8 sm:p-12 text-center max-w-md w-full shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto shadow-sm">
            <HelpCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">
              Error 404
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-800 tracking-tight leading-tight">
              Page Not Found
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              We couldn&apos;t find the page you are looking for. It might have been moved, deleted, or is temporarily unavailable.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            <Link
              href="/"
              className="px-6 py-3 rounded-2xl font-semibold text-white gradient-bg gradient-hover flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md shadow-indigo-150"
            >
              <Compass className="w-4 h-4" />
              Go to Predictor Home
              <ChevronRight className="w-4 h-4" />
            </Link>

            <Link
              href="/colleges"
              className="px-6 py-3 rounded-2xl font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm"
            >
              Browse Participating Colleges
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
