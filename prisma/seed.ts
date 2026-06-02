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

function cleanValue(val: string | undefined): string {
  if (!val) return "";
  let cleaned = val.trim();
  const prefixes = [
    /^REG NO\s+/i,
    /^ROLL NO SUB\s+/i,
    /^GROUP\s+/i,
    /^NAME\s+/i,
    /^GENDER\s+/i,
    /^CATEGORY\s+/i,
    /^UR RANK\s+/i,
    /^CAT RANK\s+/i,
    /^PCM RANK RCG RANK\s+/i,
    /^PCB RANK RCG RANK\s+/i,
    /^DQ RANK\s+/i,
    /^SMQ RANK\s+/i,
    /^INSTITUTE\s+/i,
    /^COURSE\s+/i,
    /^ALLOTTED CAT\s+/i,
    /^SEAT TYPE\s+/i,
    /^REMARK\s+/i,
    /^ALLOT STATUS\s+/i
  ];
  for (const prefix of prefixes) {
    cleaned = cleaned.replace(prefix, "");
  }
  return cleaned.trim();
}


// Inferences for Institute Location and Type
function inferLocation(name: string): string {
  const nameUpper = name.toUpperCase();
  
  // Specific checks
  if (nameUpper.includes("PATNA") || nameUpper.includes("BIHTA") || nameUpper.includes("NMCH")) return "Patna";
  if (nameUpper.includes("BAKHTIYARPUR")) return "Bakhtiyarpur";
  if (nameUpper.includes("BHAGALPUR") || nameUpper.includes("JLNMCH")) return "Bhagalpur";
  if (nameUpper.includes("MUZAFFARPUR") || nameUpper.includes("MIT") || nameUpper.includes("SKMCH")) return "Muzaffarpur";
  if (nameUpper.includes("GAYA") || nameUpper.includes("ANMMCH")) return "Gaya";
  if (nameUpper.includes("DARBHANGA") || nameUpper.includes("DMCH")) return "Darbhanga";
  if (nameUpper.includes("SABOUR")) return "Sabour";
  if (nameUpper.includes("NALANDA")) return "Nalanda";
  if (nameUpper.includes("SAHARSA")) return "Saharsa";
  if (nameUpper.includes("PURNEA")) return "Purnea";
  if (nameUpper.includes("BEGUSARAI")) return "Begusarai";
  if (nameUpper.includes("MOTIHARI")) return "Motihari";
  if (nameUpper.includes("WEST CHAMPARAN") || nameUpper.includes("W. CHAMPARAN") || nameUpper.includes("W CHAMPARAN")) return "West Champaran";
  if (nameUpper.includes("CHAMPARAN")) return "Champaran";
  if (nameUpper.includes("MUNGER")) return "Munger";
  if (nameUpper.includes("SHEIKHPURA")) return "Sheikhpura";
  if (nameUpper.includes("MADHEPURA")) return "Madhepura";
  
  // Add new engineering college locations
  const cities = [
    "ARA", "BHOJPUR", "SHEOHAR", "LAKHISARAI", "SAMASTIPUR", "ARWAL", 
    "AURANGABAD", "BANKA", "BUXAR", "GOPALGANJ", "JAMUI", "JEHANABAD",
    "KAIMUR", "KATIHAR", "KHAGARIA", "KISHANGANJ", "MADHUBANI",
    "POURNIA", "ROHTAS", "SASARAM", "SARAN", "CHAPRA", "SITAMARHI",
    "SIWAN", "SUPAUL", "VAISHALI", "NAWADA"
  ];
  
  for (const city of cities) {
    if (nameUpper.includes(city)) {
      return city.charAt(0) + city.slice(1).toLowerCase();
    }
  }
  
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
  cleaned = cleaned.replace(/^B\.SC\.\s*NURSING\s*COLLEGE,?\s*/i, "Nursing College ");
  cleaned = cleaned.replace(/^B\.SC\.\s*NURSING\s*COLLEGE\s*/i, "Nursing College ");
  cleaned = cleaned.replace(/DMCH\.,?\s*/i, "DMCH ");
  cleaned = cleaned.replace(/SKMCH,?\s*/i, "SKMCH ");
  cleaned = cleaned.replace(/JLNMCH\.,?\s*/i, "JLNMCH ");
  cleaned = cleaned.replace(/N\.M\.C\.H,?\s*/i, "NMCH ");
  cleaned = cleaned.replace(/ANMMCH\.,?\s*/i, "ANMMCH ");
  
  // Engineering cleanups
  cleaned = cleaned.replace(/GOVT\.?\s*ENGG\.?\s*COLLEGE,?\s*/i, "GEC ");
  cleaned = cleaned.replace(/GOVERNMENT\s*ENGINEERING\s*COLLEGE,?\s*/i, "GEC ");
  cleaned = cleaned.replace(/B\.C\.E\.\s*/i, "BCE ");
  cleaned = cleaned.replace(/B\.P\.M\.C\.E\.\s*/i, "BPMCE ");
  cleaned = cleaned.replace(/D\.C\.E\.\s*/i, "DCE ");
  cleaned = cleaned.replace(/G\.C\.E\.\s*/i, "GCE ");
  
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

  interface ParsedEngineeringCutoff {
    instituteName: string;
    branchName: string;
    allotmentGroup: string;
    allottedCat: string;
    seatType: string;
    openingRank: number;
    closingRank: number;
    totalSeats: number;
    year: number;
    round: number;
  }

  const uniqueInstitutes = new Set<string>();
  const branchGroups = new Map<string, Set<string>>();
  const parsedRows: ParsedRow[] = [];
  const parsedEngineeringCutoffs: ParsedEngineeringCutoff[] = [];

  // Helper to parse Joint Allotment CSV files
  function parseJointCsv(csvPath: string, round: number) {
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== "");
    console.log(`Parsing Joint CSV: ${csvPath} (Round ${round}), Records: ${lines.length - 1}`);

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length < 24) continue;

      let [
        , , , , sub_group, , , category,
        pcm_ur_rank, pcm_cat_rank, pcm_rcg_rank, pcm_dq_rank, pcm_smq_rank,
        pcb_ur_rank, pcb_cat_rank, pcb_rcg_rank, pcb_dq_rank, pcb_smq_rank,
        institute, branch, allotted_cat, seat_type, remark, allotment_group
      ] = cols;

      // Clean label prefixes if they exist
      sub_group = cleanValue(sub_group);
      category = cleanValue(category);
      institute = cleanValue(institute);
      branch = cleanValue(branch);
      allotted_cat = cleanValue(allotted_cat);
      seat_type = cleanValue(seat_type);
      remark = cleanValue(remark);
      allotment_group = cleanValue(allotment_group);

      // Parse rank values
      const parsedPcmUr = parseRank(pcm_ur_rank);
      const parsedPcmCat = parseRank(pcm_cat_rank);
      const parsedPcmRcg = parseRank(pcm_rcg_rank);
      const parsedPcmDq = parseRank(pcm_dq_rank);
      const parsedPcmSmq = parseRank(pcm_smq_rank);

      const parsedPcbUr = parseRank(pcb_ur_rank);
      const parsedPcbCat = parseRank(pcb_cat_rank);
      const parsedPcbRcg = parseRank(pcb_rcg_rank);
      const parsedPcbDq = parseRank(pcb_dq_rank);
      const parsedPcbSmq = parseRank(pcb_smq_rank);

      // Infer group
      const hasPcb = parsedPcbUr !== null || parsedPcbCat !== null || parsedPcbRcg !== null || parsedPcbDq !== null || parsedPcbSmq !== null;
      const hasPcm = parsedPcmUr !== null || parsedPcmCat !== null || parsedPcmRcg !== null || parsedPcmDq !== null || parsedPcmSmq !== null;

      let inferredGroup = allotment_group;
      if (inferredGroup !== "PCM" && inferredGroup !== "PCB") {
        inferredGroup = hasPcb ? "PCB" : (hasPcm ? "PCM" : "PCB");
      }

      uniqueInstitutes.add(institute);
      
      if (!branchGroups.has(branch)) {
        branchGroups.set(branch, new Set());
      }
      branchGroups.get(branch)!.add(inferredGroup);

      parsedRows.push({
        subGroup: sub_group,
        category,
        pcmUrRank: parsedPcmUr,
        pcmCatRank: parsedPcmCat,
        pcmRcgRank: parsedPcmRcg,
        pcmDqRank: parsedPcmDq,
        pcmSmqRank: parsedPcmSmq,
        pcbUrRank: parsedPcbUr,
        pcbCatRank: parsedPcbCat,
        pcbRcgRank: parsedPcbRcg,
        pcbDqRank: parsedPcbDq,
        pcbSmqRank: parsedPcbSmq,
        instituteName: institute,
        branchName: branch,
        allottedCat: allotted_cat,
        seatType: seat_type.toUpperCase().includes("FEMALE") ? "FEMALE SEAT" : "GENERAL SEAT",
        remark: remark || null,
        allotmentGroup: inferredGroup,
        year: 2025,
        round: round
      });
    }
  }

  // Helper to parse Engineering Cutoff CSV file
  function parseEngineeringCsv(csvPath: string, round: number) {
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== "");
    console.log(`Parsing Engineering CSV: ${csvPath}, Records: ${lines.length - 1}`);

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length < 9) continue;
      const [
        _page_no, institute, branch, seat_type, category,
        ur_opening, ur_closing, cat_opening, cat_closing
      ] = cols;

      uniqueInstitutes.add(institute);
      if (!branchGroups.has(branch)) {
        branchGroups.set(branch, new Set());
      }
      branchGroups.get(branch)!.add("PCM"); // Engineering is PCM

      let openingRank: number | null = null;
      let closingRank: number | null = null;
      
      if (ur_opening && ur_opening !== "" && ur_opening !== "null") {
        openingRank = parseRank(ur_opening);
        closingRank = parseRank(ur_closing);
      } else if (cat_opening && cat_opening !== "" && cat_opening !== "null") {
        openingRank = parseRank(cat_opening);
        closingRank = parseRank(cat_closing);
      }

      if (openingRank === null || closingRank === null) {
        continue; // skip if no ranks
      }

      let mappedSeatType = "GENERAL SEAT";
      if (seat_type.toUpperCase() === "FEMALE") {
        mappedSeatType = "FEMALE SEAT";
      }

      parsedEngineeringCutoffs.push({
        instituteName: institute,
        branchName: branch,
        allotmentGroup: "PCM",
        allottedCat: category,
        seatType: mappedSeatType,
        openingRank,
        closingRank,
        totalSeats: 1, // Default placeholder
        year: 2025,
        round: round
      });
    }
  }

  // 1. Parse CSV Datasets
  const jointRound1Path = path.join(process.cwd(), "REVISED_PCMB-Joint_1st_Round_Allotment_16082025.xlsx.csv");
  const jointRound2Path = path.join(process.cwd(), "2nd_round_data.csv");
  const engineeringPath = path.join(process.cwd(), "engineering_cutoffs.csv");

  parseJointCsv(jointRound1Path, 1);
  parseJointCsv(jointRound2Path, 2);
  parseEngineeringCsv(engineeringPath, 2); // Engineering combined is seeded under Round 2

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
    year: number;
    round: number;
    ranks: number[];
  }>();

  for (const row of allotmentsData) {
    const rankVal = getRankValue(row);
    if (rankVal === null) continue;

    const key = `${row.instituteId}_${row.branchId}_${row.allotmentGroup}_${row.allottedCat}_${row.seatType}_${row.round}`;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        instituteId: row.instituteId,
        branchId: row.branchId,
        allotmentGroup: row.allotmentGroup,
        allottedCat: row.allottedCat,
        seatType: row.seatType,
        year: row.year,
        round: row.round,
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
      year: g.year,
      round: g.round
    };
  });

  // Prepare engineering cutoffs for insertion
  const engineeringCutoffsData = parsedEngineeringCutoffs.map(ec => ({
    instituteId: instituteMap.get(ec.instituteName)!,
    branchId: branchMap.get(ec.branchName)!,
    allotmentGroup: ec.allotmentGroup,
    allottedCat: ec.allottedCat,
    seatType: ec.seatType,
    openingRank: ec.openingRank,
    closingRank: ec.closingRank,
    totalSeats: ec.totalSeats,
    year: ec.year,
    round: ec.round
  }));

  const allCutoffs = [...cutoffsData, ...engineeringCutoffsData];

  // Batch insert cutoffs
  for (let i = 0; i < allCutoffs.length; i += batchSize) {
    const batch = allCutoffs.slice(i, i + batchSize);
    await prisma.cutoff.createMany({
      data: batch
    });
  }
  
  console.log(`Computed and seeded ${cutoffsData.length} joint cutoff entries.`);
  console.log(`Directly seeded ${engineeringCutoffsData.length} engineering cutoff entries.`);
  console.log(`Total seeded cutoffs: ${allCutoffs.length}`);
  
  await pool.end();
  console.log("Seeding completed successfully! 🚀");
}

main().catch(err => {
  console.error("Seeding failed with error:", err);
  process.exit(1);
});
