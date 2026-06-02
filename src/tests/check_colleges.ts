import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const colleges = await prisma.institute.findMany();
  console.log("COLLEGES IN DATABASE:");
  colleges.forEach((c) => {
    console.log(`- ID: ${c.id} | Name: ${c.name} | Type: ${c.type}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
