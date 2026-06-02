import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

// Simple CSV line parser that respects double quotes
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseRank(rankStr: string | undefined): number | null {
  if (!rankStr) return null;
  const cleaned = rankStr.trim();
  if (!cleaned || cleaned === "" || cleaned === "null") return null;
  const match = cleaned.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

// Inferences for Institute Location and Type
function inferLocation(name: string): string {
  const nameUpper = name.toUpperCase();
  if (nameUpper.includes("PATNA")) return "Patna";
  if (nameUpper.includes("BHAGALPUR")) return "Bhagalpur";
  if (nameUpper.includes("MUZAFFARPUR") || nameUpper.includes("MIT")) return "Muzaffarpur";
  if (nameUpper.includes("GAYA")) return "Gaya";
  if (nameUpper.includes("DARBHANGA") || nameUpper.includes("DMCH")) return "Darbhanga";
  if (nameUpper.includes("SABOUR")) return "Sabour";
  if (nameUpper.includes("NALANDA")) return "Nalanda";
  if (nameUpper.includes("SAHARSA")) return "Saharsa";
  if (nameUpper.includes("PURNEA")) return "Purnea";
  if (nameUpper.includes("BEGUSARAI")) return "Begusarai";
  if (nameUpper.includes("MOTIHARI")) return "Motihari";
  if (nameUpper.includes("CHAMPARAN")) return "Champaran";
  if (nameUpper.includes("DARBHANGA")) return "Darbhanga";
  if (nameUpper.includes("MUNGER")) return "Munger";
  if (nameUpper.includes("SHEIKHPURA")) return "Sheikhpura";
  if (nameUpper.includes("KISstructuralHANGAJ") || nameUpper.includes("KISHANGANJ")) return "Kishanganj";
  return "Bihar";
}

function inferType(name: string): string {
  const nameUpper = name.toUpperCase();
  if (
    nameUpper.includes("PRIVATE") ||
    nameUpper.includes("SELF-FINANCE") ||
    nameUpper.includes("SELF FINANCE") ||
    nameUpper.includes("SF")
  ) {
    return "Self-Finance";
  }
  return "Government";
}

function getShortName(name: string): string {
  let cleaned = name.replace(/"/g, "").trim();
  // Remove "B.SC. NURSING COLLEGE" or similar prefix for cleaner display
  cleaned = cleaned.replace(/^B\.SC\.\s*NURSING\s*COLLEGE,?\s*/i, "Nursing College ");
  cleaned = cleaned.replace(/^B\.SC\.\s*NURSING\s*COLLEGE\s*/i, "Nursing College ");
  cleaned = cleaned.replace(/DMCH\.,?\s*/i, "DMCH ");
  cleaned = cleaned.replace(/SKMCH,?\s*/i, "SKMCH ");
  cleaned = cleaned.replace(/JLNMCH\.,?\s*/i, "JLNMCH ");
  cleaned = cleaned.replace(/N\.M\.C\.H,?\s*/i, "NMCH ");
  cleaned = cleaned.replace(/ANMMCH\.,?\s*/i, "ANMMCH ");
  return cleaned;
}

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Neither DIRECT_URL nor DATABASE_URL is defined in the environment.");
  }
  
  console.log("Initializing database connection pool for seeding...");
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Reading CSV file...");
  const csvPath = path.join(process.cwd(), "REVISED_PCMB-Joint_1st_Round_Allotment_16082025.xlsx.csv");
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at: ${csvPath}`);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== "");
  const headers = parseCsvLine(lines[0]);
  
  console.log(`CSV Headers: ${headers.join(", ")}`);
  console.log(`Found ${lines.length - 1} records to seed.`);

  interface ParsedRow {
    subGroup: string;
    category: string;
    pcmUrRank: number | null;
    pcmCatRank: number | null;
    pcmRcgRank: number | null;
    pcmDqRank: number | null;
    pcmSmqRank: number | null;
    pcbUrRank: number | null;
    pcbCatRank: number | null;
    pcbRcgRank: number | null;
    pcbDqRank: number | null;
    pcbSmqRank: number | null;
    instituteName: string;
    branchName: string;
    allottedCat: string;
    seatType: string;
    remark: string | null;
    allotmentGroup: string;
    year: number;
    round: number;
  }
  const uniqueInstitutes = new Set<string>();
  const branchGroups = new Map<string, Set<string>>();
  const parsedRows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 24) continue;

    const [
      , , , , sub_group, , , category,
      pcm_ur_rank, pcm_cat_rank, pcm_rcg_rank, pcm_dq_rank, pcm_smq_rank,
      pcb_ur_rank, pcb_cat_rank, pcb_rcg_rank, pcb_dq_rank, pcb_smq_rank,
      institute, branch, allotted_cat, seat_type, remark, allotment_group
    ] = cols;

    uniqueInstitutes.add(institute);
    
    if (!branchGroups.has(branch)) {
      branchGroups.set(branch, new Set());
    }
    branchGroups.get(branch)!.add(allotment_group);

    parsedRows.push({
      subGroup: sub_group,
      category,
      pcmUrRank: parseRank(pcm_ur_rank),
      pcmCatRank: parseRank(pcm_cat_rank),
      pcmRcgRank: parseRank(pcm_rcg_rank),
      pcmDqRank: parseRank(pcm_dq_rank),
      pcmSmqRank: parseRank(pcm_smq_rank),
      pcbUrRank: parseRank(pcb_ur_rank),
      pcbCatRank: parseRank(pcb_cat_rank),
      pcbRcgRank: parseRank(pcb_rcg_rank),
      pcbDqRank: parseRank(pcb_dq_rank),
      pcbSmqRank: parseRank(pcb_smq_rank),
      instituteName: institute,
      branchName: branch,
      allottedCat: allotted_cat,
      seatType: seat_type,
      remark: remark || null,
      allotmentGroup: allotment_group,
      year: 2025,
      round: 1
    });
  }

  console.log(`Unique Institutes found: ${uniqueInstitutes.size}`);
  console.log(`Unique Branches found: ${branchGroups.size}`);

  // Clear existing database records
  console.log("Clearing existing database records...");
  await prisma.cutoff.deleteMany();
  await prisma.allotment.deleteMany();
  await prisma.institute.deleteMany();
  await prisma.branch.deleteMany();

  // 2. Seed Institutes
  console.log("Seeding Institutes...");
  const instituteMap = new Map<string, string>(); // name -> id
  const instituteData = Array.from(uniqueInstitutes).map(name => ({
    name,
    shortName: getShortName(name),
    location: inferLocation(name),
    type: inferType(name),
  }));

  for (const inst of instituteData) {
    const created = await prisma.institute.create({
      data: inst
    });
    instituteMap.set(inst.name, created.id);
  }
  console.log("Institutes seeded successfully.");

  // 3. Seed Branches
  console.log("Seeding Branches...");
  const branchMap = new Map<string, string>(); // name -> id
  for (const [branchName, groups] of branchGroups.entries()) {
    let group = "BOTH";
    if (groups.size === 1) {
      group = Array.from(groups)[0];
    }
    const created = await prisma.branch.create({
      data: {
        name: branchName,
        fullName: branchName,
        group: group
      }
    });
    branchMap.set(branchName, created.id);
  }
  console.log("Branches seeded successfully.");

  // 4. Seed Allotments
  console.log("Seeding Allotments...");
  const allotmentsData = parsedRows.map(row => ({
    subGroup: row.subGroup,
    category: row.category,
    pcmUrRank: row.pcmUrRank,
    pcmCatRank: row.pcmCatRank,
    pcmRcgRank: row.pcmRcgRank,
    pcmDqRank: row.pcmDqRank,
    pcmSmqRank: row.pcmSmqRank,
    pcbUrRank: row.pcbUrRank,
    pcbCatRank: row.pcbCatRank,
    pcbRcgRank: row.pcbRcgRank,
    pcbDqRank: row.pcbDqRank,
    pcbSmqRank: row.pcbSmqRank,
    instituteId: instituteMap.get(row.instituteName)!,
    branchId: branchMap.get(row.branchName)!,
    allottedCat: row.allottedCat,
    seatType: row.seatType,
    remark: row.remark,
    allotmentGroup: row.allotmentGroup,
    year: row.year,
    round: row.round
  }));

  // Batch insert allotments
  const batchSize = 200;
  for (let i = 0; i < allotmentsData.length; i += batchSize) {
    const batch = allotmentsData.slice(i, i + batchSize);
    await prisma.allotment.createMany({
      data: batch
    });
  }
  console.log(`Seeded ${allotmentsData.length} allotments.`);

  // 5. Compute and Seed Cutoffs
  console.log("Computing and Seeding Cutoffs...");
  
  // Helper to determine the relevant rank for an allotment row
  function getRankValue(row: typeof allotmentsData[0]): number | null {
    const group = row.allotmentGroup;
    const cat = row.allottedCat;
    
    if (group === "PCM") {
      if (cat === "UR") return row.pcmUrRank;
      if (cat === "RCG") return row.pcmRcgRank;
      if (cat === "DQ") return row.pcmDqRank;
      if (cat === "SMQ") return row.pcmSmqRank;
      return row.pcmCatRank; // BC, EBC, SC, ST, EWS
    } else {
      if (cat === "UR") return row.pcbUrRank;
      if (cat === "RCG") return row.pcbRcgRank;
      if (cat === "DQ") return row.pcbDqRank;
      if (cat === "SMQ") return row.pcbSmqRank;
      return row.pcbCatRank; // BC, EBC, SC, ST, EWS
    }
  }

  // Group by: instituteId + branchId + allotmentGroup + allottedCat + seatType + year + round
  const groupsMap = new Map<string, {
    instituteId: string;
    branchId: string;
    allotmentGroup: string;
    allottedCat: string;
    seatType: string;
    ranks: number[];
  }>();

  for (const row of allotmentsData) {
    const rankVal = getRankValue(row);
    if (rankVal === null) continue; // Skip if no rank data for this seat type

    const key = `${row.instituteId}_${row.branchId}_${row.allotmentGroup}_${row.allottedCat}_${row.seatType}`;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        instituteId: row.instituteId,
        branchId: row.branchId,
        allotmentGroup: row.allotmentGroup,
        allottedCat: row.allottedCat,
        seatType: row.seatType,
        ranks: []
      });
    }
    groupsMap.get(key)!.ranks.push(rankVal);
  }

  const cutoffsData = Array.from(groupsMap.values()).map(g => {
    const sortedRanks = g.ranks.sort((a, b) => a - b);
    return {
      instituteId: g.instituteId,
      branchId: g.branchId,
      allotmentGroup: g.allotmentGroup,
      allottedCat: g.allottedCat,
      seatType: g.seatType,
      openingRank: sortedRanks[0],
      closingRank: sortedRanks[sortedRanks.length - 1],
      totalSeats: sortedRanks.length,
      year: 2025,
      round: 1
    };
  });

  // Batch insert cutoffs
  for (let i = 0; i < cutoffsData.length; i += batchSize) {
    const batch = cutoffsData.slice(i, i + batchSize);
    await prisma.cutoff.createMany({
      data: batch
    });
  }
  
  console.log(`Computed and seeded ${cutoffsData.length} cutoff entries.`);
  
  await pool.end();
  console.log("Seeding completed successfully! 🚀");
}

main().catch(err => {
  console.error("Seeding failed with error:", err);
  process.exit(1);
});
