import compareHandler from '../api/compare.js';

function createMockRes(resolve) {
  return {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      resolve({ statusCode: this.statusCode, data });
    }
  };
}

function runCompareQuery(varA, varB) {
  return new Promise((resolve) => {
    const req = { query: { varA, varB } };
    const res = createMockRes(resolve);
    compareHandler(req, res);
  });
}

async function runAllTests() {
  console.log("==========================================");
  console.log("Running Stage 11 Comparison API Verification");
  console.log("==========================================");

  // Test 1: TP53 vs TP53
  console.log("\n--- Test 1: rs28934578 (TP53) vs rs121913343 (TP53) ---");
  const res1 = await runCompareQuery('rs28934578', 'rs121913343');
  console.log("Status Code:", res1.statusCode);
  console.log("Variant A Gene:", res1.data.variantA?.variant?.gene?.symbol, "| Variant B Gene:", res1.data.variantB?.variant?.gene?.symbol);
  console.log("Same RSID:", res1.data.comparison?.sameRsid);
  console.log("Shared Characteristics:", res1.data.comparison?.shared);
  console.log("Differences:", res1.data.comparison?.differences);

  // Test 2: BRCA1 vs KRAS
  console.log("\n--- Test 2: rs1799966 (BRCA1) vs rs121913529 (KRAS) ---");
  const res2 = await runCompareQuery('rs1799966', 'rs121913529');
  console.log("Variant A Gene:", res2.data.variantA?.variant?.gene?.symbol, "| Variant B Gene:", res2.data.variantB?.variant?.gene?.symbol);
  console.log("Shared Characteristics:", res2.data.comparison?.shared);
  console.log("Differences:", res2.data.comparison?.differences);

  // Test 3: Valid vs Invalid
  console.log("\n--- Test 3: rs28934578 vs rs999999999999 ---");
  const res3 = await runCompareQuery('rs28934578', 'rs999999999999');
  console.log("Variant A Resolved:", !!res3.data.variantA?.variant, "| Variant B Resolved:", !!res3.data.variantB?.variant);
  console.log("Variant B Error:", res3.data.variantB?.error);
  console.log("Is Partial:", res3.data.comparison?.isPartial);

  // Test 4: Same Variant
  console.log("\n--- Test 4: rs28934578 vs rs28934578 ---");
  const res4 = await runCompareQuery('rs28934578', 'rs28934578');
  console.log("Same RSID:", res4.data.comparison?.sameRsid);
  console.log("Summary Note:", res4.data.comparison?.summaryNote);
}

runAllTests();
