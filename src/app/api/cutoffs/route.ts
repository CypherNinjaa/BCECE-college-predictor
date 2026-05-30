import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    
    const instituteId = searchParams.get("instituteId");
    const branchId = searchParams.get("branchId");
    const allotmentGroup = searchParams.get("allotmentGroup");
    const allottedCat = searchParams.get("allottedCat");
    const seatType = searchParams.get("seatType");

    const where: Prisma.CutoffWhereInput = {};

    if (instituteId) where.instituteId = instituteId;
    if (branchId) where.branchId = branchId;
    if (allotmentGroup) where.allotmentGroup = allotmentGroup;
    if (allottedCat) where.allottedCat = allottedCat;
    if (seatType) where.seatType = seatType;

    const cutoffs = await prisma.cutoff.findMany({
      where,
      include: {
        institute: true,
        branch: true,
      },
      orderBy: [
        { institute: { name: "asc" } },
        { branch: { name: "asc" } },
        { closingRank: "asc" },
      ],
    });

    const response = NextResponse.json({ success: true, data: cutoffs });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );
    return response;
  } catch (error) {
    console.error("Cutoffs API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
