import { getVariantInfo } from '../api/services/variantService.js';
import { getClinVarEvidence } from '../api/services/clinvarService.js';
import { getProteinContextForVariant } from '../api/services/proteinContextService.js';
import { getStructuralContextForVariant } from '../api/services/structureContextService.js';
import { getFunctionalPredictionsForVariant } from '../api/services/predictorService.js';
import { reconcileVariantEvidence } from '../api/services/reconciliationService.js';
import { generateEvidenceSummary } from '../api/services/evidenceSummaryService.js';

async function checkLiveRs121913343() {
  console.log('=== Live Resolution Check for rs121913343 ===');
  const varInfo = await getVariantInfo('rs121913343');
  console.log('NCBI Variant Identity:');
  console.log('  rsid:', varInfo.rsid);
  console.log('  gene:', varInfo.geneSymbol);
  console.log('  chromosome:', varInfo.chromosome);
  console.log('  genomicPosition:', varInfo.genomicPosition);
  console.log('  ref Allele:', varInfo.refAllele);
  console.log('  alt Alleles:', varInfo.altAlleles);
  console.log('  genomicHGVS:', varInfo.genomicHGVS);
  console.log('  codingHGVS:', varInfo.codingHGVS);
  console.log('  proteinHGVS:', varInfo.proteinHGVS);
  console.log('  primaryConsequence:', varInfo.primaryConsequence);

  const clinvar = await getClinVarEvidence('rs121913343');
  console.log('\nClinVar Evidence:');
  console.log('  records count:', clinvar.records?.length);
  console.log('  classifications:', clinvar.summary?.classifications);

  const protCtx = await getProteinContextForVariant(varInfo, clinvar);
  console.log('\nUniProt Protein Context:');
  console.log('  accession:', protCtx.protein?.accession);
  console.log('  name:', protCtx.protein?.name);
  console.log('  residuePosition:', protCtx.residuePosition);
  console.log('  domainMatch:', protCtx.domainMatch?.name);

  const structCtx = await getStructuralContextForVariant(varInfo, protCtx);
  console.log('\nStructural Context:');
  console.log('  PDB total matching count:', structCtx.pdbStructures?.length);
  console.log('  Representative PDB:', structCtx.representativePdb?.pdbId);
  console.log('  AlphaFold model:', structCtx.alphaFoldModel?.entryId);
  console.log('  AlphaFold residue pLDDT:', structCtx.residuePlddt);

  const preds = await getFunctionalPredictionsForVariant(varInfo, protCtx);
  console.log('\nComputational Predictions:');
  console.log('  VEP predictions count:', Object.keys(preds.predictionsByAllele || {}).length);

  const recon = reconcileVariantEvidence(varInfo, clinvar, protCtx, structCtx, preds);
  console.log('\nReconciliation Status:');
  console.log('  overallStatus:', recon.overallStatus);
  console.log('  discrepancies:', recon.discrepancies);

  const summary = generateEvidenceSummary(varInfo, clinvar, protCtx, structCtx, preds, recon, 0);
  console.log('\nStage 14 Generated Evidence Summary:');
  console.log('  available:', summary.available);
  console.log('  variantIdentity:', summary.variantIdentity);
  console.log('  molecularConsequence:', summary.molecularConsequence);
  console.log('  scientificTakeaway:\n   ', summary.scientificTakeaway);
}

checkLiveRs121913343().catch(err => {
  console.error('Error during live check:', err);
  process.exit(1);
});
