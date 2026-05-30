import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CollegesListContainer } from "@/components/CollegesListContainer";
import { prisma } from "@/lib/prisma";
import { Building2 } from "lucide-react";

export const revalidate = 3600; // Cache page for 1 hour

export default async function CollegesPage() {
  const colleges = await prisma.institute.findMany({
    include: {
      cutoffs: {
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/20 blur-3xl pointer-events-none"></div>

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-extrabold text-slate-850 tracking-tight leading-tight">
                Participating Colleges
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Browse government and self-finance Bihar counseling colleges under BCECE
              </p>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-450 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200/30">
            Total participating: <span className="text-slate-700">{colleges.length} Institutes</span>
          </div>
        </div>

        {/* List of colleges with filters */}
        <CollegesListContainer colleges={colleges} />
      </main>

      <Footer />
    </div>
  );
}
