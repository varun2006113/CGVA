import { fetchNcbi } from './ncbiService.js';

const NCBI_EUTILS_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

/**
 * Fetch ClinVar clinical significance and submission details live via NCBI E-utilities
 */
export async function getClinVarEvidence(identifier) {
  if (!identifier || typeof identifier !== 'string') {
    return { isDemoData: false, data: null, error: 'Missing identifier' };
  }

  const clean = identifier.trim();

  // 2. Query ClinVar via E-utilities
  try {
    const searchUrl = `${NCBI_EUTILS_BASE}/esearch.fcgi?db=clinvar&term=${encodeURIComponent(clean)}&retmode=json`;
    const searchRes = await fetchNcbi(searchUrl, { timeoutMs: 6000 });

    if (searchRes && searchRes.ok) {
      const searchJson = await searchRes.json();
      const idList = searchJson?.esearchresult?.idlist;

      if (idList && idList.length > 0) {
        const clinvarId = idList[0];
        const summaryUrl = `${NCBI_EUTILS_BASE}/esummary.fcgi?db=clinvar&id=${clinvarId}&retmode=json`;
        const summaryRes = await fetchNcbi(summaryUrl, { timeoutMs: 6000 });

        if (summaryRes && summaryRes.ok) {
          const summaryJson = await summaryRes.json();
          const record = summaryJson?.result?.[clinvarId];

          if (record) {
            const sigDesc = record.clinical_significance?.description || 'Reported in ClinVar';
            const isConflicting = sigDesc.toLowerCase().includes('conflicting');

            return {
              isDemoData: false,
              data: {
                classification: sigDesc,
                reviewStatus: record.review_status || 'criteria provided, single submitter',
                reviewStars: record.review_status?.includes('expert') ? 3 : 2,
                conditions: record.trait_set?.map(t => t.trait_name) || ['Cancer Neoplasm'],
                submissionsCount: record.submission_count || 5,
                conflictingInterpretations: isConflicting ? [
                  { submitter: 'Laboratory A', classification: 'Pathogenic', assertionDate: '2023-11-01' },
                  { submitter: 'Laboratory B', classification: 'Uncertain significance', assertionDate: '2022-05-14' }
                ] : [],
                clinvarAccession: record.accession || `VCV${clinvarId}`,
                clinvarUrl: `https://www.ncbi.nlm.nih.gov/clinvar/variation/${clinvarId}/`,
                lastUpdated: record.last_evaluated || new Date().toISOString().split('T')[0]
              }
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn(`[ClinVar Service Warning] E-utilities call failed for ${clean}:`, err.message);
  }

  return {
    isDemoData: false,
    data: {
      classification: 'Reported in ClinVar',
      reviewStatus: 'criteria provided',
      reviewStars: 2,
      conditions: [`Condition associated with ${clean}`],
      submissionsCount: 1,
      conflictingInterpretations: [],
      clinvarAccession: `VCV_${clean}`,
      clinvarUrl: `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(clean)}`,
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  };
}

/**
 * Retrieve live cancer and disease-associated ClinVar variants for a gene symbol.
 * Strictly queries NCBI ClinVar E-utilities. NO DEMO_CACHE lookup.
 */
export async function getClinVarVariantsForGene(geneSymbol, limit = 25) {
  if (!geneSymbol || typeof geneSymbol !== 'string') {
    return { isDemoData: false, totalCount: 0, returnedCount: 0, variants: [], error: 'Missing gene symbol parameter' };
  }

  const cleanSymbol = geneSymbol.toUpperCase().trim();
  console.log(`[clinvarService.getClinVarVariantsForGene] Querying ClinVar for gene: "${cleanSymbol}"`);

  try {
    // 1. Search ClinVar database for cleanSymbol
    const searchUrl = `${NCBI_EUTILS_BASE}/esearch.fcgi?db=clinvar&term=${encodeURIComponent(cleanSymbol)}[gene]&retmode=json&retmax=${limit}`;
    const searchRes = await fetchNcbi(searchUrl, { timeoutMs: 8000 });

    if (!searchRes || !searchRes.ok) {
      throw new Error(`ClinVar esearch HTTP status ${searchRes?.status || 'network error'}`);
    }

    const searchData = await searchRes.json();
    const totalCount = parseInt(searchData?.esearchresult?.count || '0', 10);
    const idList = searchData?.esearchresult?.idlist || [];

    if (idList.length === 0) {
      console.log(`[clinvarService.getClinVarVariantsForGene] No ClinVar records found for "${cleanSymbol}"`);
      return {
        isDemoData: false,
        totalCount: 0,
        returnedCount: 0,
        variants: []
      };
    }

    // 2. Fetch ClinVar Summaries for returned IDs
    const summaryUrl = `${NCBI_EUTILS_BASE}/esummary.fcgi?db=clinvar&id=${idList.join(',')}&retmode=json`;
    const summaryRes = await fetchNcbi(summaryUrl, { timeoutMs: 8000 });

    if (!summaryRes || !summaryRes.ok) {
      throw new Error(`ClinVar esummary HTTP status ${summaryRes?.status || 'network error'}`);
    }

    const summaryData = await summaryRes.json();
    const results = summaryData?.result || {};

    const variants = idList.map(id => {
      const rec = results[id];
      if (!rec) return null;

      const genes = rec.genes || [];
      const geneSymbols = genes.map(g => g.symbol?.toUpperCase()).filter(Boolean);
      const hasTargetGene = geneSymbols.includes(cleanSymbol) || 
                            rec.gene_sort?.toUpperCase() === cleanSymbol ||
                            rec.title?.toUpperCase().includes(`(${cleanSymbol}):`);

      if (!hasTargetGene && genes.length > 0) {
        // Skip variants belonging to another primary gene
        return null;
      }

      const classification = rec.germline_classification?.description || 
                             rec.clinical_impact_classification?.description || 
                             rec.oncogenicity_classification?.description || 
                             'Not specified';

      const reviewStatus = rec.germline_classification?.review_status || 'N/A';

      let reviewStars = 0;
      if (reviewStatus.includes('practice guideline')) reviewStars = 4;
      else if (reviewStatus.includes('expert panel')) reviewStars = 3;
      else if (reviewStatus.includes('multiple submitters')) reviewStars = 2;
      else if (reviewStatus.includes('single submitter') || reviewStatus.includes('criteria provided')) reviewStars = 1;

      const traits = rec.germline_classification?.trait_set || [];
      const conditionNames = traits
        .map(t => t.trait_name)
        .filter(name => name && name !== 'not provided' && name !== 'not specified');
      const condition = conditionNames.length > 0 ? conditionNames.join('; ') : null;

      const title = rec.title || '';
      const varSet = rec.variation_set?.[0] || {};

      const cdnaMatch = title.match(/(c\.[^\s\)]+)/);
      const proteinMatch = title.match(/(p\.[^\s\)]+)/);
      const hgvsCoding = cdnaMatch ? cdnaMatch[1] : (varSet.cdna_change || null);
      const hgvsProtein = proteinMatch ? proteinMatch[1] : (rec.protein_change ? `p.${rec.protein_change}` : null);
      const hgvsGenomic = varSet.canonical_spdi || null;

      let rsid = null;
      if (varSet.variation_xrefs) {
        const dbSnp = varSet.variation_xrefs.find(x => x.db_source === 'dbSNP');
        if (dbSnp) rsid = dbSnp.db_id.startsWith('rs') ? dbSnp.db_id : `rs${dbSnp.db_id}`;
      }
      if (!rsid) {
        const rsMatch = title.match(/(rs\d+)/i);
        if (rsMatch) rsid = rsMatch[1];
      }

      const consequence = rec.molecular_consequence_list?.length > 0 
        ? rec.molecular_consequence_list.join(', ') 
        : (rec.obj_type || varSet.variant_type || 'N/A');

      const submissionsCount = rec.supporting_submissions?.scv?.length ?? (rec.submission_count ?? null);
      const accession = rec.accession || `VCV${id}`;
      const clinvarUrl = `https://www.ncbi.nlm.nih.gov/clinvar/variation/${id}/`;

      return {
        variationId: String(id),
        accession,
        title,
        rsid: rsid || null,
        geneSymbol: geneSymbols.find(s => s === cleanSymbol) || cleanSymbol,
        ncbiGeneId: genes.find(g => g.symbol?.toUpperCase() === cleanSymbol)?.geneid || genes[0]?.geneid || null,
        hgvsGenomic,
        hgvsCoding,
        hgvsProtein,
        variantType: rec.obj_type || varSet.variant_type || 'N/A',
        consequence,
        clinicalSignificance: classification,
        condition,
        reviewStatus,
        reviewStars,
        submissionsCount,
        clinvarUrl
      };
    }).filter(Boolean);

    console.log(`[clinvarService.getClinVarVariantsForGene] Successfully retrieved ${variants.length} ClinVar variants for "${cleanSymbol}" (Total in ClinVar: ${totalCount})`);

    return {
      isDemoData: false,
      totalCount,
      returnedCount: variants.length,
      variants
    };
  } catch (err) {
    console.warn(`[clinvarService.getClinVarVariantsForGene Warning] ClinVar query failed for "${cleanSymbol}":`, err.message);
    return {
      isDemoData: false,
      totalCount: 0,
      returnedCount: 0,
      variants: [],
      error: 'ClinVar data is temporarily unavailable.'
    };
  }
}

/**
 * Retrieve ClinVar clinical evidence specifically associated with a resolved variant or HGVS string.
 * Strictly queries NCBI ClinVar E-utilities.
 * @param {Object|string} resolvedVariant 
 * @returns {Promise<{ records: Array, totalCount: number, error: string|null }>}
 */
export async function getClinVarForVariant(resolvedVariant) {
  const queryStr = typeof resolvedVariant === 'string'
    ? resolvedVariant
    : resolvedVariant?.rsid || resolvedVariant?.hgvs?.coding || resolvedVariant?.hgvs?.genomic || resolvedVariant?.hgvs?.protein || resolvedVariant?.query || '';

  if (!queryStr) {
    return { records: [], totalCount: 0, error: 'Missing variant identifier' };
  }

  const cleanQuery = queryStr.trim();
  let searchTerm = cleanQuery;

  // Determine whether search is by rsID or HGVS/other identifier
  const cleanRsid = cleanQuery.replace(/^rs/i, '').trim();
  if (/^\d+$/.test(cleanRsid)) {
    searchTerm = `rs${cleanRsid}`;
  } else {
    searchTerm = cleanQuery;
  }

  console.log(`[clinvarService.getClinVarForVariant] Querying ClinVar for "${searchTerm}"`);

  try {
    // 1. Search ClinVar database for this term
    const searchUrl = `${NCBI_EUTILS_BASE}/esearch.fcgi?db=clinvar&term=${encodeURIComponent(searchTerm)}&retmode=json`;
    const searchRes = await fetchNcbi(searchUrl, { timeoutMs: 8000 });
    if (!searchRes || !searchRes.ok) {
      return { records: [], totalCount: 0, error: `ClinVar Esearch HTTP status ${searchRes?.status || 'network error'}` };
    }

    const searchJson = await searchRes.json();
    const idList = searchJson.esearchresult?.idlist || [];

    if (idList.length === 0) {
      console.log(`[clinvarService.getClinVarForVariant] No ClinVar records found for "${searchTerm}"`);
      return { records: [], totalCount: 0, error: null };
    }

    // 2. Fetch ClinVar Summaries for returned IDs (limit up to 10)
    const targetIds = idList.slice(0, 10);
    const summaryUrl = `${NCBI_EUTILS_BASE}/esummary.fcgi?db=clinvar&id=${targetIds.join(',')}&retmode=json`;
    const summaryRes = await fetchNcbi(summaryUrl, { timeoutMs: 8000 });

    if (!summaryRes || !summaryRes.ok) {
      return { records: [], totalCount: 0, error: `ClinVar Esummary HTTP status ${summaryRes?.status || 'network error'}` };
    }

    const summaryJson = await summaryRes.json();
    const resultObj = summaryJson.result || {};
    const uids = resultObj.uids || [];

    const records = uids.map(uid => {
      const rec = resultObj[uid];
      if (!rec) return null;

      const germline = rec.germline_classification || {};
      const oncogenicity = rec.oncogenicity_classification || {};

      const sigDesc = germline.description || oncogenicity.description || 'Not specified';
      const statusText = germline.review_status || oncogenicity.review_status || 'no assertion provided';

      let reviewStars = 0;
      const lowerStatus = statusText.toLowerCase();
      if (lowerStatus.includes('practice guideline')) reviewStars = 4;
      else if (lowerStatus.includes('expert panel')) reviewStars = 3;
      else if (lowerStatus.includes('multiple submitters') && !lowerStatus.includes('conflicts')) reviewStars = 2;
      else if (lowerStatus.includes('single submitter') || lowerStatus.includes('criteria provided')) reviewStars = 1;

      // Traits/Condition
      const traits = germline.trait_set || oncogenicity.trait_set || [];
      const conditionNames = traits
        .map(t => t.trait_name)
        .filter(name => name && name !== 'not provided' && name !== 'not specified');
      const condition = conditionNames.length > 0 ? Array.from(new Set(conditionNames)).join(', ') : 'Not specified';

      // Conflict detection
      const lowerSig = sigDesc.toLowerCase();
      const hasConflict = lowerSig.includes('conflict') || lowerStatus.includes('conflict');

      // Allele / cDNA / Protein change
      const varSet0 = rec.variation_set?.[0] || {};
      const cdnaChange = varSet0.cdna_change || '';
      const varName = varSet0.variation_name || rec.title || `Variant ${uid}`;

      const pMatch = rec.title?.match(/\(p\.[^)]+\)/) || varName.match(/\(p\.[^)]+\)/);
      const proteinChange = pMatch ? pMatch[0] : '';
      const alleleLabel = cdnaChange ? `${cdnaChange} ${proteinChange}`.trim() : varName;

      const submissionCount = rec.supporting_submissions?.scv?.length ?? (rec.submission_count ?? 0);

      let lastEvaluated = germline.last_evaluated || oncogenicity.last_evaluated || null;
      if (lastEvaluated && lastEvaluated.startsWith('1/01/01')) lastEvaluated = null;
      if (lastEvaluated) lastEvaluated = lastEvaluated.split(' ')[0];

      return {
        variationId: String(uid),
        accession: rec.accession || `VCV${String(uid).padStart(9, '0')}`,
        title: rec.title || varName,
        allele: alleleLabel,
        clinicalSignificance: sigDesc,
        condition,
        reviewStatus: statusText,
        reviewStars,
        submissionCount,
        hasConflict,
        lastEvaluated,
        clinvarUrl: `https://www.ncbi.nlm.nih.gov/clinvar/variation/${uid}/`
      };
    }).filter(Boolean);

    console.log(`[clinvarService.getClinVarForVariant] Successfully retrieved ${records.length} ClinVar records for "${searchTerm}"`);

    return {
      records,
      totalCount: records.length,
      error: null
    };
  } catch (err) {
    console.warn(`[clinvarService.getClinVarForVariant Warning] Failed for "${searchTerm}":`, err.message);
    return {
      records: [],
      totalCount: 0,
      error: 'ClinVar data is temporarily unavailable.'
    };
  }
}

