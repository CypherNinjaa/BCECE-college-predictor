import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PredictorContainer } from "@/components/PredictorContainer";
import { prisma } from "@/lib/prisma";
import { Building2, GraduationCap, Users2, CheckCircle2 } from "lucide-react";

export const revalidate = 3600; // Cache page for 1 hour

interface Institute {
  id: string;
  name: string;
  shortName: string | null;
  location: string | null;
  type: string | null;
}

interface Branch {
  id: string;
  name: string;
  fullName: string | null;
  group: string;
}

export default async function Home() {
  let colleges: Institute[] = [];
  let branches: Branch[] = [];
  let collegesCount = 0;
  let branchesCount = 0;
  let allotmentsCount = 0;

  try {
    const [fetchedColleges, fetchedBranches, countColleges, countBranches, countAllotments] =
      await Promise.all([
        prisma.institute.findMany({
          orderBy: { name: "asc" },
        }),
        prisma.branch.findMany({
          orderBy: { name: "asc" },
        }),
        prisma.institute.count(),
        prisma.branch.count(),
        prisma.allotment.count(),
      ]);
    colleges = fetchedColleges;
    branches = fetchedBranches;
    collegesCount = countColleges;
    branchesCount = countBranches;
    allotmentsCount = countAllotments;
  } catch {
    console.warn("Note: Database not reachable during build prerendering. Home page will revalidate at runtime.");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Decorative background vectors */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/20 blur-3xl pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-200/25 blur-3xl pointer-events-none"></div>

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-indigo-600 bg-indigo-50/80 border border-indigo-100/50">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Bihar government counseling predictor • 100% Free</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Study With Ritesh <br />
            BCECE <span className="gradient-text">Predictor 2026</span>
          </h1>

          <p className="text-slate-500 text-base sm:text-lg leading-relaxed font-medium">
            Enter your rank and get instant, data-backed predictions for Bihar engineering,
            nursing, agriculture, and pharmacy colleges. Backed by expert guidance from Study With Ritesh.
          </p>
        </div>

        {/* Statistical Badges Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            {
              label: "Participating Colleges",
              value: collegesCount,
              icon: Building2,
              color: "text-indigo-600 bg-indigo-50",
            },
            {
              label: "Available Branches",
              value: branchesCount,
              icon: GraduationCap,
              color: "text-cyan-600 bg-cyan-50",
            },
            {
              label: "Analyzed Seats",
              value: allotmentsCount,
              icon: Users2,
              color: "text-emerald-600 bg-emerald-50",
            },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-extrabold text-slate-800 leading-none">
                    {stat.value}
                  </span>
                  <span className="text-xs text-slate-450 font-bold mt-1 tracking-wide uppercase">
                    {stat.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Predictor Form & Container */}
        <PredictorContainer colleges={colleges} branches={branches} />
      </main>

      <Footer />
    </div>
  );
}
