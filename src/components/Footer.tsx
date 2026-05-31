import Link from "next/link";
import Image from "next/image";
import { Send } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-b border-slate-100 pb-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative flex items-center h-12 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Study With Ritesh"
                  width={160}
                  height={50}
                  className="h-11 w-auto object-contain"
                />
              </div>
              <div className="h-8 w-px bg-slate-200/80" />
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-sm leading-tight tracking-tight text-slate-800">
                  Study With Ritesh
                </span>
                <span className="text-[9px] text-slate-500 font-extrabold tracking-wider uppercase">
                  Bihar Nursing & Medical Prep
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Empowering Bihar nursing & medical students with AI-powered college predictions, cutoff analyses, and expert counseling guidance.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3 justify-start md:items-center">
            <div className="flex gap-6 text-xs font-semibold text-slate-500">
              <Link href="/" className="hover:text-indigo-600 transition-colors">Predictor</Link>
              <Link href="/colleges" className="hover:text-indigo-600 transition-colors">Colleges</Link>
              <Link href="/cutoffs" className="hover:text-indigo-600 transition-colors">Cutoffs</Link>
              <Link href="/about" className="hover:text-indigo-600 transition-colors">About</Link>
            </div>
            <div className="flex gap-3 text-xs font-semibold text-slate-500">
              <a href="https://studywithritesh.in/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">Official Website</a>
            </div>
          </div>

          {/* Social Channels */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="flex items-center gap-3">
              <a
                href="https://www.youtube.com/@studywithritesh8678"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition-colors"
                title="Study With Ritesh YouTube"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
              </a>
              <a
                href="https://t.me/Studywithritesh"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors"
                title="Study With Ritesh Telegram"
              >
                <Send className="w-3.5 h-3.5 -translate-x-0.5" />
              </a>
              <a
                href="https://www.instagram.com/study_with_ritesh/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-pink-650 transition-colors"
                title="Study With Ritesh Instagram"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
            <span className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} Study With Ritesh. All rights reserved.
            </span>
          </div>
        </div>

        {/* Counseling Disclaimer */}
        <div className="pt-6 text-[11px] text-slate-400 leading-relaxed text-center max-w-4xl mx-auto">
          <p className="font-semibold text-slate-500 mb-1">⚠️ IMPORTANT DISCLAIMER</p>
          Predictions provided by this tool are for general guidance and educational purposes only. Results are calculated using statistical analysis of BCECE 2025 Round-1 allotment cutoffs. Actual 2026 seat allotments, counseling rules, reservations, and closing ranks depend on real-time factors including student preferences, seat capacity, exam difficulty, and guidelines set by the Bihar Combined Entrance Competitive Examination Board (BCECEB). This tool is not affiliated with the BCECE Board or any government agency.
        </div>
      </div>
    </footer>
  );
}
