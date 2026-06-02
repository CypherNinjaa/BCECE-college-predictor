import "dotenv/config";

interface PredictPayload {
  subGroup: "PCM" | "PCB" | "PCMB";
  category: "UR" | "BC" | "EBC" | "SC" | "ST" | "EWS";
  rankType: "PCM" | "PCB";
  rankSubCategory: "UR" | "CAT" | "RCG" | "DQ" | "SMQ";
  rankValue: number;
  branches?: string[];
  institutes?: string[];
}

interface TestConfig {
  id: number;
  description: string;
  payload: PredictPayload;
  expectedRound: number;
  expectedCollegeSubstring: string;
  expectedBranchSubstring: string;
}

const testCases: TestConfig[] = [
  // --- JOINT COURSE TESTS ---
  {
    id: 1,
    description: "Joint Round 1: PCB, UR student, UR Rank 80, expecting Nursing NMCH Patna (based on Round 1 allotment)",
    payload: {
      subGroup: "PCB",
      category: "UR",
      rankType: "PCB",
      rankSubCategory: "UR",
      rankValue: 80
    },
    expectedRound: 1,
    expectedCollegeSubstring: "N.M.C.H",
    expectedBranchSubstring: "B.Sc. Nursing"
  },
  {
    id: 2,
    description: "Joint Round 2: PCB, EBC student, EBC Rank 29, expecting Nursing NMCH Patna (based on Round 2 allotment)",
    payload: {
      subGroup: "PCB",
      category: "EBC",
      rankType: "PCB",
      rankSubCategory: "CAT",
      rankValue: 29
    },
    expectedRound: 2,
    expectedCollegeSubstring: "N.M.C.H",
    expectedBranchSubstring: "B.Sc. Nursing"
  },
  {
    id: 3,
    description: "Joint Round 2: PCB, UR student, UR Rank 142, expecting Nursing NMCH Patna (based on Round 2 allotment)",
    payload: {
      subGroup: "PCB",
      category: "UR",
      rankType: "PCB",
      rankSubCategory: "UR",
      rankValue: 142
    },
    expectedRound: 2,
    expectedCollegeSubstring: "N.M.C.H",
    expectedBranchSubstring: "B.Sc. Nursing"
  },
  {
    id: 4,
    description: "Joint Round 1: PCB, BC student, BC Rank 200, expecting B.Pharma (based on Round 1 allotment)",
    payload: {
      subGroup: "PCB",
      category: "BC",
      rankType: "PCB",
      rankSubCategory: "CAT",
      rankValue: 200
    },
    expectedRound: 1,
    expectedCollegeSubstring: "G.P.I.",
    expectedBranchSubstring: "B.Pharma"
  },
  {
    id: 5,
    description: "Joint Round 2: PCB, BC student, BC Rank 250, expecting B.Pharma (based on Round 2 allotment)",
    payload: {
      subGroup: "PCB",
      category: "BC",
      rankType: "PCB",
      rankSubCategory: "CAT",
      rankValue: 250
    },
    expectedRound: 2,
    expectedCollegeSubstring: "G.P.I.",
    expectedBranchSubstring: "B.Pharma"
  },
  // --- ENGINEERING COURSE TESTS ---
  {
    id: 6,
    description: "Engineering Round 2: PCM, UR student, UR Rank 150, expecting BCE Bakhtiyarpur Computer Science (IoT) (based on cutoff 104-213)",
    payload: {
      subGroup: "PCM",
      category: "UR",
      rankType: "PCM",
      rankSubCategory: "UR",
      rankValue: 150
    },
    expectedRound: 2,
    expectedCollegeSubstring: "BAKHTIYARPUR",
    expectedBranchSubstring: "COMPUTER SCIENCE"
  },
  {
    id: 7,
    description: "Engineering Round 2: PCM, SC student, SC Category Rank 25, expecting BCE Bakhtiyarpur Civil (based on cutoff 23-27)",
    payload: {
      subGroup: "PCM",
      category: "SC",
      rankType: "PCM",
      rankSubCategory: "CAT",
      rankValue: 25
    },
    expectedRound: 2,
    expectedCollegeSubstring: "BAKHTIYARPUR",
    expectedBranchSubstring: "CIVIL ENGINEERING"
  },
  {
    id: 8,
    description: "Engineering Round 2: PCM, BC student, BC Category Rank 200, expecting BCE Bakhtiyarpur Electrical & Electronics (based on cutoff 113-374)",
    payload: {
      subGroup: "PCM",
      category: "BC",
      rankType: "PCM",
      rankSubCategory: "CAT",
      rankValue: 200
    },
    expectedRound: 2,
    expectedCollegeSubstring: "BAKHTIYARPUR",
    expectedBranchSubstring: "ELECTRICAL"
  },
  {
    id: 9,
    description: "Engineering Round 2: PCM, EWS student, EWS Category Rank 700, expecting BCE Bakhtiyarpur Fire Tech & Safety (based on cutoff 640-753)",
    payload: {
      subGroup: "PCM",
      category: "EWS",
      rankType: "PCM",
      rankSubCategory: "CAT",
      rankValue: 700
    },
    expectedRound: 2,
    expectedCollegeSubstring: "BAKHTIYARPUR",
    expectedBranchSubstring: "FIRE TECHNOLOGY"
  },
  {
    id: 10,
    description: "Engineering Round 2: PCM, UR student, UR Rank 3000, expecting BCE Bakhtiyarpur Fire Tech & Safety (based on cutoff 2469-3717)",
    payload: {
      subGroup: "PCM",
      category: "UR",
      rankType: "PCM",
      rankSubCategory: "UR",
      rankValue: 3000
    },
    expectedRound: 2,
    expectedCollegeSubstring: "BAKHTIYARPUR",
    expectedBranchSubstring: "FIRE TECHNOLOGY"
  }
];

async function runTests() {
  console.log("==================================================");
  console.log("🎯 RUNNING 10 DIVERSE PREDICTION ACCURACY CHECKS");
  console.log("==================================================");

  const baseUrl = "http://localhost:3000";
  let passedCount = 0;

  for (const tc of testCases) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Test Case ${tc.id}: ${tc.description}`);
    
    try {
      const response = await fetch(`${baseUrl}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tc.payload)
      });

      if (response.status !== 200) {
        console.error(`❌ FAILED: API returned status ${response.status}`);
        continue;
      }

      const resData = await response.json();
      if (!resData.success) {
        console.error(`❌ FAILED: API response success is false`);
        continue;
      }

      const predictions = resData.data.predictions;
      
      // Look for a match in predictions that satisfies the round and substrings
      const matches = predictions.filter((p: any) => {
        const matchesRound = p.round === tc.expectedRound;
        const matchesCollege = p.institute.name.toUpperCase().includes(tc.expectedCollegeSubstring.toUpperCase()) ||
                               p.institute.shortName.toUpperCase().includes(tc.expectedCollegeSubstring.toUpperCase());
        const matchesBranch = p.branch.fullName.toUpperCase().includes(tc.expectedBranchSubstring.toUpperCase()) ||
                              p.branch.name.toUpperCase().includes(tc.expectedBranchSubstring.toUpperCase());
        
        return matchesRound && matchesCollege && matchesBranch;
      });

      if (matches.length > 0) {
        console.log(`✅ PASSED: Found ${matches.length} matching prediction(s) in Round ${tc.expectedRound}!`);
        console.log(`   Sample Match: ${matches[0].institute.shortName} | ${matches[0].branch.fullName} | Ranks: ${matches[0].openingRank}-${matches[0].closingRank}`);
        passedCount++;
      } else {
        console.error(`❌ FAILED: Expected match not found in Round ${tc.expectedRound}`);
        console.log(`   Total matches returned in all rounds: ${predictions.length}`);
        if (predictions.length > 0) {
          console.log(`   Top 3 predictions returned:`);
          predictions.slice(0, 3).forEach((p: any) => {
            console.log(`     - Round ${p.round}: ${p.institute.shortName} | ${p.branch.fullName} | Ranks: ${p.openingRank}-${p.closingRank}`);
          });
        }
      }
    } catch (err) {
      console.error(`❌ ERROR: Failed to execute test case ${tc.id}:`, err);
    }
  }

  console.log(`\n==================================================`);
  console.log(`📊 ACCURACY CHECKS SUMMARY: ${passedCount} / ${testCases.length} PASSED`);
  console.log(`==================================================`);
  
  if (passedCount !== testCases.length) {
    process.exit(1);
  }
}

runTests().catch(console.error);
