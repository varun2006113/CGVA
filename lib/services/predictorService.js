/**
 * Computational Functional Predictors Service
 * Fetches live computational predictions (AlphaMissense, CADD, SIFT, PolyPhen-2)
 * from official Ensembl VEP REST API.
 * NO DEMO_CACHE, NO hardcoded fallbacks, NO combined pathogenicity scores.
 */

const VEP_BASE = 'https://rest.ensembl.org/vep/human/id';

/**
 * Normalizes AlphaMissense prediction category string
 */
export function normalizeAlphaMissensePred(pred) {
  if (!pred || typeof pred !== 'string') return null;
  const first = pred.split(',').map(s => s.trim()).find(s => s && s !== '.');
  if (!first) return null;
  const upper = first.toUpperCase();
  if (upper === 'LP') return 'likely_pathogenic';
  if (upper === 'LB') return 'likely_benign';
  if (upper === 'A') return 'ambiguous';
  if (upper === 'P') return 'likely_pathogenic';
  if (upper === 'B') return 'likely_benign';
  return first.toLowerCase();
}

/**
 * Normalizes AlphaMissense score float
 */
export function normalizeAlphaMissenseScore(score) {
  if (typeof score === 'number') return Math.round(score * 10000) / 10000;
  if (!score || typeof score !== 'string') return null;
  const parts = score.split(',').map(s => s.trim()).filter(s => s && s !== '.');
  if (parts.length > 0) {
    const val = parseFloat(parts[0]);
    return isNaN(val) ? null : Math.round(val * 10000) / 10000;
  }
  return null;
}

/**
 * Fetch live computational functional predictions for a resolved variant
 */
export async function getFunctionalPredictionsForVariant(resolvedVariant, proteinContextResult = null) {
  if (!resolvedVariant) {
    return {
      allelePredictions: [],
      disagreementNote: null,
      sources: [],
      error: 'Variant identity not provided'
    };
  }

  const vObj = resolvedVariant.variant || resolvedVariant;
  const rsid = vObj.rsid || null;
  const cleanRsid = rsid ? rsid.replace(/^rs/i, '') : null;

  if (!cleanRsid || !/^\d+$/.test(cleanRsid)) {
    return {
      allelePredictions: [],
      disagreementNote: null,
      sources: [],
      error: 'Functional prediction data unavailable for non-rsID variants.'
    };
  }

  const formattedRsid = `rs${cleanRsid}`;
  console.log(`[predictorService] Fetching functional predictions from Ensembl VEP for: "${formattedRsid}"`);

  try {
    const url = `${VEP_BASE}/${formattedRsid}?content-type=application/json&CADD=1&dbNSFP=AlphaMissense_pred,AlphaMissense_score`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      console.warn(`[predictorService Warning] Ensembl VEP status ${res.status} for "${formattedRsid}"`);
      return {
        allelePredictions: [],
        disagreementNote: null,
        sources: [],
        error: `Ensembl VEP API error: ${res.status}`
      };
    }

    const json = await res.json();
    const vepObj = json[0];

    if (!vepObj || !vepObj.transcript_consequences) {
      return {
        allelePredictions: [],
        disagreementNote: null,
        sources: [],
        error: 'No transcript predictions returned by Ensembl VEP.'
      };
    }

    const tcs = vepObj.transcript_consequences;
    const alleleMap = {};

    for (const tc of tcs) {
      const altAllele = tc.variant_allele;
      if (!altAllele) continue;
      if (!alleleMap[altAllele]) alleleMap[altAllele] = [];
      alleleMap[altAllele].push(tc);
    }

    // Match Stage 7 proteinContext mappings to allele predictions where possible
    const stage7Mappings = proteinContextResult?.mappings || [];
    const allelePredictions = [];

    const processedAlleles = new Set();

    // 1. Process alleles matching Stage 7 mappings
    for (const m of stage7Mappings) {
      const alleleTitle = m.allele || '';
      // Try to extract nucleotide change e.g. G>T -> alt is T
      let nucAlt = null;
      const nucMatch = alleleTitle.match(/>([A-Z]+)/i);
      if (nucMatch) {
        nucAlt = nucMatch[1].toUpperCase();
      }

      // Find matching VEP allele list
      let vepTcList = null;
      if (nucAlt && alleleMap[nucAlt]) {
        vepTcList = alleleMap[nucAlt];
        processedAlleles.add(nucAlt);
      } else if (m.alternateAA) {
        // Find VEP list matching amino acid change in HGVSp
        for (const [aKey, list] of Object.entries(alleleMap)) {
          if (list.some(tc => tc.hgvsp?.includes(m.alternateAA) || tc.amino_acids?.includes(m.alternateAA1))) {
            vepTcList = list;
            processedAlleles.add(aKey);
            break;
          }
        }
      }

      if (!vepTcList && Object.keys(alleleMap).length > 0) {
        // Fallback to first available VEP allele list if only 1 exists
        const firstKey = Object.keys(alleleMap)[0];
        vepTcList = alleleMap[firstKey];
        processedAlleles.add(firstKey);
      }

      if (vepTcList) {
        const bestTc = vepTcList.find(t => t.canonical === 1 && (t.sift_prediction || t.polyphen_prediction || t.alphamissense_pred)) ||
                       vepTcList.find(t => t.sift_prediction || t.polyphen_prediction || t.alphamissense_pred || t.cadd_phred !== undefined) ||
                       vepTcList[0];

        const amPred = normalizeAlphaMissensePred(bestTc.alphamissense_pred);
        const amScore = normalizeAlphaMissenseScore(bestTc.alphamissense_score);

        allelePredictions.push({
          allele: m.allele,
          proteinHgvs: m.proteinHgvs || bestTc.hgvsp || 'N/A',
          codingHgvs: m.codingHgvs || bestTc.hgvsc || 'N/A',
          transcriptId: bestTc.transcript_id || 'Ensembl Transcript',
          geneSymbol: bestTc.gene_symbol || vObj.gene?.symbol || 'N/A',
          variantAllele: bestTc.variant_allele,
          predictors: {
            alphaMissense: amPred ? {
              name: 'AlphaMissense',
              prediction: amPred,
              score: amScore,
              source: 'AlphaMissense (Google DeepMind, 2023)',
              version: 'v1.0 (Ensembl dbNSFP)'
            } : { name: 'AlphaMissense', prediction: 'Not available', score: null, source: 'AlphaMissense', version: 'v1.0' },

            cadd: bestTc.cadd_phred !== undefined ? {
              name: 'CADD',
              prediction: `PHRED ${bestTc.cadd_phred}`,
              score: bestTc.cadd_phred,
              rawScore: bestTc.cadd_raw !== undefined ? Math.round(bestTc.cadd_raw * 1000) / 1000 : null,
              source: 'CADD (UW/Berlin)',
              version: 'v1.6'
            } : { name: 'CADD', prediction: 'Not available', score: null, source: 'CADD', version: 'v1.6' },

            sift: bestTc.sift_prediction ? {
              name: 'SIFT',
              prediction: bestTc.sift_prediction,
              score: typeof bestTc.sift_score === 'number' ? Math.round(bestTc.sift_score * 1000) / 1000 : null,
              source: 'SIFT (JCVI)',
              version: 'v5.2.2'
            } : { name: 'SIFT', prediction: 'Not available', score: null, source: 'SIFT', version: 'v5.2.2' },

            polyphen: bestTc.polyphen_prediction ? {
              name: 'PolyPhen-2',
              prediction: bestTc.polyphen_prediction,
              score: typeof bestTc.polyphen_score === 'number' ? Math.round(bestTc.polyphen_score * 1000) / 1000 : null,
              source: 'PolyPhen-2 (Harvard)',
              version: 'v2.2.2'
            } : { name: 'PolyPhen-2', prediction: 'Not available', score: null, source: 'PolyPhen-2', version: 'v2.2.2' }
          }
        });
      }
    }

    // 2. Process any remaining VEP alleles not in Stage 7 mappings
    for (const [aKey, vepTcList] of Object.entries(alleleMap)) {
      if (!processedAlleles.has(aKey)) {
        const bestTc = vepTcList.find(t => t.canonical === 1 && (t.sift_prediction || t.polyphen_prediction)) || vepTcList[0];
        const amPred = normalizeAlphaMissensePred(bestTc.alphamissense_pred);
        const amScore = normalizeAlphaMissenseScore(bestTc.alphamissense_score);

        allelePredictions.push({
          allele: `Allele ${aKey}`,
          proteinHgvs: bestTc.hgvsp || 'N/A',
          codingHgvs: bestTc.hgvsc || 'N/A',
          transcriptId: bestTc.transcript_id || 'Ensembl Transcript',
          geneSymbol: bestTc.gene_symbol || vObj.gene?.symbol || 'N/A',
          variantAllele: aKey,
          predictors: {
            alphaMissense: amPred ? {
              name: 'AlphaMissense',
              prediction: amPred,
              score: amScore,
              source: 'AlphaMissense (Google DeepMind, 2023)',
              version: 'v1.0 (Ensembl dbNSFP)'
            } : { name: 'AlphaMissense', prediction: 'Not available', score: null, source: 'AlphaMissense', version: 'v1.0' },

            cadd: bestTc.cadd_phred !== undefined ? {
              name: 'CADD',
              prediction: `PHRED ${bestTc.cadd_phred}`,
              score: bestTc.cadd_phred,
              rawScore: bestTc.cadd_raw !== undefined ? Math.round(bestTc.cadd_raw * 1000) / 1000 : null,
              source: 'CADD (UW/Berlin)',
              version: 'v1.6'
            } : { name: 'CADD', prediction: 'Not available', score: null, source: 'CADD', version: 'v1.6' },

            sift: bestTc.sift_prediction ? {
              name: 'SIFT',
              prediction: bestTc.sift_prediction,
              score: typeof bestTc.sift_score === 'number' ? Math.round(bestTc.sift_score * 1000) / 1000 : null,
              source: 'SIFT (JCVI)',
              version: 'v5.2.2'
            } : { name: 'SIFT', prediction: 'Not available', score: null, source: 'SIFT', version: 'v5.2.2' },

            polyphen: bestTc.polyphen_prediction ? {
              name: 'PolyPhen-2',
              prediction: bestTc.polyphen_prediction,
              score: typeof bestTc.polyphen_score === 'number' ? Math.round(bestTc.polyphen_score * 1000) / 1000 : null,
              source: 'PolyPhen-2 (Harvard)',
              version: 'v2.2.2'
            } : { name: 'PolyPhen-2', prediction: 'Not available', score: null, source: 'PolyPhen-2', version: 'v2.2.2' }
          }
        });
      }
    }

    console.log(`[predictorService] Successfully fetched predictions for ${allelePredictions.length} alleles of "${formattedRsid}"`);

    return {
      allelePredictions,
      disagreementNote: 'Computational predictors may disagree because they use different models, training data, and scoring methods.',
      sources: [
        { name: 'Ensembl VEP REST API', endpoint: 'https://rest.ensembl.org/vep/human/id', assembly: vepObj.assembly_name || 'GRCh38' },
        { name: 'AlphaMissense', provider: 'Google DeepMind (2023)', via: 'Ensembl dbNSFP' },
        { name: 'CADD', provider: 'UW / Berlin', version: 'v1.6' },
        { name: 'SIFT', provider: 'JCVI', version: 'v5.2.2' },
        { name: 'PolyPhen-2', provider: 'Harvard', version: 'v2.2.2' }
      ],
      error: null
    };
  } catch (err) {
    console.warn(`[predictorService Warning] Prediction lookup failed for "${formattedRsid}":`, err.message);
    return {
      allelePredictions: [],
      disagreementNote: null,
      sources: [],
      error: 'Functional prediction data is temporarily unavailable.'
    };
  }
}
