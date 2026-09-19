async function inspectVepTranscripts() {
  const url = 'https://rest.ensembl.org/vep/human/id/rs1799966?content-type=application/json&CADD=1&dbNSFP=AlphaMissense_pred,AlphaMissense_score&hgvs=1';
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  const json = await res.json();
  const obj = json[0];

  console.log("Variant ID:", obj.id);
  console.log("Assembly:", obj.assembly_name);
  console.log("Location:", `${obj.seq_region_name}:${obj.start}-${obj.end}`);
  console.log("Allele string:", obj.allele_string);
  console.log("Most severe consequence:", obj.most_severe_consequence);

  const tcs = obj.transcript_consequences || [];
  console.log(`\nTotal transcript consequences: ${tcs.length}`);

  const canonicalTcs = tcs.filter(t => t.canonical === 1);
  console.log(`Canonical transcript consequences count: ${canonicalTcs.length}`);
  canonicalTcs.forEach(tc => {
    console.log(`\n[CANONICAL] Gene: ${tc.gene_symbol} (${tc.gene_id}) | Tx: ${tc.transcript_id} | Alt: ${tc.variant_allele}`);
    console.log(`  c.HGVS: ${tc.hgvsc}`);
    console.log(`  p.HGVS: ${tc.hgvsp}`);
    console.log(`  Amino acids: ${tc.amino_acids} | Codons: ${tc.codons} | Protein pos: ${tc.protein_start}`);
    console.log(`  SIFT: ${tc.sift_prediction} (${tc.sift_score}) | PolyPhen: ${tc.polyphen_prediction} (${tc.polyphen_score})`);
    console.log(`  AlphaMissense: ${tc.alphamissense_pred} (${tc.alphamissense_score}) | CADD: ${tc.cadd_phred}`);
  });

  // Also search for transcript ENST00000357654 or NM_007300 or NM_007294
  console.log("\nSearching for ENST00000357654 (BRCA1 MANE Select transcript):");
  tcs.filter(t => t.transcript_id === 'ENST00000357654').forEach(tc => {
    console.log(`  Tx: ${tc.transcript_id} | Alt: ${tc.variant_allele} | c.HGVS: ${tc.hgvsc} | p.HGVS: ${tc.hgvsp} | Amino acids: ${tc.amino_acids}`);
  });
}

inspectVepTranscripts();
