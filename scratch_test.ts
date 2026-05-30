/* eslint-disable */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pcmEligibleBranches = [
  "B.Pharma",
  "Agri Sc.",
  "B.SC (Horticulture)",
  "Bio-Tech",
  "Forestry & Environmental Sciences",
  "B.F.Sc."
];

// Helper to simulate prediction logic
async function runPredictor(prisma: PrismaClient, params: {
  subGroup?: "PCM" | "PCB" | "PCMB";
  category: "UR" | "BC" | "EBC" | "SC" | "ST";
  rankType: "PCM" | "PCB";
  rankSubCategory: "UR" | "CAT" | "RCG" | "DQ" | "SMQ";
  rankValue: number;
}) {
  const { subGroup, category, rankType, rankSubCategory, rankValue } = params;

  const eligibleCategories: string[] = ["UR"];
  if (category === "BC") eligibleCategories.push("BC");
  else if (category === "EBC") eligibleCategories.push("EBC");
  else if (category === "SC") eligibleCategories.push("SC");
  else if (category === "ST") eligibleCategories.push("ST");
  if (category === "UR") eligibleCategories.push("EWS");

  if (rankSubCategory === "RCG") eligibleCategories.push("RCG");
  else if (rankSubCategory === "DQ") eligibleCategories.push("DQ");
  else if (rankSubCategory === "SMQ") eligibleCategories.push("SMQ");

  const whereClause: any = {
    allottedCat: { in: eligibleCategories },
    seatType: { in: ["GENERAL SEAT", "FEMALE SEAT"] },
  };

  if (rankType === "PCM") {
    whereClause.OR = [
      { allotmentGroup: "PCM" },
      {
        allotmentGroup: "PCB",
        branch: { name: { in: pcmEligibleBranches } }
      }
    ];
  } else {
    whereClause.allotmentGroup = "PCB";
  }

  if (subGroup && subGroup !== "PCMB") {
    if (subGroup === "PCM") {
      whereClause.branch = { name: { in: pcmEligibleBranches } };
    } else if (subGroup === "PCB") {
      if (whereClause.OR) delete whereClause.OR;
      whereClause.allotmentGroup = "PCB";
    }
  }

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
        const range = openingRank;
        const relative = range > 0 ? (openingRank - rankValue) / range : 0;
        chancePercentage = Math.round(90 + 9 * relative);
      } else if (rankValue <= closingRank) {
        chanceLevel = "MODERATE";
        const range = closingRank - openingRank;
        const relative = range > 0 ? (closingRank - rankValue) / range : 0.5;
        chancePercentage = Math.round(40 + 49 * relative);
      } else if (rankValue <= closingRank * 1.10) {
        chanceLevel = "LOW";
        const maxRank = closingRank * 1.10;
        const range = maxRank - closingRank;
        const relative = range > 0 ? (maxRank - rankValue) / range : 0.5;
        chancePercentage = Math.round(10 + 29 * relative);
      } else {
        return null;
      }

      chancePercentage = Math.max(5, Math.min(99, chancePercentage));

      return {
        id: cutoff.id,
        institute: cutoff.institute.shortName || cutoff.institute.name,
        branch: cutoff.branch.name,
        openingRank,
        closingRank,
        allottedCategory: cutoff.allottedCat,
        seatType: cutoff.seatType,
        chanceLevel,
        chancePercentage,
      };
    })
    .filter((p) => p !== null);

  return predictions.sort((a, b) => {
    const chanceOrder = { HIGH: 1, MODERATE: 2, LOW: 3 };
    const diff = chanceOrder[a.chanceLevel] - chanceOrder[b.chanceLevel];
    if (diff !== 0) return diff;
    return a.closingRank - b.closingRank;
  });
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("==================================================");
  console.log("🔍 BCECE PREDICTION ENGINE TEST SUITE");
  console.log("==================================================");

  // Test Case 1: The user's screenshot request
  // PCMB candidate, BC category, PCM Rank, UR SubCategory, Rank 101
  console.log("\nTEST CASE 1: PCMB Candidate (BC Category, PCM UR Rank 101)");
  console.log("--------------------------------------------------");
  const predictions1 = await runPredictor(prisma, {
    subGroup: "PCMB",
    category: "BC",
    rankType: "PCM",
    rankSubCategory: "UR",
    rankValue: 101,
  });
  console.log(`Found ${predictions1.length} predicted options.`);
  predictions1.slice(0, 5).forEach((p) => {
    console.log(`- ${p.institute} | ${p.branch} (${p.seatType})`);
    console.log(`  Chance: ${p.chanceLevel} (${p.chancePercentage}%) | Cutoff: ${p.openingRank} - ${p.closingRank} (Seat Cat: ${p.allottedCategory})`);
  });

  // Verify that B.Pharma and Agri Sc seats appear in the results for PCM candidates
  const hasPharma = predictions1.some(p => p.branch === "B.Pharma");
  const hasAgri = predictions1.some(p => p.branch === "Agri Sc.");
  console.log(`\nVerification: Has B.Pharma? ${hasPharma ? "✅ YES" : "❌ NO"}`);
  console.log(`Verification: Has Agriculture? ${hasAgri ? "✅ YES" : "❌ NO"}`);

  // Test Case 2: Pragati Singh (BC Category, PCB UR Rank 1)
  console.log("\nTEST CASE 2: Pragati Singh (BC Category, PCB UR Rank 1)");
  console.log("--------------------------------------------------");
  const predictions2 = await runPredictor(prisma, {
    subGroup: "PCMB",
    category: "BC",
    rankType: "PCB",
    rankSubCategory: "UR",
    rankValue: 1,
  });
  const nmchNursing = predictions2.find(p => p.institute.includes("NMCH") && p.branch === "B.Sc. Nursing");
  if (nmchNursing) {
    console.log(`✅ Pragati's actual allotment (NMCH Patna, B.Sc. Nursing) predicted successfully!`);
    console.log(`  Details: Chance ${nmchNursing.chanceLevel} (${nmchNursing.chancePercentage}%) | Cutoff: ${nmchNursing.openingRank} - ${nmchNursing.closingRank}`);
  } else {
    console.log("❌ Pragati's actual allotment was not predicted!");
  }

  // Test Case 3: Abhinandan Prasad (EB Category, PCM DQ Rank 71)
  console.log("\nTEST CASE 3: Abhinandan Prasad (EB Category, PCM DQ Rank 71)");
  console.log("--------------------------------------------------");
  const predictions3 = await runPredictor(prisma, {
    subGroup: "PCM",
    category: "EBC", // EB matches EBC
    rankType: "PCM",
    rankSubCategory: "DQ",
    rankValue: 71,
  });
  const mitPharma = predictions3.find(p => p.institute.includes("M.I.T") && p.branch === "B.Pharma" && p.allottedCategory === "DQ");
  if (mitPharma) {
    console.log(`✅ Abhinandan's actual allotment (MIT Muzaffarpur, B.Pharma under DQ) predicted successfully!`);
    console.log(`  Details: Chance ${mitPharma.chanceLevel} (${mitPharma.chancePercentage}%) | Cutoff: ${mitPharma.openingRank} - ${mitPharma.closingRank}`);
  } else {
    console.log("❌ Abhinandan's actual allotment was not predicted!");
  }

  // Test Case 4: Karan Kumar (SC Category, PCB UR Rank 26)
  console.log("\nTEST CASE 4: Karan Kumar (SC Category, PCB UR Rank 26)");
  console.log("--------------------------------------------------");
  const predictions4 = await runPredictor(prisma, {
    subGroup: "PCB",
    category: "SC",
    rankType: "PCB",
    rankSubCategory: "UR",
    rankValue: 26,
  });
  const bcpoPhT = predictions4.find(p => p.institute.includes("B.C.P.O.") && p.branch === "B.Ph.T.");
  if (bcpoPhT) {
    console.log(`✅ Karan's actual allotment (BCPO Patna, B.Ph.T.) predicted successfully!`);
    console.log(`  Details: Chance ${bcpoPhT.chanceLevel} (${bcpoPhT.chancePercentage}%) | Cutoff: ${bcpoPhT.openingRank} - ${bcpoPhT.closingRank}`);
  } else {
    console.log("❌ Karan's actual allotment was not predicted!");
  }

  await pool.end();
  console.log("\n==================================================");
  console.log("✅ ALL PREDICTION VERIFICATION TESTS COMPLETED!");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
