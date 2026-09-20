import { fetchNcbi } from './ncbiService.js';

const NCBI_EUTILS_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const NCBI_VARIATION_BASE = 'https://api.ncbi.nlm.nih.gov/variation/v0';

/**
 * Helper to fetch and parse NCBI dbSNP summary for a numeric rsID.
 */
async function resolveDbSnpRecord(cleanNum, originalQuery) {
  const formattedRsid = `rs${cleanNum}`;
  console.log(`[variantService] Resolving RefSNP from NCBI dbSNP: "${formattedRsid}"`);

  try {
    const url = `${NCBI_EUTILS_BASE}/esummary.fcgi?db=snp&id=${cleanNum}&retmode=json`;
    const res = await fetchNcbi(url, { timeoutMs: 8000 });

    if (!res || !res.ok) {
      console.warn(`[variantService Warning] NCBI dbSNP status ${res?.status} for "${formattedRsid}"`);
      return null;
    }

    const json = await res.json();
    const rawItem = json.result?.[cleanNum];

    if (!rawItem || rawItem.error || (!rawItem.genes && !rawItem.chr && !rawItem.snp_class)) {
      console.log(`[variantService] NCBI dbSNP record not found for "${formattedRsid}"`);
      return null;
    }

    const variantClass = rawItem.snp_class || 'snv';
    const geneObj = rawItem.genes?.[0];
    const geneSymbol = geneObj?.name || null;
    const entrezId = geneObj?.gene_id ? String(geneObj.gene_id) : null;
    const chromosome = rawItem.chr || null;
    const refSeqAcc = rawItem.acc || null;

    let position = null;
    if (rawItem.chrpos) {
      const parts = rawItem.chrpos.split(':');
      position = parts[1] || parts[0];
    }

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

    // Set appropriate HGVS field if originalQuery was an HGVS expression
    if (originalQuery && !originalQuery.startsWith('rs')) {
      if (originalQuery.includes(':c.') || originalQuery.startsWith('NM_')) {
        codingHgvs = originalQuery;
      } else if (originalQuery.includes(':g.') || originalQuery.startsWith('NC_')) {
        genomicHgvs = originalQuery;
      } else if (originalQuery.includes(':p.') || originalQuery.startsWith('NP_')) {
        proteinHgvs = originalQuery;
      }
    }

    console.log(`[variantService] Successfully resolved "${originalQuery || formattedRsid}" to gene "${geneSymbol}" (rsID: ${formattedRsid})`);

    return {
      query: originalQuery || formattedRsid,
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
    console.warn(`[variantService Warning] Error resolving dbSNP "${formattedRsid}":`, err.message);
    return null;
  }
}

/**
 * Resolve an HGVS expression (coding, genomic, or protein) via NCBI ClinVar & Variation Services SPDI API.
 */
async function resolveHgvsViaNcbi(hgvsString) {
  console.log(`[variantService] Resolving HGVS identifier via NCBI APIs: "${hgvsString}"`);

  // 1. Try ClinVar search to map HGVS string to ClinVar record & linked dbSNP rsID
  try {
    const cvSearchUrl = `${NCBI_EUTILS_BASE}/esearch.fcgi?db=clinvar&term=${encodeURIComponent(hgvsString)}&retmode=json`;
    const cvRes = await fetchNcbi(cvSearchUrl, { timeoutMs: 8000 });

    if (cvRes && cvRes.ok) {
      const cvData = await cvRes.json();
      const idList = cvData?.esearchresult?.idlist || [];

      if (idList.length > 0) {
        const targetIds = idList.slice(0, 5);
        const sumUrl = `${NCBI_EUTILS_BASE}/esummary.fcgi?db=clinvar&id=${targetIds.join(',')}&retmode=json`;
        const sumRes = await fetchNcbi(sumUrl, { timeoutMs: 8000 });

        if (sumRes && sumRes.ok) {
          const sumData = await sumRes.json();
          for (const id of targetIds) {
            const item = sumData?.result?.[id];
            if (item?.variation_set?.[0]?.variation_xrefs) {
              const dbSnp = item.variation_set[0].variation_xrefs.find(x => x.db_source === 'dbSNP');
              if (dbSnp) {
                const rsNum = dbSnp.db_id.replace(/^rs/i, '').trim();
                if (/^\d+$/.test(rsNum)) {
                  console.log(`[variantService] HGVS "${hgvsString}" mapped via ClinVar ID ${id} to RefSNP rs${rsNum}`);
                  const resolved = await resolveDbSnpRecord(rsNum, hgvsString);
                  if (resolved && resolved.variant) {
                    return resolved;
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (cvErr) {
    console.warn(`[variantService Warning] ClinVar HGVS mapping attempt failed for "${hgvsString}":`, cvErr.message);
  }

  // 2. Try NCBI Variation Services SPDI API for direct HGVS resolution
  try {
    const ctxUrl = `${NCBI_VARIATION_BASE}/hgvs/${encodeURIComponent(hgvsString)}/contextuals`;
    const ctxRes = await fetchNcbi(ctxUrl, { timeoutMs: 8000 });

    if (ctxRes && ctxRes.ok) {
      const ctxJson = await ctxRes.json();
      const spdiObj = ctxJson?.data?.spdis?.[0];

      if (spdiObj && spdiObj.seq_id) {
        const spdiStr = `${spdiObj.seq_id}:${spdiObj.position}:${spdiObj.deleted_sequence}:${spdiObj.inserted_sequence}`;
        console.log(`[variantService] NCBI Variation Services resolved HGVS to SPDI: "${spdiStr}"`);

        // Query canonical representative genomic SPDI
        let genSeqId = spdiObj.seq_id;
        let genPos = spdiObj.position;
        let genRef = spdiObj.deleted_sequence;
        let genAlt = spdiObj.inserted_sequence;

        try {
          const canonUrl = `${NCBI_VARIATION_BASE}/spdi/${encodeURIComponent(spdiStr)}/canonical_representative`;
          const canonRes = await fetchNcbi(canonUrl, { timeoutMs: 6000 });
          if (canonRes && canonRes.ok) {
            const canonJson = await canonRes.json();
            if (canonJson?.data?.seq_id) {
              genSeqId = canonJson.data.seq_id;
              genPos = canonJson.data.position;
              genRef = canonJson.data.deleted_sequence;
              genAlt = canonJson.data.inserted_sequence;
            }
          }
        } catch (canonErr) {}

        const chr = genSeqId.includes('NC_') ? genSeqId.replace(/NC_0+/, '').split('.')[0] : null;

        let genomicHgvs = hgvsString.includes(':g.') ? hgvsString : `${genSeqId}:g.${genPos}${genRef}>${genAlt}`;
        let codingHgvs = hgvsString.includes(':c.') ? hgvsString : null;
        let proteinHgvs = hgvsString.includes(':p.') ? hgvsString : null;

        return {
          query: hgvsString,
          isDemoData: false,
          variant: {
            rsid: hgvsString,
            type: 'snv',
            gene: {
              symbol: null,
              entrezId: null
            },
            genomic: {
              assembly: 'GRCh38',
              chromosome: chr,
              refSeqAccession: genSeqId,
              position: String(genPos),
              reference: genRef,
              alternate: genAlt
            },
            hgvs: {
              genomic: genomicHgvs,
              coding: codingHgvs,
              protein: proteinHgvs
            }
          },
          error: null
        };
      }
    }
  } catch (ctxErr) {
    console.warn(`[variantService Warning] NCBI Variation Services HGVS resolution failed for "${hgvsString}":`, ctxErr.message);
  }

  return null;
}

/**
 * Resolve a RefSNP rsID or HGVS string to normalized variant identity details via NCBI.
 * @param {string} identifier - e.g. "rs28934578", "NM_000546.6:c.524G>A", "NC_000017.11:g.7675088C>T", "NP_000537.3:p.Arg175His"
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

  // Case 1: Numeric rsID (e.g. rs28934578)
  if (/^\d+$/.test(cleanNum)) {
    const resolvedRsid = await resolveDbSnpRecord(cleanNum, cleanQuery);
    if (resolvedRsid) {
      return resolvedRsid;
    }
  }

  // Case 2: HGVS string (coding c., genomic g., protein p., or RefSeq accession variant)
  const resolvedHgvs = await resolveHgvsViaNcbi(cleanQuery);
  if (resolvedHgvs) {
    return resolvedHgvs;
  }

  console.log(`[variantService] Could not resolve variant identifier: "${cleanQuery}"`);
  return {
    query: cleanQuery,
    isDemoData: false,
    variant: null,
    error: 'Variant could not be resolved using NCBI.'
  };
}

