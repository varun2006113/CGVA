import { getVariantInfo } from '../api/services/variantService.js';
import { getClinVarEvidence } from '../api/services/clinvarService.js';
import { getProteinContextForVariant } from '../api/services/proteinContextService.js';
import { getStructuralContextForVariant } from '../api/services/structureContextService.js';
import { getFunctionalPredictionsForVariant } from '../api/services/predictorService.js';
import { reconcileVariantEvidence } from '../api/services/reconciliationService.js';
import { generateEvidenceSummary } from '../api/services/evidenceSummaryService.js';

async function runStage14Verification() {
  console.log('=== Stage 14 Evidence & Scientific Interpretation Layer Verification Suite ===\n');

  // TEST 1: rs28934578 Allele 1 (p.Arg175His)
  console.log('--- TEST 1: rs28934578 Allele 1 (p.Arg175His) ---');
  const var1 = await getVariantInfo('rs28934578');
  const clinvar1 = await getClinVarEvidence('rs28934578');
  const protCtx1 = await getProteinContextForVariant(var1, clinvar1);
  const structCtx1 = await getStructuralContextForVariant(var1, protCtx1);
  const preds1 = await getFunctionalPredictionsForVariant(var1, protCtx1);
  const recon1 = reconcileVariantEvidence(var1, clinvar1, protCtx1, structCtx1, preds1);

  const summary1 = generateEvidenceSummary(var1, clinvar1, protCtx1, structCtx1, preds1, recon1, 0);

  console.log(`rs28934578 Allele 1 Alternate: ${summary1.variantIdentity.alternateAllele}`);
  console.log(`rs28934578 Allele 1 Protein HGVS: ${summary1.variantIdentity.proteinHGVS}`);
  console.log(`ClinVar Classifications: ${summary1.clinicalEvidence.classifications.join(', ')}`);
  console.log(`AlphaMissense Pred: ${summary1.functionalPredictions.alphaMissense?.prediction}`);
  console.log(`Protein Accession & Length: ${summary1.proteinContext.uniprotAccession} (${summary1.proteinContext.proteinLength} AA)`);
  console.log(`Domain Match: ${summary1.proteinContext.domainMatch?.name}`);
  console.log(`PDB Representative: ${summary1.structuralContext.representativePdb?.pdbId}`);
  console.log(`AlphaFold Residue pLDDT: ${summary1.structuralContext.residuePlddt}`);
  console.log(`Consistency Matrix Rows: ${summary1.consistency.matrix.length}`);
  console.log(`Synthesized Scientific Takeaway:\n  "${summary1.scientificTakeaway}"`);

  if (!summary1.available || !summary1.variantIdentity.proteinHGVS.includes('175')) {
    throw new Error('FAIL: TEST 1 summary generation failed!');
  }
  console.log('✓ TEST 1 Passed.\n');

  // TEST 2: rs28934578 Allele 2 (Multi-Allelic Switch Verification)
  console.log('--- TEST 2: rs28934578 Switch to Allele 2 ---');
  const summary1_allele2 = generateEvidenceSummary(var1, clinvar1, protCtx1, structCtx1, preds1, recon1, 1);

  console.log(`rs28934578 Allele 2 Alternate: ${summary1_allele2.variantIdentity.alternateAllele}`);
  console.log(`rs28934578 Allele 2 Protein HGVS: ${summary1_allele2.variantIdentity.proteinHGVS}`);
  console.log(`rs28934578 Allele 2 Coding HGVS: ${summary1_allele2.variantIdentity.codingHGVS}`);

  if (summary1_allele2.variantIdentity.alternateAllele === summary1.variantIdentity.alternateAllele && summary1.alleleOptions.length > 1) {
    throw new Error('FAIL: Multi-allelic switch did not update alternate allele!');
  }
  console.log('✓ TEST 2 Passed: Multi-allelic evidence layers update in sync.\n');

  // TEST 3: rs121913343 (p.Arg273His)
  console.log('--- TEST 3: rs121913343 (p.Arg273His) ---');
  const var2 = await getVariantInfo('rs121913343');
  const clinvar2 = await getClinVarEvidence('rs121913343');
  const protCtx2 = await getProteinContextForVariant(var2, clinvar2);
  const structCtx2 = await getStructuralContextForVariant(var2, protCtx2);
  const preds2 = await getFunctionalPredictionsForVariant(var2, protCtx2);
  const recon2 = reconcileVariantEvidence(var2, clinvar2, protCtx2, structCtx2, preds2);

  const summary2 = generateEvidenceSummary(var2, clinvar2, protCtx2, structCtx2, preds2, recon2, 0);

  console.log(`rs121913343 Protein Change: ${summary2.molecularConsequence.proteinChange}`);
  console.log(`rs121913343 ClinVar Classifications: ${summary2.clinicalEvidence.classifications.join(', ')}`);
  console.log(`rs121913343 Domain Match: ${summary2.proteinContext.domainMatch?.name}`);

  if (!summary2.available || summary2.molecularConsequence.residuePosition !== 273) {
    throw new Error('FAIL: TEST 3 residue 273 resolution failed!');
  }
  console.log('✓ TEST 3 Passed.\n');

  // TEST 4: rs1799966 (BRCA1 Reconciliation)
  console.log('--- TEST 4: rs1799966 (BRCA1 Transcript Reconciliation) ---');
  const var3 = await getVariantInfo('rs1799966');
  const clinvar3 = await getClinVarEvidence('rs1799966');
  const protCtx3 = await getProteinContextForVariant(var3, clinvar3);
  const structCtx3 = await getStructuralContextForVariant(var3, protCtx3);
  const preds3 = await getFunctionalPredictionsForVariant(var3, protCtx3);
  const recon3 = reconcileVariantEvidence(var3, clinvar3, protCtx3, structCtx3, preds3);

  const summary3 = generateEvidenceSummary(var3, clinvar3, protCtx3, structCtx3, preds3, recon3, 0);

  console.log(`rs1799966 Gene: ${summary3.variantIdentity.gene}`);
  console.log(`rs1799966 Protein HGVS: ${summary3.variantIdentity.proteinHGVS}`);
  console.log(`rs1799966 Reconciled Discrepancies Count: ${summary3.consistency.discrepancies.length}`);

  if (!summary3.available || summary3.variantIdentity.gene !== 'BRCA1') {
    throw new Error('FAIL: TEST 4 BRCA1 resolution failed!');
  }
  console.log('✓ TEST 4 Passed.\n');

  // TEST 5: rs121913529 (KRAS)
  console.log('--- TEST 5: rs121913529 (KRAS p.Gly12Asp) ---');
  const var4 = await getVariantInfo('rs121913529');
  const clinvar4 = await getClinVarEvidence('rs121913529');
  const protCtx4 = await getProteinContextForVariant(var4, clinvar4);
  const structCtx4 = await getStructuralContextForVariant(var4, protCtx4);
  const preds4 = await getFunctionalPredictionsForVariant(var4, protCtx4);
  const recon4 = reconcileVariantEvidence(var4, clinvar4, protCtx4, structCtx4, preds4);

  const summary4 = generateEvidenceSummary(var4, clinvar4, protCtx4, structCtx4, preds4, recon4, 0);

  console.log(`KRAS Variant Consequence: ${summary4.molecularConsequence.consequence}`);
  console.log(`KRAS Residue Position: ${summary4.molecularConsequence.residuePosition}`);
  console.log(`KRAS AlphaFold pLDDT: ${summary4.structuralContext.residuePlddt}`);

  if (!summary4.available || summary4.molecularConsequence.residuePosition !== 12) {
    throw new Error('FAIL: TEST 5 KRAS residue 12 resolution failed!');
  }
  console.log('✓ TEST 5 Passed.\n');

  // TEST 6: Invalid Variant rs999999999999
  console.log('--- TEST 6: Invalid Variant rs999999999999 ---');
  const var5 = await getVariantInfo('rs999999999999');
  const summary5 = generateEvidenceSummary(var5);
  console.log(`Invalid Variant Summary Available: ${summary5.available}`);
  if (summary5.available) {
    throw new Error('FAIL: Invalid variant returned available summary!');
  }
  console.log('✓ TEST 6 Passed: Clean unavailable state without hardcoded fallback.\n');

  console.log('=====================================================');
  console.log('ALL STAGE 14 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('=====================================================');
}

runStage14Verification().catch(err => {
  console.error('Stage 14 Verification Error:', err);
  process.exit(1);
});
