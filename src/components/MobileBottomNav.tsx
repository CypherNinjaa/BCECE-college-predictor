"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Compass, Info, Search } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Predictor", icon: Compass },
    { href: "/colleges", label: "Colleges", icon: GraduationCap },
    { href: "/cutoffs", label: "Cutoffs", icon: Search },
    { href: "/about", label: "About", icon: Info },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 backdrop-blur-md border-t border-slate-250/50 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] px-3 py-1 flex items-center justify-around">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 select-none group"
          >
            <div
              className={`p-1.5 rounded-xl transition-all duration-250 ${
                isActive
                  ? "bg-indigo-50 text-indigo-600 scale-105 shadow-sm shadow-indigo-50/50"
                  : "text-slate-500 group-hover:text-slate-700"
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span
              className={`text-[9px] font-extrabold tracking-tight transition-colors duration-200 ${
                isActive ? "text-indigo-600" : "text-slate-500 group-hover:text-slate-700"
              }`}
            >
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
export default MobileBottomNav;
