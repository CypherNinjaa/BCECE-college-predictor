import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CollegeDetailContainer } from "@/components/CollegeDetailContainer";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const revalidate = 3600; // Cache page for 1 hour

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CollegeDetailPage({ params }: PageProps) {
  const { id } = await params;

  const college = await prisma.institute.findUnique({
    where: { id },
    include: {
      cutoffs: {
        include: {
          branch: true,
        },
        orderBy: [
          { allotmentGroup: "asc" },
          { branch: { name: "asc" } },
          { closingRank: "asc" },
        ],
      },
    },
  });

  if (!college) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/20 blur-3xl pointer-events-none"></div>

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <CollegeDetailContainer college={college} cutoffs={college.cutoffs} />
      </main>

      <Footer />
    </div>
  );
}
