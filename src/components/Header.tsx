"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Award, Compass, Info, Search } from "lucide-react";

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
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white shadow-md shadow-indigo-200 transition-all duration-300 group-hover:scale-105">
            <Award className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg leading-tight tracking-tight text-slate-800">
              BCECE <span className="gradient-text">Predictor</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
              Bihar Admission 2026
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
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white gradient-bg rounded-xl shadow-md shadow-indigo-150 hover:shadow-lg hover:shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            Predict Now
          </Link>
          
          {/* Mobile menu toggle (simple fallback) */}
          <div className="md:hidden flex items-center gap-3">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`p-2 rounded-lg ${
                    isActive ? "text-indigo-600 bg-indigo-50" : "text-slate-500"
                  }`}
                  title={link.label}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
