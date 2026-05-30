import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
            { closingRank: "asc" },
          ],
        },
      },
    });

    if (!college) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    const response = NextResponse.json({ success: true, data: college });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );
    return response;
  } catch (error) {
    console.error("College detail API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
