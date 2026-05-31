import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CutoffAnalyzerContainer } from "@/components/CutoffAnalyzerContainer";
import { prisma } from "@/lib/prisma";
import { Search } from "lucide-react";

export const revalidate = 3600; // Cache page for 1 hour

interface CutoffRow {
  id: string;
  allotmentGroup: string;
  allottedCat: string;
  seatType: string;
  openingRank: number;
  closingRank: number;
  totalSeats: number;
  institute: {
    id: string;
    name: string;
    shortName: string | null;
    location: string | null;
  };
  branch: {
    id: string;
    name: string;
    fullName: string | null;
  };
}

interface CollegeItem {
  id: string;
  name: string;
  shortName: string | null;
}

interface BranchItem {
  id: string;
  name: string;
}

export default async function CutoffsPage() {
  let cutoffs: CutoffRow[] = [];
  let colleges: CollegeItem[] = [];
  let branches: BranchItem[] = [];

  try {
    const [fetchedCutoffs, fetchedColleges, fetchedBranches] = await Promise.all([
      prisma.cutoff.findMany({
        include: {
          institute: true,
          branch: true,
        },
        orderBy: [
          { institute: { name: "asc" } },
          { branch: { name: "asc" } },
          { closingRank: "asc" },
        ],
      }),
      prisma.institute.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.branch.findMany({
        orderBy: { name: "asc" },
      }),
    ]);
    cutoffs = fetchedCutoffs;
    colleges = fetchedColleges;
    branches = fetchedBranches;
  } catch {
    console.warn("Note: Database not reachable during build prerendering. Cutoffs page will revalidate at runtime.");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/20 blur-3xl pointer-events-none"></div>

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-extrabold text-slate-800 tracking-tight leading-tight">
                Historical Cutoff Analyzer
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Analyze and query opening and closing ranks for BCECE 2025 Joint Counseling seats
              </p>
            </div>
          </div>
        </div>

        {/* Cutoff Analyzer Container */}
        <CutoffAnalyzerContainer
          initialCutoffs={cutoffs}
          colleges={colleges}
          branches={branches}
        />
      </main>

      <Footer />
    </div>
  );
}
