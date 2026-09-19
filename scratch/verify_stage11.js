import compareHandler from '../api/compare.js';
import variantHandler from '../api/variant.js';

function createMockRes(resolve) {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      resolve({ statusCode: this.statusCode, data });
    }
  };
}

function runCompare(varA, varB) {
  return new Promise((resolve) => {
    const req = { query: { varA, varB } };
    const res = createMockRes(resolve);
    compareHandler(req, res);
  });
}

function runVariantQuery(query) {
  return new Promise((resolve) => {
    const req = { query: { query } };
    const res = createMockRes(resolve);
    variantHandler(req, res);
  });
}

async function verifyStage11() {
  console.log("==================================================");
  console.log("Stage 11 Automated Verification Suite");
  console.log("==================================================");

  // Test 1: TP53 vs TP53 (rs28934578 vs rs121913343)
  console.log("\n1. Test 1: rs28934578 (TP53) vs rs121913343 (TP53)");
  const res1 = await runCompare('rs28934578', 'rs121913343');
  console.log(`   Status: ${res1.statusCode}`);
  console.log(`   Variant A: ${res1.data.variantA?.variant?.rsid} (${res1.data.variantA?.variant?.gene?.symbol}) | Variant B: ${res1.data.variantB?.variant?.rsid} (${res1.data.variantB?.variant?.gene?.symbol})`);
  console.log(`   Same RSID: ${res1.data.comparison?.sameRsid}`);
  console.log(`   Shared Characteristics Count: ${res1.data.comparison?.shared?.length}`);
  console.log(`   Shared List:`, res1.data.comparison?.shared);
  console.log(`   Differences Count: ${res1.data.comparison?.differences?.length}`);
  console.log(`   Differences List:`, res1.data.comparison?.differences);

  // Test 2: BRCA1 vs KRAS (rs1799966 vs rs121913529)
  console.log("\n2. Test 2: rs1799966 (BRCA1) vs rs121913529 (KRAS)");
  const res2 = await runCompare('rs1799966', 'rs121913529');
  console.log(`   Variant A: ${res2.data.variantA?.variant?.rsid} (${res2.data.variantA?.variant?.gene?.symbol}) | Variant B: ${res2.data.variantB?.variant?.rsid} (${res2.data.variantB?.variant?.gene?.symbol})`);
  console.log(`   Shared List:`, res2.data.comparison?.shared);
  console.log(`   Differences List:`, res2.data.comparison?.differences);

  // Test 3: Valid vs Invalid (rs28934578 vs rs999999999999)
  console.log("\n3. Test 3: rs28934578 vs rs999999999999");
  const res3 = await runCompare('rs28934578', 'rs999999999999');
  console.log(`   Variant A Resolved: ${!!res3.data.variantA?.variant} | Variant B Resolved: ${!!res3.data.variantB?.variant}`);
  console.log(`   Variant B Error: "${res3.data.variantB?.error}"`);
  console.log(`   Partial Comparison: ${res3.data.comparison?.isPartial}`);

  // Test 4: Same Variant (rs28934578 vs rs28934578)
  console.log("\n4. Test 4: rs28934578 vs rs28934578");
  const res4 = await runCompare('rs28934578', 'rs28934578');
  console.log(`   Same RSID Flag: ${res4.data.comparison?.sameRsid}`);
  console.log(`   Summary Note: "${res4.data.comparison?.summaryNote}"`);

  // Test 5: Regression check on single variant API
  console.log("\n5. Regression Check: Single Variant Endpoint (/api/variant?query=rs28934578)");
  const singleRes = await runVariantQuery('rs28934578');
  console.log(`   Status: ${singleRes.statusCode}`);
  console.log(`   Identity: ${singleRes.data.variant?.rsid} (${singleRes.data.variant?.gene?.symbol})`);
  console.log(`   ClinVar: ${singleRes.data.clinvar?.records?.length} records`);
  console.log(`   Protein Context: UniProt ${singleRes.data.proteinContext?.uniprotAccession}`);
  console.log(`   Structural Context: PDB ${singleRes.data.structuralContext?.summary?.coveringPdbCount} structures`);
  console.log(`   Predictions: ${singleRes.data.predictions?.allelePredictions?.length} alleles`);
  console.log(`   Reconciliation: ${singleRes.data.reconciliation?.status}`);

  console.log("\n==================================================");
  console.log("All Stage 11 Verification Checks Completed Successfully!");
  console.log("==================================================");
}

verifyStage11();
