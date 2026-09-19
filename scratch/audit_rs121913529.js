import { getVariantInfo } from '../api/services/variantService.js';
import { getClinVarForVariant } from '../api/services/clinvarService.js';
import { getProteinContextForVariant } from '../api/services/proteinContextService.js';
import { getStructuralContextForVariant } from '../api/services/structureContextService.js';
import { getFunctionalPredictionsForVariant } from '../api/services/predictorService.js';
import { reconcileVariantEvidence } from '../api/services/reconciliationService.js';
import { generateEvidenceSummary } from '../api/services/evidenceSummaryService.js';

async function auditRs121913529() {
  console.log('=== Live Audit for rs121913529 ===\n');

  // 1. Variant Info (NCBI dbSNP)
  const varInfo = await getVariantInfo('rs121913529');
  console.log('NCBI dbSNP Resolution:');
  console.log('  rsid:', varInfo.variant?.rsid);
  console.log('  gene symbol:', varInfo.variant?.gene?.symbol);
  console.log('  entrezId:', varInfo.variant?.gene?.entrezId);
  console.log('  chromosome:', varInfo.variant?.genomic?.chromosome);
  console.log('  position:', varInfo.variant?.genomic?.position);
  console.log('  ref allele:', varInfo.variant?.genomic?.reference);
  console.log('  alt alleles:', varInfo.variant?.genomic?.alternate);
  console.log('  genomic HGVS:', varInfo.variant?.hgvs?.genomic);
  console.log('  coding HGVS:', varInfo.variant?.hgvs?.coding);
  console.log('  protein HGVS:', varInfo.variant?.hgvs?.protein);

  // 2. ClinVar Evidence
  const clinvar = await getClinVarForVariant(varInfo.variant);
  console.log('\nClinVar Evidence:');
  console.log('  records count:', clinvar.records?.length);
  if (clinvar.records?.length > 0) {
    console.log('  first record title:', clinvar.records[0].title);
    console.log('  first record allele:', clinvar.records[0].allele);
    console.log('  first record significance:', clinvar.records[0].clinicalSignificance);
  }

  // 3. Protein Context (UniProt)
  const protCtx = await getProteinContextForVariant(varInfo.variant, clinvar);
  console.log('\nUniProt Protein Context:');
  console.log('  accession:', protCtx.protein?.accession);
  console.log('  name:', protCtx.protein?.proteinName);
  console.log('  geneSymbol:', protCtx.protein?.geneSymbol);
  console.log('  mappings count:', protCtx.mappings?.length);
  if (protCtx.mappings?.length > 0) {
    console.log('  first mapping:', protCtx.mappings[0]);
  }

  // 4. Structural Context (PDB & AlphaFold)
  const structCtx = await getStructuralContextForVariant(varInfo.variant, protCtx);
  console.log('\nStructural Context:');
  console.log('  uniprotAccession:', structCtx.uniprotAccession);
  console.log('  total PDB count:', structCtx.totalPdbCount);
  console.log('  covering PDB count:', structCtx.coveringPdbStructures?.length);
  console.log('  AlphaFold model:', structCtx.alphafold?.entryId);
  console.log('  AlphaFold residue pLDDT:', structCtx.alleleStructuralMappings?.[0]?.residuePlddt);

  // 5. Predictions (VEP)
  const preds = await getFunctionalPredictionsForVariant(varInfo.variant, protCtx);
  console.log('\nComputational Predictions:');
  console.log('  allelePredictions count:', preds.allelePredictions?.length);
  if (preds.allelePredictions?.length > 0) {
    console.log('  first pred:', preds.allelePredictions[0]);
  }

  // 6. Reconciliation & Stage 14 Summary
  const recon = reconcileVariantEvidence(varInfo.variant, clinvar, protCtx, structCtx, preds);
  const summary = generateEvidenceSummary(varInfo.variant, clinvar, protCtx, structCtx, preds, recon, 0);

  console.log('\nStage 14 Evidence Summary:');
  console.log('  gene:', summary.variantIdentity?.gene);
  console.log('  codingHGVS:', summary.variantIdentity?.codingHGVS);
  console.log('  proteinHGVS:', summary.variantIdentity?.proteinHGVS);
  console.log('  scientificTakeaway:\n  ', summary.scientificTakeaway);
}

auditRs121913529().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});
