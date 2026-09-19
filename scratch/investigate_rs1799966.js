import { getVariantInfo } from '../api/services/variantService.js';
import { getClinVarForVariant } from '../api/services/clinvarService.js';
import { getProteinContextForVariant } from '../api/services/proteinContextService.js';

async function investigateRs1799966() {
  console.log("==========================================");
  console.log("Investigating rs1799966 across services");
  console.log("==========================================");

  // 1. NCBI Variant Service
  const ncbiRes = await getVariantInfo('rs1799966');
  console.log("\n1. NCBI dbSNP Result:");
  console.dir(ncbiRes.variant, { depth: null });

  const resolvedVariant = {
    found: true,
    rsid: ncbiRes.variant.rsid,
    type: ncbiRes.variant.type,
    geneSymbol: ncbiRes.variant.gene?.symbol,
    entrezId: ncbiRes.variant.gene?.entrezId,
    assembly: ncbiRes.variant.genomic?.assembly,
    chromosome: ncbiRes.variant.genomic?.chromosome,
    refSeqAccession: ncbiRes.variant.genomic?.refSeqAccession,
    genomicPosition: ncbiRes.variant.genomic?.position,
    referenceAllele: ncbiRes.variant.genomic?.reference,
    alleles: ncbiRes.variant.genomic?.alternate ? ncbiRes.variant.genomic.alternate.split(', ') : [],
    genomicHgvs: ncbiRes.variant.hgvs?.genomic,
    codingHgvs: ncbiRes.variant.hgvs?.coding,
    proteinHgvs: ncbiRes.variant.hgvs?.protein
  };

  // 2. ClinVar
  const cvRes = await getClinVarForVariant(resolvedVariant);
  console.log("\n2. ClinVar Result:");
  console.dir(cvRes, { depth: null });

  // 3. Protein Context
  const pcRes = await getProteinContextForVariant(resolvedVariant);
  console.log("\n3. Protein Context Result:");
  console.dir(pcRes, { depth: null });

  // 4. Raw Ensembl VEP API
  console.log("\n4. Fetching raw Ensembl VEP for rs1799966...");
  const vepUrl = 'https://rest.ensembl.org/vep/human/id/rs1799966?content-type=application/json&CADD=1&dbNSFP=AlphaMissense_pred,AlphaMissense_score';
  const vepRes = await fetch(vepUrl, { headers: { 'Accept': 'application/json' } });
  const vepJson = await vepRes.json();

  console.log("VEP Top-level fields:", Object.keys(vepJson[0] || {}));
  console.log("VEP Allele string:", vepJson[0]?.allele_string);
  console.log("VEP Most severe consequence:", vepJson[0]?.most_severe_consequence);
  
  const tcs = vepJson[0]?.transcript_consequences || [];
  console.log(`VEP total transcript consequences: ${tcs.length}`);
  
  // Group by transcript and allele
  tcs.forEach((tc, idx) => {
    if (tc.gene_symbol === 'BRCA1' || idx < 10) {
      console.log(`  [TC ${idx}] Gene: ${tc.gene_symbol} | Tx: ${tc.transcript_id} (Canonical: ${tc.canonical}) | Alt: ${tc.variant_allele} | c.HGVS: ${tc.hgvsc} | p.HGVS: ${tc.hgvsp} | AminoAcids: ${tc.amino_acids} | Codons: ${tc.codons}`);
    }
  });
}

investigateRs1799966();
