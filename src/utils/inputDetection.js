/**
 * Input detection utility for Cancer Genomic Variant Explorer (CGVE).
 *
 * Classifies search inputs into one of six supported types:
 * 1. GENE (e.g., TP53, BRCA1, BRCA2, KRAS, EGFR, BRAF)
 * 2. RSID (e.g., rs28934578, rs121913343)
 * 3. HGVS_GENOMIC (e.g., NC_000017.11:g.7675088C>T)
 * 4. HGVS_CODING (e.g., NM_000546.6:c.524G>A)
 * 5. HGVS_PROTEIN (e.g., NP_000537.3:p.Arg175His)
 * 6. UNKNOWN
 */

export function detectInputType(input) {
  if (!input || typeof input !== 'string') {
    return 'UNKNOWN';
  }

  const query = input.trim();
  if (!query) return 'UNKNOWN';

  // 1. RSID (e.g. rs28934578, rs121913343)
  if (/^rs\d+$/i.test(query)) {
    return 'RSID';
  }

  // 2. HGVS Genomic (e.g. NC_000017.11:g.7675088C>T or g.7675088C>T)
  if (/^(NC_\d+\.\d+:)?g\.\d+.*$/i.test(query)) {
    return 'HGVS_GENOMIC';
  }

  // 3. HGVS Coding (e.g. NM_000546.6:c.524G>A or c.524G>A)
  if (/^(NM_\d+\.\d+:)?c\.\d+.*$/i.test(query)) {
    return 'HGVS_CODING';
  }

  // 4. HGVS Protein (e.g. NP_000537.3:p.Arg175His or p.Arg175His or p.R175H or TP53:p.R175H)
  if (/^([A-Z0-9_.]+:)?p\.[A-Za-z0-9_*=]+$/i.test(query)) {
    return 'HGVS_PROTEIN';
  }

  // 5. Standard Gene Symbol (e.g. TP53, BRCA1, BRCA2, KRAS, EGFR, BRAF)
  if (/^[A-Za-z][A-Za-z0-9\-_]{0,11}$/i.test(query)) {
    return 'GENE';
  }

  return 'UNKNOWN';
}

/**
 * Returns human-readable label for detected input type
 */
export function getDetectionLabel(type) {
  switch (type) {
    case 'GENE':
      return 'Gene Symbol';
    case 'RSID':
      return 'dbSNP Identifier (rsID)';
    case 'HGVS_GENOMIC':
      return 'HGVS Genomic Variant';
    case 'HGVS_CODING':
      return 'HGVS Coding Transcript';
    case 'HGVS_PROTEIN':
      return 'HGVS Protein Change';
    default:
      return 'Unrecognized Format';
  }
}
