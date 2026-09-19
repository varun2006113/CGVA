/**
 * Variant Service
 * Live resolution of a specific variant identifier (RefSNP rsID) using official NCBI dbSNP E-utilities API.
 * NO DEMO_CACHE, NO hardcoded fallbacks.
 */

const NCBI_EUTILS_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

/**
 * Resolve a RefSNP rsID to normalized variant identity details via NCBI.
 * @param {string} identifier - e.g. "rs28934578", "rs121913343"
 * @returns {Promise<{ query: string, isDemoData: boolean, variant: Object|null, error: string|null }>}
 */
export async function getVariantInfo(identifier) {
  if (!identifier || typeof identifier !== 'string') {
    return {
      query: identifier || '',
      isDemoData: false,
      variant: null,
      error: 'Missing variant identifier parameter'
    };
  }

  const cleanQuery = identifier.trim();
  const cleanNum = cleanQuery.replace(/^rs/i, '').trim();

  // Validate rsID format: must be numeric digits
  if (!/^\d+$/.test(cleanNum)) {
    console.log(`[variantService] Invalid rsID format: "${cleanQuery}"`);
    return {
      query: cleanQuery,
      isDemoData: false,
      variant: null,
      error: 'Variant could not be resolved using NCBI.'
    };
  }

  const formattedRsid = `rs${cleanNum}`;
  console.log(`[variantService] Resolving RefSNP from NCBI dbSNP: "${formattedRsid}"`);

  try {
    const url = `${NCBI_EUTILS_BASE}/esummary.fcgi?db=snp&id=${cleanNum}&retmode=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!res.ok) {
      console.warn(`[variantService Warning] NCBI dbSNP status ${res.status} for "${formattedRsid}"`);
      return {
        query: cleanQuery,
        isDemoData: false,
        variant: null,
        error: 'Variant could not be resolved using NCBI.'
      };
    }

    const json = await res.json();
    const rawItem = json.result?.[cleanNum];

    // Check if record exists and has valid attributes
    if (!rawItem || rawItem.error || (!rawItem.genes && !rawItem.chr && !rawItem.snp_class)) {
      console.log(`[variantService] NCBI dbSNP record not found for "${formattedRsid}"`);
      return {
        query: cleanQuery,
        isDemoData: false,
        variant: null,
        error: 'Variant could not be resolved using NCBI.'
      };
    }

    // Parse NCBI dbSNP summary record
    const variantClass = rawItem.snp_class || 'snv';

    // Gene Association from NCBI record
    const geneObj = rawItem.genes?.[0];
    const geneSymbol = geneObj?.name || null;
    const entrezId = geneObj?.gene_id ? String(geneObj.gene_id) : null;

    // Genomic location
    const chromosome = rawItem.chr || null;
    const refSeqAcc = rawItem.acc || null;

    let position = null;
    if (rawItem.chrpos) {
      const parts = rawItem.chrpos.split(':');
      position = parts[1] || parts[0];
    }

    // Ref & Alt alleles from SPDI or docsum
    let referenceAllele = null;
    let alternateAlleles = [];

    if (rawItem.spdi) {
      const spdiItems = rawItem.spdi.split(',');
      for (const item of spdiItems) {
        const parts = item.split(':');
        if (parts.length >= 4) {
          if (!referenceAllele) referenceAllele = parts[2];
          if (parts[3] && !alternateAlleles.includes(parts[3])) {
            alternateAlleles.push(parts[3]);
          }
        }
      }
    }

    if (!referenceAllele && rawItem.docsum) {
      const matchSeq = rawItem.docsum.match(/SEQ=\[([^\]]+)\]/);
      if (matchSeq) {
        const parts = matchSeq[1].split('/');
        referenceAllele = parts[0] || null;
        alternateAlleles = parts.slice(1);
      }
    }

    // Extract HGVS expressions from docsum
    let genomicHgvs = null;
    let codingHgvs = null;
    let proteinHgvs = null;

    if (rawItem.docsum) {
      const hgvsMatch = rawItem.docsum.match(/HGVS=([^|]+)/);
      if (hgvsMatch) {
        const hgvsItems = hgvsMatch[1].split(',');
        for (const hgvs of hgvsItems) {
          if (!genomicHgvs && (hgvs.includes(':g.') || hgvs.startsWith('NC_'))) {
            genomicHgvs = hgvs;
          } else if (!codingHgvs && (hgvs.includes(':c.') || hgvs.startsWith('NM_'))) {
            codingHgvs = hgvs;
          } else if (!proteinHgvs && (hgvs.includes(':p.') || hgvs.startsWith('NP_'))) {
            proteinHgvs = hgvs;
          }
        }
      }
    }

    console.log(`[variantService] Successfully resolved "${formattedRsid}" to gene "${geneSymbol}" (Gene ID: ${entrezId})`);

    return {
      query: cleanQuery,
      isDemoData: false,
      variant: {
        rsid: formattedRsid,
        type: variantClass,
        gene: {
          symbol: geneSymbol,
          entrezId: entrezId
        },
        genomic: {
          assembly: 'GRCh38',
          chromosome: chromosome,
          refSeqAccession: refSeqAcc,
          position: position,
          reference: referenceAllele,
          alternate: alternateAlleles.join(', ') || null
        },
        hgvs: {
          genomic: genomicHgvs,
          coding: codingHgvs,
          protein: proteinHgvs
        }
      },
      error: null
    };
  } catch (err) {
    console.warn(`[variantService Warning] Error fetching "${formattedRsid}":`, err.message);
    return {
      query: cleanQuery,
      isDemoData: false,
      variant: null,
      error: 'Variant could not be resolved using NCBI.'
    };
  }
}
