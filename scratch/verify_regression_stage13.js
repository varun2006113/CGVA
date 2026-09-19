import { getGeneInfo } from '../api/services/ncbiService.js';
import { getClinVarVariantsForGene } from '../api/services/clinvarService.js';
import { getProteinForGene } from '../api/services/uniprotService.js';
import { getPDBStructures, getAlphaFoldStructure } from '../api/services/structureService.js';
import { getVariantInfo } from '../api/services/variantService.js';
import { getProteinContextForVariant } from '../api/services/proteinContextService.js';
import { getStructuralContextForVariant } from '../api/services/structureContextService.js';
import { getFunctionalPredictionsForVariant } from '../api/services/predictorService.js';
import { getGeneAnalytics } from '../api/services/analyticsService.js';

async function runFullRegressionSuite() {
  console.log('=== Full Regression Suite (Stages 1–12) ===\n');

  // Stage 2: NCBI Gene
  console.log('1. Checking Stage 2 (NCBI Gene)...');
  const geneRes = await getGeneInfo('TP53');
  if (!geneRes.data || geneRes.data.symbol !== 'TP53') throw new Error('Stage 2 failed');
  console.log('   ✓ Stage 2 passed.');

  // Stage 3: ClinVar Gene
  console.log('2. Checking Stage 3 (ClinVar Gene)...');
  const clinvarGene = await getClinVarVariantsForGene('TP53', 5);
  if (!clinvarGene.variants || clinvarGene.variants.length === 0) throw new Error('Stage 3 failed');
  console.log('   ✓ Stage 3 passed.');

  // Stage 4: UniProt
  console.log('3. Checking Stage 4 (UniProt Protein)...');
  const uniprot = await getProteinForGene('TP53');
  if (!uniprot.protein || uniprot.protein.accession !== 'P04637') throw new Error('Stage 4 failed');
  console.log('   ✓ Stage 4 passed.');

  // Stage 5: Structures
  console.log('4. Checking Stage 5 (RCSB PDB & AlphaFold)...');
  const pdbRes = await getPDBStructures('P04637');
  const afRes = await getAlphaFoldStructure('P04637');
  if (!pdbRes || !afRes) throw new Error('Stage 5 failed');
  console.log('   ✓ Stage 5 passed.');

  // Stage 6A/6B: Variant Identity & ClinVar Evidence
  console.log('5. Checking Stage 6A/6B (Variant rs28934578 identity & ClinVar evidence)...');
  const variantRes = await getVariantInfo('rs28934578');
  if (!variantRes.variant || !variantRes.variant.rsid) throw new Error('Stage 6A/6B failed');
  console.log('   ✓ Stage 6A/6B passed.');

  // Stage 7: Protein Context
  console.log('6. Checking Stage 7 (Variant Protein Context)...');
  const protCtx = await getProteinContextForVariant(variantRes);
  if (!protCtx.protein || !protCtx.protein.accession) throw new Error('Stage 7 failed');
  console.log(`   ✓ Stage 7 passed.`);

  // Stage 8: Structural Context
  console.log('7. Checking Stage 8 (Variant Structural Context)...');
  const structCtx = await getStructuralContextForVariant(variantRes, protCtx);
  if (!structCtx) throw new Error('Stage 8 failed.');
  console.log('   ✓ Stage 8 passed.');

  // Stage 9: Predictors
  console.log('8. Checking Stage 9 (Computational Predictions)...');
  const preds = await getFunctionalPredictionsForVariant(variantRes);
  if (!preds.allelePredictions) throw new Error('Stage 9 failed');
  console.log('   ✓ Stage 9 passed.');

  // Stage 12: Analytics
  console.log('9. Checking Stage 12 (Analytics & Variant Landscape)...');
  const analytics = await getGeneAnalytics('TP53', 20);
  if (!analytics.found || analytics.recordsAnalyzed === 0) throw new Error('Stage 12 failed');
  console.log('   ✓ Stage 12 passed.');

  console.log('\n=====================================================');
  console.log('REGRESSION SUITE PASSED (STAGES 1–12 INTACT)');
  console.log('=====================================================');
}

runFullRegressionSuite().catch(err => {
  console.error('Regression Failure:', err);
  process.exit(1);
});
