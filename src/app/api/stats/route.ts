import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      collegesCount,
      branchesCount,
      allotmentsCount,
      pcmCount,
      pcbCount,
    ] = await Promise.all([
      prisma.institute.count(),
      prisma.branch.count(),
      prisma.allotment.count(),
      prisma.allotment.count({ where: { allotmentGroup: "PCM" } }),
      prisma.allotment.count({ where: { allotmentGroup: "PCB" } }),
    ]);

    const data = {
      collegesCount,
      branchesCount,
      allotmentsCount,
      groupDistribution: {
        PCM: pcmCount,
        PCB: pcbCount,
      },
    };

    const response = NextResponse.json({ success: true, data });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );
    return response;
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
