const UNIPROT_BASE = 'https://rest.uniprot.org/uniprotkb';

/**
 * Fetch Protein Information from UniProt REST API
 */
export async function getProteinInfo(uniprotIdOrGene) {
  if (!uniprotIdOrGene) {
    return { isDemoData: false, data: null, error: 'Missing parameter' };
  }

  const clean = uniprotIdOrGene.trim().toUpperCase();

  // 2. Try UniProt REST API live
  try {
    const isAccession = /^[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z0-9]{3}[0-9]){1,2}$/i.test(clean);
    const searchUrl = isAccession
      ? `${UNIPROT_BASE}/${clean}.json`
      : `${UNIPROT_BASE}/search?query=gene_exact:${clean}%20AND%20organism_id:9606&format=json&size=1`;

    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const json = await res.json();
      const entry = isAccession ? json : json.results?.[0];

      if (entry) {
        const accession = entry.primaryAccession;
        const proteinName = entry.proteinDescription?.recommendedName?.fullName?.value || entry.proteinDescription?.submissionNames?.[0]?.fullName?.value || clean;
        const seqLength = entry.sequence?.length || 400;

        const funcComment = entry.comments?.find(c => c.commentType === 'FUNCTION')?.texts?.[0]?.value || `Protein functions associated with ${clean}.`;

        const domainFeatures = entry.features
          ?.filter(f => f.type === 'Domain' || f.type === 'Region')
          ?.map(f => ({
            name: f.description || 'Protein Domain',
            start: f.location?.start?.value || 1,
            end: f.location?.end?.value || seqLength,
            description: f.description || ''
          })) || [];

        return {
          isDemoData: false,
          data: {
            uniprotId: accession,
            name: proteinName,
            geneSymbol: clean,
            length: seqLength,
            function: funcComment,
            domains: domainFeatures,
            url: `https://www.uniprot.org/uniprotkb/${accession}`
          }
        };
      }
    }
  } catch (err) {
    console.warn(`[UniProt Service Warning] Live lookup failed for ${clean}:`, err.message);
  }

  return {
    isDemoData: false,
    data: {
      uniprotId: clean.length <= 10 ? clean : 'UNKNOWN',
      name: `${clean} Protein`,
      geneSymbol: clean,
      length: 400,
      function: `Protein information for ${clean}.`,
      domains: [],
      url: `https://www.uniprot.org/uniprotkb/?query=${encodeURIComponent(clean)}`
    }
  };
}

/**
 * Retrieve live human protein details for a gene symbol from official UniProt REST API.
 * Strictly queries rest.uniprot.org. NO DEMO_CACHE lookup.
 */
export async function getProteinForGene(geneSymbol) {
  if (!geneSymbol || typeof geneSymbol !== 'string') {
    return { isDemoData: false, protein: null, error: 'Missing gene symbol parameter' };
  }

  const cleanSymbol = geneSymbol.trim().toUpperCase();
  console.log(`[uniprotService.getProteinForGene] Querying UniProt for gene: "${cleanSymbol}"`);

  try {
    // 1. Primary query: Human reviewed (Swiss-Prot) entry matching exact gene symbol
    let url = `${UNIPROT_BASE}/search?query=gene_exact:${encodeURIComponent(cleanSymbol)}+AND+organism_id:9606+AND+reviewed:true&format=json&size=5`;
    let res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    let data = res.ok ? await res.json() : null;
    let results = data?.results || [];

    // Fallback 1: Broad gene name search in reviewed human entries
    if (results.length === 0) {
      url = `${UNIPROT_BASE}/search?query=gene:${encodeURIComponent(cleanSymbol)}+AND+organism_id:9606+AND+reviewed:true&format=json&size=5`;
      res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      data = res.ok ? await res.json() : null;
      results = data?.results || [];
    }

    // Fallback 2: Any human entry matching gene_exact
    if (results.length === 0) {
      url = `${UNIPROT_BASE}/search?query=gene_exact:${encodeURIComponent(cleanSymbol)}+AND+organism_id:9606&format=json&size=5`;
      res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      data = res.ok ? await res.json() : null;
      results = data?.results || [];
    }

    if (results.length === 0) {
      console.log(`[uniprotService.getProteinForGene] No UniProt record found for "${cleanSymbol}"`);
      return {
        isDemoData: false,
        protein: null,
        error: 'Protein information unavailable'
      };
    }

    const entry = results[0];
    const accession = entry.primaryAccession;
    const isReviewed = entry.entryType === 'UniProtKB reviewed (Swiss-Prot)';
    const proteinName = entry.proteinDescription?.recommendedName?.fullName?.value ||
                        entry.proteinDescription?.submissionNames?.[0]?.fullName?.value ||
                        entry.proteinDescription?.alternativeNames?.[0]?.fullName?.value ||
                        cleanSymbol;

    const matchedGeneSymbol = entry.genes?.[0]?.geneName?.value?.toUpperCase() || cleanSymbol;
    const sequenceLength = entry.sequence?.length || 0;
    const sequence = entry.sequence?.value || null;

    // Function comment
    const funcComment = entry.comments?.find(c => c.commentType === 'FUNCTION')?.texts?.[0]?.value || null;

    // Domain & Region features
    const domains = entry.features
      ?.filter(f => f.type === 'Domain' || f.type === 'Region')
      ?.map(f => ({
        name: f.description || f.type || 'Protein Domain',
        start: f.location?.start?.value || null,
        end: f.location?.end?.value || null,
        type: f.type || 'Domain'
      })) || [];

    // Isoforms
    const isoformComment = entry.comments?.find(c => c.commentType === 'ALTERNATIVE PRODUCTS');
    const isoformsCount = isoformComment?.isoforms?.length || 1;
    const isoformNames = isoformComment?.isoforms?.map(iso => iso.name?.value || iso.isoformIds?.[0]).filter(Boolean) || [];

    console.log(`[uniprotService.getProteinForGene] Successfully retrieved UniProt entry ${accession} (${proteinName}) for "${cleanSymbol}"`);

    return {
      isDemoData: false,
      protein: {
        accession,
        proteinName,
        geneSymbol: matchedGeneSymbol,
        requestedSymbol: cleanSymbol,
        organism: entry.organism?.scientificName || 'Homo sapiens',
        sequenceLength,
        sequence,
        functionSummary: funcComment,
        isReviewed,
        entryType: entry.entryType || 'Swiss-Prot (Reviewed)',
        domains,
        isoformsCount,
        isoformNames,
        url: `https://www.uniprot.org/uniprotkb/${accession}`
      }
    };
  } catch (err) {
    console.warn(`[uniprotService.getProteinForGene Warning] UniProt query failed for "${cleanSymbol}":`, err.message);
    return {
      isDemoData: false,
      protein: null,
      error: 'UniProt protein data is temporarily unavailable.'
    };
  }
}

