import { getVariantInfo } from '../api/services/variantService.js';
import { getClinVarForVariant } from '../api/services/clinvarService.js';
import { getProteinContextForVariant } from '../api/services/proteinContextService.js';
import { getStructuralContextForVariant } from '../api/services/structureContextService.js';
import { getFunctionalPredictionsForVariant } from '../api/services/predictorService.js';
import { reconcileVariantEvidence } from '../api/services/reconciliationService.js';

async function testVariantReconciliation(rsid) {
  console.log(`\n==================================================`);
  console.log(`Verifying Stage 10 Reconciliation for: ${rsid}`);
  console.log(`==================================================`);

  const ncbiRes = await getVariantInfo(rsid);
  if (!ncbiRes.variant) {
    console.log(`Variant ${rsid} not resolved / invalid.`);
    const rec = reconcileVariantEvidence(null, null, null, null, null);
    console.log("Reconciliation Result for Invalid Variant:", rec.status, `(Summary: "${rec.summary}")`);
    return;
  }

  const variant = ncbiRes.variant;
  const cvRes = await getClinVarForVariant(variant);
  const pcRes = await getProteinContextForVariant(variant, cvRes);
  const scRes = await getStructuralContextForVariant(variant, pcRes);
  const fpRes = await getFunctionalPredictionsForVariant(variant, pcRes);

  const reconciliation = reconcileVariantEvidence(variant, cvRes, pcRes, scRes, fpRes);

  console.log(`Gene: ${reconciliation.geneSymbol} | RSID: ${reconciliation.rsid}`);
  console.log(`Genomic Locus: ${reconciliation.genomicLocus}`);
  console.log(`Primary RefSeq Coding: ${reconciliation.primaryCodingHgvs}`);
  console.log(`Primary RefSeq Protein: ${reconciliation.primaryProteinHgvs}`);
  console.log(`Overall Reconciliation Status: "${reconciliation.status}"`);

  console.log(`Discrepancies Count: ${reconciliation.discrepancies.length}`);
  reconciliation.discrepancies.forEach((d, idx) => {
    console.log(`  [Discrepancy ${idx+1}] Source: ${d.source} | Type: ${d.type} | Allele: ${d.allele}`);
    console.log(`    Detail: ${d.detail}`);
  });

  console.log(`Normalized Alleles Count: ${reconciliation.normalizedAlleles.length}`);
  reconciliation.normalizedAlleles.forEach((na, idx) => {
    console.log(`\n  --- Allele ${idx+1}: ${na.alternateAllele} (${na.proteinHgvs || na.codingHgvs}) ---`);
    console.log(`    NCBI:    ${na.sources.ncbi.status.padEnd(12)} | ${na.sources.ncbi.details}`);
    console.log(`    ClinVar: ${na.sources.clinvar.status.padEnd(12)} | Matched Records: ${na.sources.clinvar.matchedRecordsCount}`);
    console.log(`    UniProt: ${na.sources.uniprot.status.padEnd(12)} | ${na.sources.uniprot.note || 'N/A'}`);
    console.log(`    VEP:     ${na.sources.vep.status.padEnd(12)} | Tx: ${na.sources.vep.transcriptId} (${na.sources.vep.proteinHgvs})`);
  });
}

async function runAll() {
  await testVariantReconciliation('rs28934578');
  await testVariantReconciliation('rs121913343');
  await testVariantReconciliation('rs1799966');
  await testVariantReconciliation('rs121913529');
  await testVariantReconciliation('rs999999999999');
}

runAll();
