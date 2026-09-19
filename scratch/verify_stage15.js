import { getGeneInfo } from '../api/services/ncbiService.js';
import { getClinVarVariantsForGene } from '../api/services/clinvarService.js';
import { getProteinForGene } from '../api/services/uniprotService.js';
import { getPDBStructures, getAlphaFoldStructure } from '../api/services/structureService.js';

import { getVariantInfo } from '../api/services/variantService.js';
import { getClinVarEvidence, getClinVarForVariant } from '../api/services/clinvarService.js';
import { getProteinContextForVariant } from '../api/services/proteinContextService.js';
import { getStructuralContextForVariant } from '../api/services/structureContextService.js';
import { getFunctionalPredictionsForVariant } from '../api/services/predictorService.js';
import { reconcileVariantEvidence } from '../api/services/reconciliationService.js';
import { generateEvidenceSummary } from '../api/services/evidenceSummaryService.js';

async function runStage15Verification() {
  console.log('=== Stage 15 Final Verification & Audit Suite ===\n');

  // 1. Live Gene Audits
  console.log('--- 1. Live Gene Exploration Audits ---');
  const genesToTest = ['BRCA1', 'TP53', 'BRCA2', 'KRAS', 'EGFR', 'BRAF'];
  for (const sym of genesToTest) {
    const gene = await getGeneInfo(sym);
    if (!gene.data || gene.data.symbol !== sym) {
      throw new Error(`FAIL: Gene lookup for ${sym} failed!`);
    }
    console.log(`✓ Gene ${sym} resolved: Entrez ID ${gene.data.entrezId}, Chr ${gene.data.chromosome}`);
  }
  console.log('✓ All target genes verified live.\n');

  // 2. Live Variant Identity & Evidence Audits
  console.log('--- 2. Live Variant Resolution & Integration Audits ---');
  const variantsToTest = [
    { rsid: 'rs28934578', expectedGene: 'TP53' },
    { rsid: 'rs121913343', expectedGene: 'TP53' },
    { rsid: 'rs1799966', expectedGene: 'BRCA1' },
    { rsid: 'rs121913529', expectedGene: 'KRAS' }
  ];

  for (const { rsid, expectedGene } of variantsToTest) {
    const varData = await getVariantInfo(rsid);
    if (!varData.variant || !varData.variant.rsid) {
      throw new Error(`FAIL: Variant resolution for ${rsid} failed!`);
    }
    if (varData.variant.gene?.symbol !== expectedGene) {
      throw new Error(`FAIL: Variant ${rsid} gene mismatch! Expected ${expectedGene}, got ${varData.variant.gene?.symbol}`);
    }

    const clinvar = await getClinVarForVariant(varData.variant);
    const protCtx = await getProteinContextForVariant(varData.variant, clinvar);
    const structCtx = await getStructuralContextForVariant(varData.variant, protCtx);
    const preds = await getFunctionalPredictionsForVariant(varData.variant, protCtx);
    const recon = reconcileVariantEvidence(varData.variant, clinvar, protCtx, structCtx, preds);
    const summary = generateEvidenceSummary(varData.variant, clinvar, protCtx, structCtx, preds, recon, 0);

    if (!summary.available) {
      throw new Error(`FAIL: Stage 14 summary generation failed for ${rsid}!`);
    }

    console.log(`✓ Variant ${rsid} resolved: Gene ${summary.variantIdentity.gene}, Coding ${summary.variantIdentity.codingHGVS}, Protein ${summary.variantIdentity.proteinHGVS}, ClinVar Records: ${summary.clinicalEvidence.submissionCounts}`);
  }
  console.log('✓ All target variants verified live.\n');

  // 3. Multi-Allelic Switch Audit
  console.log('--- 3. Multi-Allelic Switch Verification (rs28934578) ---');
  const multiVar = await getVariantInfo('rs28934578');
  const multiClinvar = await getClinVarForVariant(multiVar.variant);
  const multiProt = await getProteinContextForVariant(multiVar.variant, multiClinvar);
  const multiStruct = await getStructuralContextForVariant(multiVar.variant, multiProt);
  const multiPreds = await getFunctionalPredictionsForVariant(multiVar.variant, multiProt);
  const multiRecon = reconcileVariantEvidence(multiVar.variant, multiClinvar, multiProt, multiStruct, multiPreds);

  const summaryAllele1 = generateEvidenceSummary(multiVar.variant, multiClinvar, multiProt, multiStruct, multiPreds, multiRecon, 0);
  const summaryAllele2 = generateEvidenceSummary(multiVar.variant, multiClinvar, multiProt, multiStruct, multiPreds, multiRecon, 1);

  console.log(`Allele 1: ${summaryAllele1.variantIdentity.alternateAllele} -> ${summaryAllele1.variantIdentity.proteinHGVS}`);
  console.log(`Allele 2: ${summaryAllele2.variantIdentity.alternateAllele} -> ${summaryAllele2.variantIdentity.proteinHGVS}`);

  if (summaryAllele1.variantIdentity.alternateAllele === summaryAllele2.variantIdentity.alternateAllele) {
    throw new Error('FAIL: Multi-allelic allele switch did not differentiate alternate alleles!');
  }
  console.log('✓ Multi-allelic switch verified without cross-allele contamination.\n');

  // 4. Invalid Variant Audit
  console.log('--- 4. Invalid Variant Handling (rs999999999999) ---');
  const invalidVar = await getVariantInfo('rs999999999999');
  const invalidSummary = generateEvidenceSummary(invalidVar.variant);
  if (invalidSummary.available) {
    throw new Error('FAIL: Invalid variant returned available summary!');
  }
  console.log('✓ Invalid variant handled with clean unavailable state (no demo fallback).\n');

  console.log('=====================================================');
  console.log('STAGE 15 AUDIT & VERIFICATION PASSED SUCCESSFULLY!');
  console.log('=====================================================');
}

runStage15Verification().catch(err => {
  console.error('Stage 15 Verification Error:', err);
  process.exit(1);
});
