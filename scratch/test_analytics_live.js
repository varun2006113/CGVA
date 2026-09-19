import { getClinVarVariantsForGene } from '../api/services/clinvarService.js';
import { getProteinForGene } from '../api/services/uniprotService.js';

async function testLiveAnalytics(geneSymbol) {
  console.log(`\n==================================================`);
  console.log(`Testing Live Data Retrieval for Gene: ${geneSymbol}`);
  console.log(`==================================================`);

  const cvRes = await getClinVarVariantsForGene(geneSymbol, 50);
  console.log(`ClinVar Total Found in NCBI: ${cvRes.totalCount}`);
  console.log(`ClinVar Analyzed Records Returned: ${cvRes.variants?.length}`);

  if (cvRes.variants && cvRes.variants.length > 0) {
    console.log(`Sample Variant 1:`, cvRes.variants[0]);
  }

  const uniRes = await getProteinForGene(geneSymbol);
  console.log(`UniProt Accession: ${uniRes.protein?.accession}`);
  console.log(`UniProt Protein Length: ${uniRes.protein?.length}`);
  console.log(`UniProt Features/Domains Count: ${uniRes.protein?.features?.length || 0}`);
  if (uniRes.protein?.features) {
    console.log(`Sample Domains:`, uniRes.protein.features.filter(f => f.type === 'Domain' || f.type === 'Region' || f.type === 'Repeat'));
  }
}

async function run() {
  await testLiveAnalytics('TP53');
  await testLiveAnalytics('BRCA1');
  await testLiveAnalytics('KRAS');
  await testLiveAnalytics('NOTAREALGENE');
}

run();
