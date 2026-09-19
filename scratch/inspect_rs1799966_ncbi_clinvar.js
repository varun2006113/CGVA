import { getVariantInfo } from '../api/services/variantService.js';
import { getClinVarForVariant } from '../api/services/clinvarService.js';
import { getProteinContextForVariant } from '../api/services/proteinContextService.js';

async function testNcbiClinVar() {
  const vRes = await getVariantInfo('rs1799966');
  console.log("NCBI raw docsum / hgvs:", vRes.variant.hgvs);
  console.log("NCBI genomic alt:", vRes.variant.genomic);

  const cvRes = await getClinVarForVariant({
    found: true,
    rsid: 'rs1799966',
    geneSymbol: 'BRCA1'
  });

  console.log("\nClinVar records for rs1799966:");
  (cvRes.classifications || []).forEach((c, i) => {
    console.log(`\n[Record ${i+1}] Title: "${c.title}"`);
    console.log(`  Significance: ${c.clinicalSignificance}`);
    console.log(`  c.HGVS: ${c.codingHgvs} | p.HGVS: ${c.proteinHgvs}`);
    console.log(`  Variation ID: ${c.variationId}`);
  });
}

testNcbiClinVar();
