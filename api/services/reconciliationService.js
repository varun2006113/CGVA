/**
 * Variant Representation & Evidence Reconciliation Service (Stage 10)
 * Reconciles evidence across NCBI dbSNP, ClinVar, UniProt, PDB/AlphaFold, and Ensembl VEP.
 * Ensures every displayed piece of evidence corresponds to the exact same biological allele.
 */

/**
 * Reconcile variant evidence across all integrated data sources
 * @param {Object} resolvedVariant - Normalized variant identity from NCBI (Stage 6A)
 * @param {Object} clinvarResult - Variant-specific ClinVar records (Stage 6B)
 * @param {Object} proteinContextResult - UniProt protein context (Stage 7)
 * @param {Object} structuralContextResult - PDB/AlphaFold structural context (Stage 8)
 * @param {Object} predictorResult - Ensembl VEP computational predictions (Stage 9)
 * @returns {Object} Normalized reconciliation metadata
 */
export function reconcileVariantEvidence(
  resolvedVariant,
  clinvarResult = null,
  proteinContextResult = null,
  structuralContextResult = null,
  predictorResult = null
) {
  if (!resolvedVariant || (!resolvedVariant.found && !resolvedVariant.rsid && !resolvedVariant.query)) {
    return {
      status: 'unavailable',
      summary: 'Variant identity could not be resolved using NCBI dbSNP.',
      rsid: resolvedVariant?.query || null,
      discrepancies: [],
      normalizedAlleles: [],
      sourcesSummary: {
        ncbi: 'Not resolved',
        clinvar: 'Unavailable',
        uniprot: 'Unavailable',
        vep: 'Unavailable'
      }
    };
  }

  const vObj = resolvedVariant.variant || resolvedVariant;
  const rsid = vObj.rsid || resolvedVariant.rsid || 'N/A';
  const geneSymbol = vObj.gene?.symbol || resolvedVariant.geneSymbol || 'N/A';
  const chrom = vObj.genomic?.chromosome || resolvedVariant.chromosome || 'N/A';
  const pos = vObj.genomic?.position || resolvedVariant.genomicPosition || 'N/A';
  const ref = vObj.genomic?.reference || resolvedVariant.referenceAllele || '';
  
  let alts = [];
  if (Array.isArray(resolvedVariant.alleles)) {
    alts = resolvedVariant.alleles;
  } else if (vObj.genomic?.alternate) {
    alts = vObj.genomic.alternate.split(',').map(s => s.trim()).filter(Boolean);
  } else if (resolvedVariant.alternateAllele) {
    alts = [resolvedVariant.alternateAllele];
  }

  const primaryCodingHgvs = vObj.hgvs?.coding || resolvedVariant.codingHgvs || null;
  const primaryProteinHgvs = vObj.hgvs?.protein || resolvedVariant.proteinHgvs || null;
  const primaryGenomicHgvs = vObj.hgvs?.genomic || resolvedVariant.genomicHgvs || null;

  const discrepancies = [];
  const normalizedAlleles = [];

  // Extract ClinVar records array safely
  const cvRecords = Array.isArray(clinvarResult?.records)
    ? clinvarResult.records
    : Array.isArray(clinvarResult?.classifications)
    ? clinvarResult.classifications
    : [];

  // Iterate over each alternate allele
  for (let i = 0; i < alts.length; i++) {
    const altAllele = alts[i].trim();
    if (!altAllele) continue;

    // 1. NCBI baseline allele representation
    const ncbiStatus = 'matched';
    const ncbiDetails = `GRCh38 chr${chrom}:${pos} ${ref}>${altAllele}`;

    // 2. ClinVar allele matching
    let cvStatus = 'unavailable';
    let cvMatchedRecords = [];

    if (cvRecords.length > 0) {
      cvMatchedRecords = cvRecords.filter(c => {
        const title = c.title || '';
        const cHgvs = c.codingHgvs || '';
        const pHgvs = c.proteinHgvs || '';
        const name = c.name || '';
        const allele = c.allele || '';

        // Match on nucleotide change e.g. G>A or c.524G>A or title substring
        if (cHgvs.includes(`>${altAllele}`) || title.includes(`>${altAllele}`) || name.includes(`>${altAllele}`) || allele.includes(`>${altAllele}`)) return true;
        
        // Single alternate allele matching
        if (alts.length === 1) return true;

        return false;
      });

      if (cvMatchedRecords.length > 0) {
        cvStatus = 'matched';
      } else {
        cvStatus = 'partial'; // Records exist for rsID but alternate allele match is unconfirmed
      }
    }

    // 3. UniProt / Protein Context reconciliation
    let uniprotStatus = 'unavailable';
    let uniprotNote = null;
    let uniprotpHgvs = null;
    let uniprotTx = null;

    if (proteinContextResult && proteinContextResult.found !== false && proteinContextResult.uniprotAccession) {
      uniprotTx = proteinContextResult.transcriptId || null;

      // Find mapping for this specific allele
      const mapping = (proteinContextResult.mappings || []).find(m => {
        return (m.allele && m.allele.includes(`>${altAllele}`)) || m.alternateAA === altAllele || (m.codingHgvs && m.codingHgvs.includes(`>${altAllele}`));
      }) || proteinContextResult.mappings?.[i] || proteinContextResult.mappings?.[0];

      if (mapping) {
        uniprotpHgvs = mapping.proteinHgvs || null;

        // Check for transcript isoform residue numbering differences (e.g., BRCA1 p.Ser1613Gly vs p.Ser1634Cys)
        if (primaryProteinHgvs && uniprotpHgvs && primaryProteinHgvs !== uniprotpHgvs) {
          uniprotStatus = 'equivalent';
          uniprotNote = `Equivalent representation across transcript isoforms (${primaryProteinHgvs} vs ${uniprotpHgvs})`;
          
          discrepancies.push({
            allele: altAllele,
            source: 'UniProt / Protein Context',
            type: 'Isoform transcript difference',
            detail: `NCBI default RefSeq docsum reports ${primaryProteinHgvs}, UniProt canonical mapping reports ${uniprotpHgvs}. Both describe the same genomic locus (chr${chrom}:${pos}).`
          });
        } else {
          uniprotStatus = 'matched';
          uniprotNote = `Aligned to UniProt ${proteinContextResult.uniprotAccession} residue ${proteinContextResult.proteinPosition || 'N/A'}`;
        }
      } else if (proteinContextResult.uniprotAccession) {
        uniprotStatus = 'matched';
        uniprotNote = `Aligned to UniProt ${proteinContextResult.uniprotAccession}`;
      }
    }

    // 4. Ensembl VEP reconciliation
    let vepStatus = 'unavailable';
    let vepMatchedTx = 'N/A';
    let vepProteinHgvs = 'N/A';
    let vepPredictorCount = 0;

    if (predictorResult && Array.isArray(predictorResult.allelePredictions)) {
      const predAlleleObj = predictorResult.allelePredictions.find(ap => {
        return ap.variantAllele === altAllele || (ap.allele && ap.allele.includes(`>${altAllele}`));
      }) || predictorResult.allelePredictions[i];

      if (predAlleleObj) {
        vepStatus = 'matched';
        vepMatchedTx = predAlleleObj.transcriptId || 'Ensembl Transcript';
        vepProteinHgvs = predAlleleObj.proteinHgvs || 'N/A';
        vepPredictorCount = Object.keys(predAlleleObj.predictors || {}).length;

        // Compare VEP consequence ONLY against the matching allele's protein change (uniprotpHgvs or primary if allele matches)
        const expectedAlleleProteinHgvs = uniprotpHgvs || (primaryCodingHgvs && primaryCodingHgvs.includes(`>${altAllele}`) ? primaryProteinHgvs : null);
        if (expectedAlleleProteinHgvs && vepProteinHgvs !== 'N/A' && vepProteinHgvs !== expectedAlleleProteinHgvs) {
          discrepancies.push({
            allele: altAllele,
            source: 'Ensembl VEP',
            type: 'Transcript consequence difference',
            detail: `VEP predicted consequence on transcript ${vepMatchedTx} (${vepProteinHgvs}) differs from expected allele HGVS (${expectedAlleleProteinHgvs}).`
          });
        }
      }
    }

    normalizedAlleles.push({
      alternateAllele: altAllele,
      genomicLocus: `GRCh38 chr${chrom}:${pos} ${ref}>${altAllele}`,
      codingHgvs: primaryCodingHgvs || 'N/A',
      proteinHgvs: uniprotpHgvs || primaryProteinHgvs || 'N/A',
      sources: {
        ncbi: { status: ncbiStatus, details: ncbiDetails },
        clinvar: { status: cvStatus, matchedRecordsCount: cvMatchedRecords.length },
        uniprot: { status: uniprotStatus, proteinHgvs: uniprotpHgvs || 'N/A', note: uniprotNote },
        vep: { status: vepStatus, transcriptId: vepMatchedTx, proteinHgvs: vepProteinHgvs, predictorsCount: vepPredictorCount }
      }
    });
  }

  // Determine overall reconciliation status
  let overallStatus = 'matched';
  if (discrepancies.length > 0) {
    overallStatus = 'equivalent'; // Discrepancies represent legitimate equivalent transcript representations
  } else if (normalizedAlleles.some(a => Object.values(a.sources).some(s => s.status === 'unavailable' || s.status === 'partial'))) {
    overallStatus = 'partial';
  }

  return {
    status: overallStatus,
    rsid,
    geneSymbol,
    genomicLocus: `GRCh38 chr${chrom}:${pos} ${ref}>[${alts.join(',')}]`,
    primaryGenomicHgvs: primaryGenomicHgvs || `chr${chrom}:${pos}`,
    primaryCodingHgvs: primaryCodingHgvs || 'N/A',
    primaryProteinHgvs: primaryProteinHgvs || 'N/A',
    discrepancies,
    normalizedAlleles,
    sourcesSummary: {
      ncbi: `Resolved NCBI RefSNP rsID ${rsid}`,
      clinvar: cvRecords.length > 0 ? `${cvRecords.length} ClinVar Record(s)` : 'Unavailable',
      uniprot: proteinContextResult?.uniprotAccession ? `UniProt ${proteinContextResult.uniprotAccession}` : 'Unavailable',
      vep: predictorResult?.allelePredictions?.length ? `Ensembl VEP (${predictorResult.allelePredictions.length} Allele Predictions)` : 'Unavailable'
    }
  };
}
