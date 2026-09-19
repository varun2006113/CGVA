import { getProteinForGene } from './uniprotService.js';

const AA_3_TO_1 = {
  Ala: 'A', Arg: 'R', Asn: 'N', Asp: 'D', Cys: 'C',
  Gln: 'Q', Glu: 'E', Gly: 'G', His: 'H', Ile: 'I',
  Leu: 'L', Lys: 'K', Met: 'M', Phe: 'F', Pro: 'P',
  Ser: 'S', Thr: 'T', Trp: 'W', Tyr: 'Y', Val: 'V',
  Ter: '*', '*': '*'
};

/**
 * Safe parsing of HGVS protein expression (e.g. NP_000537.3:p.Arg175His)
 */
export function parseProteinHGVS(hgvsString) {
  if (!hgvsString || typeof hgvsString !== 'string') {
    return {
      raw: null,
      proteinAccession: null,
      referenceAA: null,
      referenceAA1: null,
      position: null,
      alternateAA: null,
      alternateAA1: null,
      consequence: 'Protein-level consequence not available for this representation.'
    };
  }

  const clean = hgvsString.trim();
  let accession = null;
  let pExpr = clean;
  if (clean.includes(':')) {
    const parts = clean.split(':');
    accession = parts[0];
    pExpr = parts[1] || clean;
  }

  pExpr = pExpr.replace(/^p\./, '');

  // 1. Missense / Nonsense: e.g. Arg175His, Arg175Ter, Arg175*
  const missenseMatch = pExpr.match(/^([A-Z][a-z]{2})(\d+)([A-Z][a-z]{2}|\*|Ter)$/);
  if (missenseMatch) {
    const refAA = missenseMatch[1];
    const pos = parseInt(missenseMatch[2], 10);
    const altAA = missenseMatch[3];

    const ref1 = AA_3_TO_1[refAA] || refAA;
    const alt1 = AA_3_TO_1[altAA] || altAA;

    const isStop = altAA === 'Ter' || altAA === '*';
    const isSyn = refAA === altAA;

    let consequence = 'Missense';
    if (isStop) consequence = 'Nonsense / Stop Gained';
    else if (isSyn) consequence = 'Synonymous';

    return {
      raw: clean,
      proteinAccession: accession,
      referenceAA: refAA,
      referenceAA1: ref1,
      position: pos,
      alternateAA: altAA,
      alternateAA1: alt1,
      consequence
    };
  }

  // 2. Synonymous: e.g. Arg175=
  const synMatch = pExpr.match(/^([A-Z][a-z]{2})(\d+)=$/);
  if (synMatch) {
    const refAA = synMatch[1];
    const pos = parseInt(synMatch[2], 10);
    const ref1 = AA_3_TO_1[refAA] || refAA;

    return {
      raw: clean,
      proteinAccession: accession,
      referenceAA: refAA,
      referenceAA1: ref1,
      position: pos,
      alternateAA: refAA,
      alternateAA1: ref1,
      consequence: 'Synonymous'
    };
  }

  // 3. Frameshift: e.g. Lys3326fs or Arg175fsTer10
  const fsMatch = pExpr.match(/^([A-Z][a-z]{2})(\d+)fs/);
  if (fsMatch) {
    const refAA = fsMatch[1];
    const pos = parseInt(fsMatch[2], 10);
    const ref1 = AA_3_TO_1[refAA] || refAA;

    return {
      raw: clean,
      proteinAccession: accession,
      referenceAA: refAA,
      referenceAA1: ref1,
      position: pos,
      alternateAA: 'Frameshift',
      alternateAA1: 'fs',
      consequence: 'Frameshift'
    };
  }

  // 4. In-frame Indel: e.g. Glu153del or Ala120_Pro121ins
  const indelMatch = pExpr.match(/^([A-Z][a-z]{2})(\d+).*(del|ins|dup)/);
  if (indelMatch) {
    const refAA = indelMatch[1];
    const pos = parseInt(indelMatch[2], 10);
    const ref1 = AA_3_TO_1[refAA] || refAA;

    return {
      raw: clean,
      proteinAccession: accession,
      referenceAA: refAA,
      referenceAA1: ref1,
      position: pos,
      alternateAA: indelMatch[3],
      alternateAA1: indelMatch[3],
      consequence: 'In-frame Indel'
    };
  }

  return {
    raw: clean,
    proteinAccession: accession,
    referenceAA: null,
    referenceAA1: null,
    position: null,
    alternateAA: null,
    alternateAA1: null,
    consequence: 'Protein-level consequence not available for this representation.'
  };
}

/**
 * Resolve protein context for a specific variant identity & ClinVar records.
 * Connects RefSeq protein accession / Gene to canonical UniProt protein.
 */
export async function getProteinContextForVariant(resolvedVariant, clinvarData = null) {
  if (!resolvedVariant) {
    return { protein: null, mappings: [], error: 'Variant identity not provided' };
  }

  const vObj = resolvedVariant.variant || resolvedVariant;
  const geneSymbol = vObj.gene?.symbol || vObj.geneSymbol || (typeof vObj.gene === 'string' ? vObj.gene : null);
  const rawProteinHgvs = vObj.hgvs?.protein || vObj.proteinHgvs || vObj.protein || null;
  const refSeqProteinAcc = rawProteinHgvs ? rawProteinHgvs.split(':')?.[0] : (vObj.proteinAccession || null);

  console.log(`[proteinContextService] Resolving protein context for gene: "${geneSymbol}", RefSeq Acc: "${refSeqProteinAcc}"`);

  // 1. Resolve UniProt Protein via RefSeq cross-reference
  let uniprotProtein = null;
  if (refSeqProteinAcc) {
    const cleanAcc = refSeqProteinAcc.split('.')[0];
    try {
      const url = `https://rest.uniprot.org/uniprotkb/search?query=xref:refseq-${encodeURIComponent(cleanAcc)}+AND+organism_id:9606+AND+reviewed:true&format=json&size=1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const json = await res.json();
        const entry = json.results?.[0];
        if (entry) {
          const accession = entry.primaryAccession;
          const proteinName = entry.proteinDescription?.recommendedName?.fullName?.value ||
                              entry.proteinDescription?.submissionNames?.[0]?.fullName?.value ||
                              `${geneSymbol || 'Target'} Protein`;
          const seqLength = entry.sequence?.length || 400;
          const funcComment = entry.comments?.find(c => c.commentType === 'FUNCTION')?.texts?.[0]?.value || null;
          const domains = entry.features
            ?.filter(f => f.type === 'Domain' || f.type === 'Region')
            ?.map(f => ({
              name: f.description || f.type || 'Protein Domain',
              start: f.location?.start?.value || null,
              end: f.location?.end?.value || null,
              type: f.type || 'Domain'
            })) || [];

          uniprotProtein = {
            accession,
            proteinName,
            geneSymbol: geneSymbol || entry.genes?.[0]?.geneName?.value?.toUpperCase(),
            organism: entry.organism?.scientificName || 'Homo sapiens',
            sequenceLength: seqLength,
            isReviewed: entry.entryType === 'UniProtKB reviewed (Swiss-Prot)',
            functionSummary: funcComment,
            domains,
            url: `https://www.uniprot.org/uniprotkb/${accession}`
          };
        }
      }
    } catch (err) {
      console.warn(`[proteinContextService Warning] RefSeq xref query failed for ${refSeqProteinAcc}:`, err.message);
    }
  }

  // Fallback to UniProt gene search if xref search returned no entry
  if (!uniprotProtein && geneSymbol) {
    try {
      const pRes = await getProteinForGene(geneSymbol);
      if (pRes.protein) {
        uniprotProtein = pRes.protein;
      }
    } catch (gErr) {
      console.warn(`[proteinContextService Warning] UniProt gene query failed for ${geneSymbol}:`, gErr.message);
    }
  }

  // 2. Build Allele-Specific Protein Mappings
  const mappings = [];
  const clinvarRecords = clinvarData?.records || [];

  if (clinvarRecords.length > 0) {
    for (const rec of clinvarRecords) {
      const title = rec.title || rec.allele || '';
      const cMatch = title.match(/c\.[^\s\)]+/);
      const pMatch = title.match(/p\.[^\s\)]+/);

      const cdnaStr = cMatch ? cMatch[0] : null;
      const protStr = pMatch ? pMatch[0] : null;

      if (protStr) {
        const parsed = parseProteinHGVS(protStr);
        mappings.push({
          allele: rec.allele || title,
          codingHgvs: cdnaStr || resolvedVariant.hgvs?.coding || 'N/A',
          proteinHgvs: protStr,
          proteinAccession: parsed.proteinAccession || refSeqProteinAcc || 'N/A',
          position: parsed.position,
          referenceAA: parsed.referenceAA,
          referenceAA1: parsed.referenceAA1,
          alternateAA: parsed.alternateAA,
          alternateAA1: parsed.alternateAA1,
          consequence: parsed.consequence
        });
      }
    }
  }

  // Primary mapping from Stage 6A resolvedVariant if no ClinVar mappings extracted yet
  if (mappings.length === 0 && rawProteinHgvs) {
    const parsed = parseProteinHGVS(rawProteinHgvs);
    mappings.push({
      allele: `${vObj.genomic?.reference || vObj.referenceAllele || ''}>${vObj.genomic?.alternate || vObj.alternateAllele || ''}`,
      codingHgvs: vObj.hgvs?.coding || vObj.codingHgvs || 'N/A',
      proteinHgvs: rawProteinHgvs,
      proteinAccession: parsed.proteinAccession || refSeqProteinAcc || 'N/A',
      position: parsed.position,
      referenceAA: parsed.referenceAA,
      referenceAA1: parsed.referenceAA1,
      alternateAA: parsed.alternateAA,
      alternateAA1: parsed.alternateAA1,
      consequence: parsed.consequence
    });
  }

  return {
    protein: uniprotProtein,
    mappings,
    error: uniprotProtein ? null : 'Protein information unavailable'
  };
}
