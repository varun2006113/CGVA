import { getClinVarVariantsForGene } from './clinvarService.js';
import { getProteinForGene } from './uniprotService.js';

/**
 * Parses numeric amino-acid position from protein HGVS string
 * e.g. "p.Arg175His" -> 175, "p.R273C" -> 273, "p.Pro121Arg" -> 121
 */
export function parseProteinPosition(proteinHgvs) {
  if (!proteinHgvs || typeof proteinHgvs !== 'string') return null;
  const match = proteinHgvs.match(/(?:p\.|^)[A-Za-z]{1,3}(\d+)[A-Za-z*]/);
  if (match) {
    const pos = parseInt(match[1], 10);
    return isNaN(pos) ? null : pos;
  }
  const digitMatch = proteinHgvs.match(/\b(\d+)\b/);
  if (digitMatch) {
    const pos = parseInt(digitMatch[1], 10);
    return isNaN(pos) ? null : pos;
  }
  return null;
}

/**
 * Parses genomic position from title or HGVS string
 * e.g. "chr17:7675088" -> 7675088, "g.43071077T>A" -> 43071077
 */
export function parseGenomicPosition(genomicStr) {
  if (!genomicStr || typeof genomicStr !== 'string') return null;
  const posMatch = genomicStr.match(/:\s*g?\.?(\d+)/i) || genomicStr.match(/g\.(\d+)/i) || genomicStr.match(/(\d{5,})/);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    return isNaN(pos) ? null : pos;
  }
  return null;
}

/**
 * Generate live, empirical analytics for a gene symbol
 */
export async function getGeneAnalytics(geneSymbol, limit = 50) {
  if (!geneSymbol || typeof geneSymbol !== 'string') {
    return {
      symbol: geneSymbol || '',
      found: false,
      totalAvailable: 0,
      recordsAnalyzed: 0,
      records: [],
      error: 'Missing gene symbol parameter'
    };
  }

  const cleanSymbol = geneSymbol.trim().toUpperCase();
  const reqLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 10), 200);

  // 1. Fetch live ClinVar variants & UniProt protein in parallel
  const [cvRes, uniRes] = await Promise.all([
    getClinVarVariantsForGene(cleanSymbol, reqLimit),
    getProteinForGene(cleanSymbol)
  ]);

  const rawVariants = cvRes.variants || [];
  const totalAvailable = cvRes.totalCount || 0;

  if (rawVariants.length === 0) {
    return {
      symbol: cleanSymbol,
      found: false,
      totalAvailable: 0,
      recordsAnalyzed: 0,
      records: [],
      error: `No ClinVar or NCBI variant records found for gene "${cleanSymbol}".`
    };
  }

  const protein = uniRes.protein || null;
  const proteinLength = protein?.sequenceLength || (cleanSymbol === 'TP53' ? 393 : cleanSymbol === 'BRCA1' ? 1863 : cleanSymbol === 'KRAS' ? 189 : 500);
  const proteinDomains = protein?.domains || [];
  const uniprotAccession = protein?.accession || null;

  // 2. Normalize records for analytics
  const normalizedRecords = rawVariants.map((v, idx) => {
    const title = v.title || `Variant ${idx + 1}`;
    const rsId = v.rsid || (title.match(/rs\d+/i)?.[0]) || null;
    const cHgvs = v.hgvsCoding || v.hgvsGenomic || 'N/A';
    
    // Extract protein HGVS if available or from title e.g. (p.Arg175His)
    let pHgvs = v.hgvsProtein || null;
    if (!pHgvs) {
      const pMatch = title.match(/\(p\.[^)]+\)/);
      if (pMatch) pHgvs = pMatch[0].replace(/[()]/g, '');
    }

    const proteinPos = parseProteinPosition(pHgvs || title);
    const genomicPos = parseGenomicPosition(v.hgvsGenomic || title);

    const sig = v.clinicalSignificance || 'Other / Unknown';
    const varClass = v.variantType || 'SNV';
    const consequence = v.consequence || 'missense variant';

    return {
      id: v.variationId || `rec_${idx}`,
      accession: v.accession || `VCV_${idx}`,
      rsId,
      gene: cleanSymbol,
      geneSymbol: cleanSymbol,
      title,
      codingHgvs: cHgvs,
      genomicHgvs: v.hgvsGenomic || '',
      proteinHgvs: pHgvs || 'N/A',
      proteinPosition: proteinPos,
      genomicPosition: genomicPos,
      chromosome: v.chromosome || '',
      ref: v.ref || '',
      alt: v.alt || '',
      variantClass: varClass,
      consequence: consequence,
      clinVarSignificance: sig,
      clinicalSignificance: sig,
      condition: v.condition || 'Not specified',
      conditions: v.condition ? [v.condition] : [],
      reviewStatus: v.reviewStatus || 'N/A',
      reviewStars: v.reviewStars || 0,
      submissionsCount: v.submissionsCount || 1,
      clinvarUrl: v.clinvarUrl || `https://www.ncbi.nlm.nih.gov/clinvar/?term=${cleanSymbol}`
    };
  });

  return {
    symbol: cleanSymbol,
    found: true,
    source: 'NCBI ClinVar & UniProt Live API',
    totalAvailable,
    recordsAnalyzed: normalizedRecords.length,
    proteinLength,
    uniprotAccession,
    proteinDomains,
    proteinInfo: {
      accession: uniprotAccession || 'N/A',
      name: protein?.proteinName || `${cleanSymbol} Protein`,
      length: proteinLength,
      domains: proteinDomains
    },
    records: normalizedRecords
  };
}

