/**
 * Comparison Service (Stage 11)
 * Analyzes independently retrieved multi-omic evidence for Variant A and Variant B.
 * Computes factual commonalities and differences without ranking or scoring.
 */

/**
 * Compare two resolved variant payloads and compute shared characteristics & differences
 * @param {Object} payloadA - Full evidence object for Variant A
 * @param {Object} payloadB - Full evidence object for Variant B
 * @returns {Object} Comparison summary
 */
export function analyzeVariantComparison(payloadA, payloadB) {
  const varA = payloadA?.variant;
  const varB = payloadB?.variant;

  if (!varA && !varB) {
    return {
      sameRsid: false,
      isPartial: false,
      shared: [],
      differences: [],
      summaryNote: 'Neither variant could be resolved.'
    };
  }

  if (!varA || !varB) {
    return {
      sameRsid: false,
      isPartial: true,
      validVariant: varA ? 'Variant A' : 'Variant B',
      invalidVariant: varA ? 'Variant B' : 'Variant A',
      shared: [],
      differences: [`Only ${varA ? 'Variant A' : 'Variant B'} was successfully resolved.`],
      summaryNote: 'Partial comparison: One variant could not be resolved.'
    };
  }

  const rsidA = varA.rsid;
  const rsidB = varB.rsid;
  const sameRsid = rsidA && rsidB && rsidA.toLowerCase() === rsidB.toLowerCase();

  if (sameRsid) {
    return {
      sameRsid: true,
      isPartial: false,
      shared: [
        `Same RefSNP Identifier: ${rsidA}`,
        `Same Gene: ${varA.gene?.symbol || 'N/A'}`,
        `Same Chromosome: ${varA.genomic?.chromosome || 'N/A'}`,
        `Same Position: ${varA.genomic?.position || 'N/A'}`
      ],
      differences: [],
      summaryNote: `Both inputs resolve to the exact same RefSNP identifier (${rsidA}).`
    };
  }

  const shared = [];
  const differences = [];

  // 1. Gene Symbol
  const geneA = varA.gene?.symbol || 'N/A';
  const geneB = varB.gene?.symbol || 'N/A';
  if (geneA === geneB && geneA !== 'N/A') {
    shared.push(`Same Gene (${geneA})`);
  } else {
    differences.push(`Different Genes (${geneA} vs ${geneB})`);
  }

  // 2. Chromosome & Position
  const chromA = varA.genomic?.chromosome || 'N/A';
  const chromB = varB.genomic?.chromosome || 'N/A';
  const posA = varA.genomic?.position || 'N/A';
  const posB = varB.genomic?.position || 'N/A';

  if (chromA === chromB && chromA !== 'N/A') {
    shared.push(`Same Chromosome (chr${chromA})`);
  } else {
    differences.push(`Different Chromosomes (chr${chromA} vs chr${chromB})`);
  }

  if (posA === posB && posA !== 'N/A') {
    shared.push(`Same Genomic Position (${posA})`);
  } else {
    differences.push(`Different Genomic Positions (${posA} vs ${posB})`);
  }

  // 3. Variant Class / Type
  const typeA = varA.type || 'snv';
  const typeB = varB.type || 'snv';
  if (typeA === typeB) {
    shared.push(`Same Variant Class (${typeA.toUpperCase()})`);
  } else {
    differences.push(`Different Variant Classes (${typeA.toUpperCase()} vs ${typeB.toUpperCase()})`);
  }

  // 4. UniProt Accession & Protein Context
  const uniprotA = payloadA.proteinContext?.uniprotAccession || null;
  const uniprotB = payloadB.proteinContext?.uniprotAccession || null;
  if (uniprotA && uniprotB && uniprotA === uniprotB) {
    shared.push(`Same UniProt Protein (${uniprotA})`);
  } else if (uniprotA && uniprotB) {
    differences.push(`Different UniProt Proteins (${uniprotA} vs ${uniprotB})`);
  }

  // 5. Protein Position
  const protPosA = payloadA.proteinContext?.proteinPosition || null;
  const protPosB = payloadB.proteinContext?.proteinPosition || null;
  if (protPosA !== null && protPosB !== null) {
    if (protPosA === protPosB) {
      shared.push(`Same Protein Residue Position (${protPosA})`);
    } else {
      differences.push(`Different Protein Residue Positions (Residue ${protPosA} vs Residue ${protPosB})`);
    }
  }

  // 6. Protein Change (HGVS)
  const pHgvsA = varA.hgvs?.protein || payloadA.proteinContext?.proteinHgvs || 'N/A';
  const pHgvsB = varB.hgvs?.protein || payloadB.proteinContext?.proteinHgvs || 'N/A';
  if (pHgvsA === pHgvsB && pHgvsA !== 'N/A') {
    shared.push(`Same Protein Change (${pHgvsA})`);
  } else if (pHgvsA !== 'N/A' && pHgvsB !== 'N/A') {
    differences.push(`Different Protein Changes (${pHgvsA} vs ${pHgvsB})`);
  }

  // 7. Structural Data Availability
  const pdbCountA = payloadA.structuralContext?.summary?.coveringPdbCount ?? payloadA.structuralContext?.totalPdbCount ?? 0;
  const pdbCountB = payloadB.structuralContext?.summary?.coveringPdbCount ?? payloadB.structuralContext?.totalPdbCount ?? 0;
  if (pdbCountA > 0 && pdbCountB > 0) {
    shared.push('Experimental PDB structures available for both variants');
  }
  if (pdbCountA !== pdbCountB) {
    differences.push(`PDB Residue Coverage: ${pdbCountA} structures (Variant A) vs ${pdbCountB} structures (Variant B)`);
  }

  const afPlddtA = payloadA.structuralContext?.summary?.residuePlddt ?? null;
  const afPlddtB = payloadB.structuralContext?.summary?.residuePlddt ?? null;
  if (afPlddtA !== null && afPlddtB !== null && afPlddtA !== afPlddtB) {
    differences.push(`AlphaFold Residue pLDDT: ${afPlddtA} (Variant A) vs ${afPlddtB} (Variant B)`);
  }

  // 8. Reconciliation Status
  const statusA = payloadA.reconciliation?.status || 'N/A';
  const statusB = payloadB.reconciliation?.status || 'N/A';
  if (statusA === statusB && statusA !== 'N/A') {
    shared.push(`Same Evidence Reconciliation Status (${statusA})`);
  } else if (statusA !== 'N/A' && statusB !== 'N/A') {
    differences.push(`Reconciliation Status: ${statusA} (Variant A) vs ${statusB} (Variant B)`);
  }

  return {
    sameRsid: false,
    isPartial: false,
    shared,
    differences,
    summaryNote: `Comparing ${rsidA} (${geneA}) against ${rsidB} (${geneB}).`
  };
}
