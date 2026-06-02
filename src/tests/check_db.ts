import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Checking DB counts...");
  const counts = await prisma.cutoff.groupBy({
    by: ['round'],
    _count: true
  });
  console.log("Cutoff counts by round:", counts);

  const sampleRound2 = await prisma.cutoff.findMany({
    where: { round: 2 },
    take: 10,
    include: {
      institute: true,
      branch: true
    }
  });

  console.log("\nSample Round 2 Cutoffs:");
  sampleRound2.forEach(c => {
    console.log(`- Round ${c.round}: ${c.institute.shortName} | ${c.branch.name} | Cat: ${c.allottedCat} | Ranks: ${c.openingRank}-${c.closingRank}`);
  });

  await pool.end();
}

main().catch(console.error);
