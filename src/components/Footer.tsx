import Link from "next/link";
import { Award } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-b border-slate-100 pb-8">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white shadow-sm">
                <Award className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-base text-slate-800">
                BCECE <span className="gradient-text">Predictor</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 max-w-sm">
              Helping students navigate Bihar Joint Entrance Competitive Examination (BCECE) engineering, nursing, and agriculture counseling predictions.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex gap-6 justify-start md:justify-center text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-slate-800 transition-colors">Predictor</Link>
            <Link href="/colleges" className="hover:text-slate-800 transition-colors">Colleges List</Link>
            <Link href="/cutoffs" className="hover:text-slate-800 transition-colors">Cutoff Analyzer</Link>
            <Link href="/about" className="hover:text-slate-800 transition-colors">Counseling Info</Link>
          </div>

          {/* Copyright / GitHub */}
          <div className="flex flex-col items-start md:items-end gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              Made with ❤️ for BCECE Aspirants
            </span>
            <span className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} BCECE Predictor. All rights reserved.
            </span>
          </div>
        </div>

        {/* Counseling Disclaimer */}
        <div className="pt-6 text-[11px] text-slate-400 leading-relaxed text-center max-w-4xl mx-auto">
          <p className="font-medium text-slate-500 mb-1">⚠️ IMPORTANT DISCLAIMER</p>
          Predictions provided by this tool are for general guidance and educational purposes only. Results are calculated using statistical analysis of BCECE 2025 Round-1 allotment cutoffs. Actual 2026 seat allotments, counseling rules, reservations, and closing ranks depend on real-time factors including student preferences, seat capacity, exam difficulty, and guidelines set by the Bihar Combined Entrance Competitive Examination Board (BCECEB). This tool does not guarantee admission or official counseling outcomes.
        </div>
      </div>
    </footer>
  );
}
