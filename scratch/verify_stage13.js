import { getVariantInfo } from '../api/services/variantService.js';
import { getProteinContextForVariant } from '../api/services/proteinContextService.js';
import { getStructuralContextForVariant } from '../api/services/structureContextService.js';

async function runStage13Verification() {
  console.log('=== Stage 13 3D Structural Visualization Verification Suite ===\n');

  // Test 1: TP53 rs28934578 (p.Arg175His)
  console.log('--- Test 1: TP53 rs28934578 (Arg175His) ---');
  const var1 = await getVariantInfo('rs28934578');
  const protCtx1 = await getProteinContextForVariant(var1);
  const structCtx1 = await getStructuralContextForVariant(var1, protCtx1);

  console.log(`TP53 rs28934578 Primary Position: ${structCtx1.summary?.primaryPosition}`);
  console.log(`Covering PDB Structures Count: ${structCtx1.coveringPdbStructures?.length}`);
  if (structCtx1.coveringPdbStructures?.length > 0) {
    const selPdb = structCtx1.coveringPdbStructures[0];
    console.log(`Representative Selected PDB: ${selPdb.pdbId} (Method: ${selPdb.method}, Resolution: ${selPdb.resolution}, Chains: ${selPdb.coveredChains})`);
  }
  console.log(`AlphaFold Entry ID: ${structCtx1.alphafold?.entryId}`);
  console.log(`Residue 175 pLDDT: ${structCtx1.alphafold?.residueContext?.residuePlddt} (${structCtx1.alphafold?.residueContext?.residueCategory})`);

  if (!structCtx1.summary?.primaryPosition || structCtx1.summary.primaryPosition !== 175) {
    throw new Error('FAIL: TP53 rs28934578 did not resolve residue 175!');
  }
  console.log('✓ Test 1 Passed.\n');

  // Test 2: TP53 rs121913343 (p.Arg273His)
  console.log('--- Test 2: TP53 rs121913343 (Arg273His) ---');
  const var2 = await getVariantInfo('rs121913343');
  const protCtx2 = await getProteinContextForVariant(var2);
  const structCtx2 = await getStructuralContextForVariant(var2, protCtx2);

  console.log(`TP53 rs121913343 Primary Position: ${structCtx2.summary?.primaryPosition}`);
  console.log(`Covering PDB Structures Count: ${structCtx2.coveringPdbStructures?.length}`);
  console.log(`AlphaFold Entry ID: ${structCtx2.alphafold?.entryId}`);
  console.log(`Residue 273 pLDDT: ${structCtx2.alphafold?.residueContext?.residuePlddt} (${structCtx2.alphafold?.residueContext?.residueCategory})`);

  if (!structCtx2.summary?.primaryPosition || structCtx2.summary.primaryPosition !== 273) {
    throw new Error('FAIL: TP53 rs121913343 did not resolve residue 273!');
  }
  console.log('✓ Test 2 Passed.\n');

  // Test 3: BRCA1 rs1799966 (p.Ser1613Gly)
  console.log('--- Test 3: BRCA1 rs1799966 (Ser1613Gly) ---');
  const var3 = await getVariantInfo('rs1799966');
  const protCtx3 = await getProteinContextForVariant(var3);
  const structCtx3 = await getStructuralContextForVariant(var3, protCtx3);

  console.log(`BRCA1 rs1799966 Primary Position: ${structCtx3.summary?.primaryPosition}`);
  console.log(`Covering PDB Structures Count: ${structCtx3.coveringPdbStructures?.length}`);
  console.log(`AlphaFold Available: ${structCtx3.summary?.alphafoldAvailable}`);
  console.log(`Residue 1613 pLDDT: ${structCtx3.summary?.residuePlddt} (${structCtx3.summary?.residueCategory})`);

  if (!structCtx3.summary?.alphafoldAvailable) {
    throw new Error('FAIL: BRCA1 AlphaFold structure missing!');
  }
  console.log('✓ Test 3 Passed.\n');

  // Test 4: KRAS rs121913529 (p.Gly12Asp)
  console.log('--- Test 4: KRAS rs121913529 (Gly12Asp) ---');
  const var4 = await getVariantInfo('rs121913529');
  const protCtx4 = await getProteinContextForVariant(var4);
  const structCtx4 = await getStructuralContextForVariant(var4, protCtx4);

  console.log(`KRAS rs121913529 Primary Position: ${structCtx4.summary?.primaryPosition}`);
  console.log(`Covering PDB Structures Count: ${structCtx4.coveringPdbStructures?.length}`);
  console.log(`Residue 12 pLDDT: ${structCtx4.summary?.residuePlddt}`);

  if (!structCtx4.summary?.primaryPosition || structCtx4.summary.primaryPosition !== 12) {
    throw new Error('FAIL: KRAS rs121913529 did not resolve residue 12!');
  }
  console.log('✓ Test 4 Passed.\n');

  // Test 5: Invalid Variant rs999999999999
  console.log('--- Test 5: Invalid Variant rs999999999999 ---');
  const var5 = await getVariantInfo('rs999999999999');
  console.log(`Invalid Variant Found: ${var5.variant !== null}`);
  if (var5.variant) {
    throw new Error('FAIL: Invalid variant returned data!');
  }
  console.log('✓ Test 5 Passed: Clean no-data result without hardcoded fallback.\n');

  console.log('=====================================================');
  console.log('ALL STAGE 13 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('=====================================================');
}

runStage13Verification().catch(err => {
  console.error('Stage 13 Verification Failure:', err);
  process.exit(1);
});
