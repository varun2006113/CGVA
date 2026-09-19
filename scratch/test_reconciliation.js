import { getVariantInfo } from '../api/services/variantService.js';
import { getClinVarForVariant } from '../api/services/clinvarService.js';
import { getProteinContextForVariant } from '../api/services/proteinContextService.js';
import { getStructuralContextForVariant } from '../api/services/structureContextService.js';
import { getFunctionalPredictionsForVariant } from '../api/services/predictorService.js';
import { reconcileVariantEvidence } from '../api/services/reconciliationService.js';

async function testAllReconciliations() {
  const rsids = ['rs28934578', 'rs121913343', 'rs1799966', 'rs121913529', 'rs999999999999'];
  
  for (const rsid of rsids) {
    console.log(`\n==================================================`);
    console.log(`Testing Reconciliation for: ${rsid}`);
    console.log(`==================================================`);
    
    const ncbiRes = await getVariantInfo(rsid);
    if (!ncbiRes.variant) {
      console.log(`Variant ${rsid} not resolved / invalid.`);
      const rec = reconcileVariantEvidence(null, null, null, null, null);
      console.log("Reconciliation Result:", rec.status, rec.summary);
      continue;
    }

    const variant = ncbiRes.variant;
    const cvRes = await getClinVarForVariant(variant);
    const pcRes = await getProteinContextForVariant(variant, cvRes);
    const scRes = await getStructuralContextForVariant(variant, pcRes);
    const fpRes = await getFunctionalPredictionsForVariant(variant, pcRes);

    const reconciliation = reconcileVariantEvidence(variant, cvRes, pcRes, scRes, fpRes);
    
    console.log(`Overall Reconciliation Status: "${reconciliation.status}"`);
    console.log(`Genomic Locus: ${reconciliation.genomicLocus}`);
    console.log(`Primary Coding: ${reconciliation.primaryCodingHgvs} | Protein: ${reconciliation.primaryProteinHgvs}`);
    console.log(`Discrepancies (${reconciliation.discrepancies.length}):`);
    reconciliation.discrepancies.forEach(d => {
      console.log(`  - [${d.source}] ${d.type} (Allele ${d.allele}): ${d.detail}`);
    });

    console.log(`Normalized Alleles (${reconciliation.normalizedAlleles.length}):`);
    reconciliation.normalizedAlleles.forEach((na, idx) => {
      console.log(`  [Allele ${idx+1}: ${na.alternateAllele}] NCBI:${na.sources.ncbi.status} | ClinVar:${na.sources.clinvar.status} | UniProt:${na.sources.uniprot.status} | VEP:${na.sources.vep.status} (Tx: ${na.sources.vep.transcriptId})`);
    });
  }
}

testAllReconciliations();
