import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { predictRequestSchema } from "@/lib/validators";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = predictRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: result.error.format() },
        { status: 400 }
      );
    }

    const {
      subGroup,
      category,
      rankType,
      rankSubCategory,
      rankValue,
      branches,
      institutes,
    } = result.data;

    // Determine eligible allotted categories — only show the user's selected category seats
    const eligibleCategories: string[] = [category];

    // Add special reservation category if rank subcategory matches it
    if (rankSubCategory === "RCG") {
      eligibleCategories.push("RCG");
    } else if (rankSubCategory === "DQ") {
      eligibleCategories.push("DQ");
    } else if (rankSubCategory === "SMQ") {
      eligibleCategories.push("SMQ");
    }

    const pcmEligibleBranches = [
      "B.Pharma",
      "Agri Sc.",
      "B.SC (Horticulture)",
      "Bio-Tech",
      "Forestry & Environmental Sciences",
      "B.F.Sc."
    ];

    // Build the query where clause
    const whereClause: Prisma.CutoffWhereInput = {
      allottedCat: { in: eligibleCategories },
      seatType: { in: ["GENERAL SEAT", "FEMALE SEAT"] },
    };

    // Restrict based on rankType (PCM rank is compared to PCM/joint-PCM cutoffs, PCB to PCB)
    if (rankType === "PCM") {
      whereClause.OR = [
        { allotmentGroup: "PCM" },
        {
          allotmentGroup: "PCB",
          branch: {
            name: { in: pcmEligibleBranches }
          }
        }
      ];
    } else {
      whereClause.allotmentGroup = "PCB";
    }

    // Filter by specific branches/institutes if provided
    if (branches && branches.length > 0) {
      if (whereClause.branch) {
        const existingName = whereClause.branch.name;
        whereClause.branch = {
          id: { in: branches },
          ...(existingName ? { name: existingName } : {})
        };
      } else {
        whereClause.branch = {
          id: { in: branches }
        };
      }
    }

    if (institutes && institutes.length > 0) {
      whereClause.instituteId = { in: institutes };
    }

    // We fetch cutoffs that are eligible for prediction
    whereClause.closingRank = { gte: Math.floor(rankValue / 1.10) };

    const cutoffs = await prisma.cutoff.findMany({
      where: whereClause,
      include: {
        institute: true,
        branch: true,
      },
      orderBy: [
        { openingRank: "asc" },
        { closingRank: "asc" },
      ],
    });

    const predictions = cutoffs
      .map((cutoff) => {
        let chanceLevel: "HIGH" | "MODERATE" | "LOW" = "LOW";
        let chancePercentage = 0;

        const { openingRank, closingRank } = cutoff;

        if (rankValue <= openingRank) {
          chanceLevel = "HIGH";
          // High chance: 90% - 99%
          const range = openingRank;
          const relative = range > 0 ? (openingRank - rankValue) / range : 0;
          chancePercentage = Math.round(90 + 9 * relative);
        } else if (rankValue <= closingRank) {
          chanceLevel = "MODERATE";
          // Moderate chance: 40% - 89%
          const range = closingRank - openingRank;
          const relative = range > 0 ? (closingRank - rankValue) / range : 0.5;
          chancePercentage = Math.round(40 + 49 * relative);
        } else if (rankValue <= closingRank * 1.10) {
          chanceLevel = "LOW";
          // Low chance: 10% - 39%
          const maxRank = closingRank * 1.10;
          const range = maxRank - closingRank;
          const relative = range > 0 ? (maxRank - rankValue) / range : 0.5;
          chancePercentage = Math.round(10 + 29 * relative);
        } else {
          return null; // Excluded (too high rank)
        }

        // Clip chance percentage between 5% and 99%
        chancePercentage = Math.max(5, Math.min(99, chancePercentage));

        return {
          id: cutoff.id,
          institute: {
            id: cutoff.institute.id,
            name: cutoff.institute.name,
            shortName: cutoff.institute.shortName || cutoff.institute.name,
            location: cutoff.institute.location || "Bihar",
            type: cutoff.institute.type || "Government",
          },
          branch: {
            id: cutoff.branch.id,
            name: cutoff.branch.name,
            fullName: cutoff.branch.fullName || cutoff.branch.name,
          },
          openingRank,
          closingRank,
          totalSeats: cutoff.totalSeats,
          allottedCategory: cutoff.allottedCat,
          seatType: cutoff.seatType,
          chanceLevel,
          chancePercentage,
          round: cutoff.round,
        };
      })
      .filter((p) => p !== null);

    // Sort: HIGH -> MODERATE -> LOW, then by closingRank asc (best colleges first)
    const sortedPredictions = predictions.sort((a, b) => {
      const chanceOrder = { HIGH: 1, MODERATE: 2, LOW: 3 };
      const diff = chanceOrder[a.chanceLevel] - chanceOrder[b.chanceLevel];
      if (diff !== 0) return diff;
      return a.closingRank - b.closingRank;
    });

    const disclaimer =
      "Predictions are based on BCECE 2025 Round-1 and Round-2 allotment/cutoff data. Actual 2026 cutoffs may vary based on applicants, seat changes, reservation updates, and other factors. Use this tool for guidance only — it does not guarantee admission.";

    return NextResponse.json({
      success: true,
      data: {
        predictions: sortedPredictions,
        totalMatches: sortedPredictions.length,
        disclaimer,
      },
    });
  } catch (error) {
    console.error("Predict API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
