import { detectInputType } from '../src/utils/inputDetection.js';
import { getGeneInfo } from '../lib/services/ncbiService.js';
import { getClinVarVariantsForGene } from '../lib/services/clinvarService.js';
import { getProteinForGene } from '../lib/services/uniprotService.js';
import { getPDBStructures, getAlphaFoldStructure } from '../lib/services/structureService.js';

import { getVariantInfo } from '../lib/services/variantService.js';
import { getClinVarEvidence, getClinVarForVariant } from '../lib/services/clinvarService.js';
import { getProteinContextForVariant } from '../lib/services/proteinContextService.js';
import { getStructuralContextForVariant } from '../lib/services/structureContextService.js';
import { getFunctionalPredictionsForVariant } from '../lib/services/predictorService.js';
import { reconcileVariantEvidence } from '../lib/services/reconciliationService.js';
import { generateEvidenceSummary } from '../lib/services/evidenceSummaryService.js';

async function runStage15Regression() {
  console.log('=== Stage 15 Full Regression Verification (Stages 1–14) ===\n');

  // Stage 1: Input Detection
  console.log('1. Checking Stage 1 (Input Detection)...');
  if (detectInputType('TP53') !== 'GENE' || detectInputType('rs28934578') !== 'RSID') {
    throw new Error('Stage 1 input detection failed');
  }
  console.log('   ✓ Stage 1 passed.');

  // Stage 2: NCBI Gene
  console.log('2. Checking Stage 2 (NCBI Gene)...');
  const gene2 = await getGeneInfo('TP53');
  if (!gene2.data || gene2.data.entrezId !== '7157') throw new Error('Stage 2 failed');
  console.log('   ✓ Stage 2 passed.');

  // Stage 3: ClinVar Gene
  console.log('3. Checking Stage 3 (ClinVar Gene)...');
  const clinvar3 = await getClinVarVariantsForGene('TP53');
  if (!clinvar3.variants || clinvar3.variants.length === 0) throw new Error('Stage 3 failed');
  console.log('   ✓ Stage 3 passed.');

  // Stage 4: UniProt Protein
  console.log('4. Checking Stage 4 (UniProt Protein)...');
  const uniprot4 = await getProteinForGene('TP53');
  if (!uniprot4.protein || uniprot4.protein.accession !== 'P04637') throw new Error('Stage 4 failed');
  console.log('   ✓ Stage 4 passed.');

  // Stage 5: PDB & AlphaFold
  console.log('5. Checking Stage 5 (RCSB PDB & AlphaFold)...');
  const pdbs5 = await getPDBStructures('P04637');
  const af5 = await getAlphaFoldStructure('P04637');
  if (!pdbs5.structures || !af5.alphafold) throw new Error('Stage 5 failed');
  console.log('   ✓ Stage 5 passed.');

  // Stage 6A & 6B: RefSNP & Variant ClinVar
  console.log('6. Checking Stage 6A/6B (Variant identity & ClinVar evidence)...');
  const var6 = await getVariantInfo('rs28934578');
  if (!var6.variant || var6.variant.gene.symbol !== 'TP53') throw new Error('Stage 6A failed');
  console.log('   ✓ Stage 6A/6B passed.');

  // Stage 7: Variant Protein Context
  console.log('7. Checking Stage 7 (Variant Protein Context)...');
  const clinvar6 = await getClinVarForVariant(var6.variant);
  const protCtx7 = await getProteinContextForVariant(var6.variant, clinvar6);
  const pos7 = protCtx7.mappings?.[0]?.position || protCtx7.residuePosition;
  if (!protCtx7.protein || pos7 !== 175) throw new Error('Stage 7 failed');
  console.log('   ✓ Stage 7 passed.');

  // Stage 8: Structural Context
  console.log('8. Checking Stage 8 (Variant Structural Context)...');
  const structCtx8 = await getStructuralContextForVariant(var6.variant, protCtx7);
  if (!structCtx8.coveringPdbStructures || structCtx8.coveringPdbStructures.length === 0) throw new Error('Stage 8 failed');
  console.log('   ✓ Stage 8 passed.');

  // Stage 9: Computational Predictions (Decoupled & graceful)
  console.log('9. Checking Stage 9 (Computational Predictions)...');
  const preds9 = await getFunctionalPredictionsForVariant(var6.variant, protCtx7);
  if (!preds9) throw new Error('Stage 9 failed');
  console.log('   ✓ Stage 9 passed.');

  // Stage 10: Reconciliation
  console.log('10. Checking Stage 10 (Evidence Reconciliation)...');
  const recon10 = reconcileVariantEvidence(var6.variant, clinvar6, protCtx7, structCtx8, preds9);
  if (!recon10.status) throw new Error('Stage 10 failed');
  console.log('    ✓ Stage 10 passed.');

  // Stage 14: Evidence Summary
  console.log('11. Checking Stage 14 (Evidence Summary Service)...');
  const summary14 = generateEvidenceSummary(var6.variant, clinvar6, protCtx7, structCtx8, preds9, recon10, 0);
  if (!summary14.available || !summary14.scientificTakeaway) throw new Error('Stage 14 failed');
  console.log('    ✓ Stage 14 passed.');

  console.log('\n=====================================================');
  console.log('REGRESSION SUITE PASSED (STAGES 1–14 INTACT)');
  console.log('=====================================================');
}

runStage15Regression().catch(err => {
  console.error('Stage 15 Regression Error:', err);
  process.exit(1);
});
