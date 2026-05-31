"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { GraduationCap, Compass, Info, Search, Send } from "lucide-react";

export function Header() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Predictor", icon: Compass },
    { href: "/colleges", label: "Colleges", icon: GraduationCap },
    { href: "/cutoffs", label: "Cutoff Analyzer", icon: Search },
    { href: "/about", label: "About & Info", icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-panel shadow-sm border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center h-12 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Study With Ritesh"
              width={160}
              height={50}
              priority
              className="h-9 sm:h-11 w-auto object-contain transition-all duration-300 group-hover:scale-102"
            />
          </div>
          <div className="hidden sm:block h-8 w-px bg-slate-200/80" />
          <div className="hidden sm:flex flex-col">
            <span className="font-display font-extrabold text-sm sm:text-base leading-tight tracking-tight text-slate-800">
              BCECE Predictor
            </span>
            <span className="text-[9px] sm:text-[10px] text-indigo-600 font-extrabold tracking-wider uppercase">
              2026 Edition
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600 font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons & Socials */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Social Icons (Desktop only) */}
          <div className="hidden lg:flex items-center gap-1.5 border-r border-slate-200 pr-3">
            <a
              href="https://www.youtube.com/@studywithritesh8678"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-650 transition-colors"
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

          <a
            href="https://studywithritesh.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[10px] sm:text-xs font-extrabold text-white gradient-bg rounded-xl shadow-md shadow-indigo-150 hover:shadow-lg hover:shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            Official Site
          </a>
        </div>
      </div>
    </header>
  );
}
