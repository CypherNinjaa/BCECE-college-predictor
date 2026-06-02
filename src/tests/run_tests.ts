import "dotenv/config";

// Assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`\n❌ ASSERTION FAILED: ${message}\n`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

// --------------------------------------------------
// 1. Unit Test: parseRank Functionality
// --------------------------------------------------
function parseRank(rankStr: string | undefined): number | null {
  if (!rankStr) return null;
  const cleaned = rankStr.trim();
  if (!cleaned || cleaned === "" || cleaned === "null") return null;
  const match = cleaned.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function testParseRank() {
  console.log("\n🧪 Running Unit Tests: parseRank");
  console.log("-----------------------------------------");

  assert(parseRank("JT.UR- 101") === 101, "Parse UR rank");
  assert(parseRank("JT.BC- 55") === 55, "Parse BC category rank");
  assert(parseRank("JT.RCG- 18") === 18, "Parse RCG rank");
  assert(parseRank("JT.DQ- 5") === 5, "Parse DQ rank");
  assert(parseRank("JT.SMQ- 12") === 12, "Parse SMQ rank");
  assert(parseRank(undefined) === null, "Handle undefined");
  assert(parseRank("") === null, "Handle empty string");
  assert(parseRank("null") === null, "Handle string 'null'");
  assert(parseRank("  ") === null, "Handle whitespace");
}

// --------------------------------------------------
// 2. Unit Test: Chance Calculation Margin Logic
// --------------------------------------------------
function calculateChance(rankValue: number, openingRank: number, closingRank: number) {
  let chanceLevel: "HIGH" | "MODERATE" | "LOW" | "EXCLUDED" = "EXCLUDED";
  let chancePercentage = 0;

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
  }

  chancePercentage = Math.max(5, Math.min(99, chancePercentage));
  return { chanceLevel, chancePercentage };
}

function testChanceCalculation() {
  console.log("\n🧪 Running Unit Tests: Chance Calculation Logic");
  console.log("-----------------------------------------");

  // Mock cutoff: opening=100, closing=200, low margin max=220
  
  // Rank <= opening (HIGH)
  const case1 = calculateChance(90, 100, 200);
  assert(case1.chanceLevel === "HIGH", "Rank 90 ≤ 100 yields HIGH chance");
  assert(case1.chancePercentage >= 90 && case1.chancePercentage <= 99, "HIGH percentage is between 90-99%");

  const case1Edge = calculateChance(100, 100, 200);
  assert(case1Edge.chanceLevel === "HIGH", "Edge Rank 100 yields HIGH chance");

  // Rank between opening and closing (MODERATE)
  const case2 = calculateChance(150, 100, 200);
  assert(case2.chanceLevel === "MODERATE", "Rank 150 falls within 100-200 yields MODERATE chance");
  assert(case2.chancePercentage >= 40 && case2.chancePercentage <= 89, "MODERATE percentage is between 40-89%");

  const case2Edge = calculateChance(200, 100, 200);
  assert(case2Edge.chanceLevel === "MODERATE", "Edge Rank 200 yields MODERATE chance");

  // Rank within 10% of closing (LOW)
  const case3 = calculateChance(210, 100, 200);
  assert(case3.chanceLevel === "LOW", "Rank 210 falls in 200-220 (10% over closing) yields LOW chance");
  assert(case3.chancePercentage >= 10 && case3.chancePercentage <= 39, "LOW percentage is between 10-39%");

  // Rank > 10% of closing (EXCLUDED)
  const case4 = calculateChance(230, 100, 200);
  assert(case4.chanceLevel === "EXCLUDED", "Rank 230 is > 220 yields EXCLUDED");
}

// --------------------------------------------------
// 3. Integration Tests: API Endpoints & Data Shapes
// --------------------------------------------------
async function testIntegrationAPI() {
  console.log("\n🧪 Running Integration Tests: Local API Endpoints");
  console.log("-----------------------------------------");

  const baseUrl = "http://localhost:3000";

  // Check stats API
  try {
    const statsRes = await fetch(`${baseUrl}/api/stats`);
    assert(statsRes.status === 200, "GET /api/stats status is 200");
    
    const stats = await statsRes.json();
    assert(stats.success === true, "GET /api/stats success is true");
    assert(typeof stats.data.collegesCount === "number" && stats.data.collegesCount > 0, "collegesCount is a positive number");
    assert(typeof stats.data.branchesCount === "number" && stats.data.branchesCount > 0, "branchesCount is a positive number");
    assert(typeof stats.data.allotmentsCount === "number" && stats.data.allotmentsCount > 0, "allotmentsCount is a positive number");
  } catch (err) {
    console.error("GET /api/stats request failed. Ensure dev server is running on port 3000.", err);
    process.exit(1);
  }

  // Check colleges API
  const collegesRes = await fetch(`${baseUrl}/api/colleges`);
  assert(collegesRes.status === 200, "GET /api/colleges status is 200");
  const colleges = await collegesRes.json();
  assert(colleges.success === true, "colleges fetch success");
  assert(Array.isArray(colleges.data) && colleges.data.length >= 23, "Colleges list returns at least 23 institutes");
  assert(typeof colleges.data[0].id === "string" && typeof colleges.data[0].name === "string", "Colleges have valid ID and Name fields");

  // Check branches API
  const branchesRes = await fetch(`${baseUrl}/api/branches`);
  assert(branchesRes.status === 200, "GET /api/branches status is 200");
  const branches = await branchesRes.json();
  assert(branches.success === true, "branches fetch success");
  assert(Array.isArray(branches.data) && branches.data.length >= 13, "Branches list returns at least 13 branches");

  // Check predict API (Valid request)
  const predictPayload = {
    subGroup: "PCMB",
    category: "BC",
    rankType: "PCM",
    rankSubCategory: "UR",
    rankValue: 100
  };

  const predictRes = await fetch(`${baseUrl}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(predictPayload)
  });

  assert(predictRes.status === 200, "POST /api/predict with valid payload returns 200");
  const predictData = await predictRes.json();
  assert(predictData.success === true, "predict response success is true");
  assert(Array.isArray(predictData.data.predictions), "predictions is an array");
  assert(predictData.data.predictions.length > 0, "predictions returns results");
  assert(predictData.data.predictions[0].chanceLevel !== undefined, "prediction object has chanceLevel");
  assert(predictData.data.predictions[0].chancePercentage !== undefined, "prediction object has chancePercentage");

  // Check predict API validation failure (Negative rank)
  const invalidPayload = {
    subGroup: "PCMB",
    category: "BC",
    rankType: "PCM",
    rankSubCategory: "UR",
    rankValue: -10
  };

  const invalidRes = await fetch(`${baseUrl}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invalidPayload)
  });

  assert(invalidRes.status === 400, "POST /api/predict with negative rank value returns 400 Bad Request");
}

// Main runner
async function run() {
  console.log("==================================================");
  console.log("🚀 STARTING AUTOMATED UNIT & INTEGRATION TEST SUITE");
  console.log("==================================================");

  testParseRank();
  testChanceCalculation();
  await testIntegrationAPI();

  console.log("\n==================================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("\n❌ Test suite run crashed:", err);
  process.exit(1);
});
