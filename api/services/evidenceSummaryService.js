/**
 * Evidence & Scientific Interpretation Summary Service (Stage 14)
 * Consumes existing normalized variant evidence across NCBI, ClinVar, UniProt,
 * RCSB PDB, AlphaFold DB, Ensembl VEP, and Stage 10 Reconciliation.
 * Generates structured factual summaries and evidence statements.
 * 
 * STRICT SCIENTIFIC CONSTRAINTS:
 * - NO artificial combined pathogenicity scores or clinical risk percentages.
 * - NO ranking of variants.
 * - NO clinical diagnostic claims or overriding ClinVar assertions.
 * - Preserves conflicting evidence, predictor discordance, and missing data transparency.
 * - All statements are strictly traceable to retrieved live source data.
 */

export function generateEvidenceSummary(
  variantData,
  clinvarData = null,
  proteinContextData = null,
  structuralContextData = null,
  predictionsData = null,
  reconciliationData = null,
  selectedAlleleIndex = 0
) {
  const vObj = variantData?.variant || (variantData?.rsid ? variantData : null);
  if (!variantData || !vObj) {
    return {
      available: false,
      error: 'Variant data unavailable'
    };
  }

  // 1. Allele Selection Logic for Multi-Allelic Variants
  const mappings = proteinContextData?.mappings || [];
  const reconciliationAlleles = reconciliationData?.normalizedAlleles || [];
  
  // Resolve list of allele representations
  let availableAlleles = [];
  if (mappings.length > 0) {
    availableAlleles = mappings;
  } else if (reconciliationAlleles.length > 0) {
    availableAlleles = reconciliationAlleles.map(a => ({
      allele: a.allele,
      codingHgvs: a.codingHgvs || variantData.hgvs?.coding || 'N/A',
      proteinHgvs: a.proteinHgvs || variantData.hgvs?.protein || 'N/A',
      position: a.proteinPosition || null,
      referenceAA: a.referenceAA || 'Ref',
      alternateAA: a.alternateAA || 'Alt',
      consequence: a.vepConsequence || variantData.type || 'N/A'
    }));
  } else {
    availableAlleles = [{
      allele: variantData.genomic?.alternate ? `${variantData.genomic.reference}>${variantData.genomic.alternate}` : 'Selected Allele',
      codingHgvs: variantData.hgvs?.coding || 'N/A',
      proteinHgvs: variantData.hgvs?.protein || 'N/A',
      position: structuralContextData?.summary?.primaryPosition || null,
      referenceAA: variantData.referenceAA || 'Ref',
      alternateAA: variantData.alternateAA || 'Alt',
      consequence: variantData.type || 'N/A'
    }];
  }

  const validIndex = Math.min(Math.max(0, selectedAlleleIndex), availableAlleles.length - 1);
  const activeAllele = availableAlleles[validIndex] || availableAlleles[0];

  const rsid = vObj.rsid || variantData.rsid || variantData.query || 'N/A';
  const geneSymbol = vObj.gene?.symbol || vObj.geneSymbol || variantData.geneSymbol || variantData.gene?.symbol || (typeof vObj.gene === 'string' ? vObj.gene : 'N/A');
  const chromosome = vObj.genomic?.chromosome || variantData.chromosome || 'N/A';
  const genomicPosition = vObj.genomic?.position || variantData.genomicPosition || 'N/A';
  const referenceAllele = vObj.genomic?.reference || variantData.referenceAllele || 'N/A';
  const alternateAllele = activeAllele.allele || activeAllele.alternateAllele || vObj.genomic?.alternate || 'N/A';

  const genomicHGVS = variantData.hgvs?.genomic || 'N/A';
  const codingHGVS = activeAllele.codingHgvs || variantData.hgvs?.coding || 'N/A';
  const proteinHGVS = activeAllele.proteinHgvs || variantData.hgvs?.protein || 'N/A';

  const residuePosition = activeAllele.position !== null && activeAllele.position !== undefined
    ? activeAllele.position
    : (structuralContextData?.summary?.primaryPosition || null);

  const consequence = activeAllele.consequence || variantData.type || 'N/A';

  // 2. Clinical Evidence Layer (ClinVar)
  let clinicalEvidence = {
    available: false,
    classifications: [],
    reviewStatuses: [],
    maxStars: 0,
    conditions: [],
    conflicts: false,
    submissionCounts: 0,
    recordsCount: 0,
    statements: []
  };

  if (clinvarData && clinvarData.records && clinvarData.records.length > 0) {
    const records = clinvarData.records;
    const sigSet = new Set();
    const statusSet = new Set();
    const condSet = new Set();
    let maxStars = 0;
    let totalSubmissions = 0;
    let hasConflict = false;

    records.forEach(r => {
      if (r.clinicalSignificance) sigSet.add(r.clinicalSignificance);
      if (r.reviewStatus) statusSet.add(r.reviewStatus);
      if (r.condition && r.condition !== 'Not specified') condSet.add(r.condition);
      if (typeof r.reviewStars === 'number' && r.reviewStars > maxStars) maxStars = r.reviewStars;
      if (r.submissionCount) totalSubmissions += r.submissionCount;
      if (r.hasConflict) hasConflict = true;
    });

    const classifications = Array.from(sigSet);
    const reviewStatuses = Array.from(statusSet);
    const conditions = Array.from(condSet);

    const statements = [];
    statements.push(`ClinVar contains ${records.length} cataloged record(s) for this variant.`);
    if (classifications.length > 0) {
      statements.push(`ClinVar clinical interpretations include: ${classifications.join(', ')}.`);
    }
    if (hasConflict || classifications.length > 1) {
      statements.push(`Conflicting ClinVar clinical interpretations are present across submitters.`);
    }
    if (maxStars >= 3) {
      statements.push(`ClinVar records include high-confidence expert-panel or practice-guideline review (${maxStars} stars).`);
    } else if (maxStars > 0) {
      statements.push(`ClinVar review assertions include criteria-provided submissions (${maxStars} star rating).`);
    }

    clinicalEvidence = {
      available: true,
      classifications,
      reviewStatuses,
      maxStars,
      conditions,
      conflicts: hasConflict || classifications.length > 1,
      submissionCounts: totalSubmissions || records.length,
      recordsCount: records.length,
      statements
    };
  } else {
    clinicalEvidence.statements.push(`No ClinVar clinical evidence records retrieved for this specific variant.`);
  }

  // 3. Computational Predictions Layer (Ensembl VEP / dbNSFP)
  let functionalPredictions = {
    available: false,
    alphaMissense: null,
    cadd: null,
    sift: null,
    polyphen: null,
    isConcordant: true,
    statements: [],
    source: 'Ensembl VEP REST API / dbNSFP'
  };

  if (predictionsData && predictionsData.allelePredictions && predictionsData.allelePredictions.length > 0) {
    // Find prediction matching active allele or use first prediction
    const matchedPred = predictionsData.allelePredictions.find(ap => {
      if (!ap.allele) return false;
      const altClean = alternateAllele.replace(/.*>/, '').trim();
      return ap.allele.toUpperCase() === altClean.toUpperCase();
    }) || predictionsData.allelePredictions[0];

    const preds = matchedPred.predictions || {};
    const am = preds.alphaMissense;
    const cadd = preds.cadd;
    const sift = preds.sift;
    const polyphen = preds.polyphen;

    const statements = [];
    const predLabels = [];

    if (am && am.prediction && am.prediction !== 'Not available') {
      statements.push(`AlphaMissense predicts "${am.prediction}" (score: ${am.score ?? 'N/A'}).`);
      predLabels.push(am.prediction.toLowerCase());
    }
    if (cadd && cadd.phredScore !== null && cadd.phredScore !== undefined) {
      statements.push(`CADD reports a PHRED score of ${cadd.phredScore}.`);
    }
    if (sift && sift.prediction && sift.prediction !== 'Not available') {
      statements.push(`SIFT predicts "${sift.prediction}" (score: ${sift.score ?? 'N/A'}).`);
      predLabels.push(sift.prediction.toLowerCase());
    }
    if (polyphen && polyphen.prediction && polyphen.prediction !== 'Not available') {
      statements.push(`PolyPhen-2 predicts "${polyphen.prediction}" (score: ${polyphen.score ?? 'N/A'}).`);
      predLabels.push(polyphen.prediction.toLowerCase());
    }

    // Check predictor concordance
    const containsDeleterious = predLabels.some(l => l.includes('pathogenic') || l.includes('deleterious') || l.includes('damaging'));
    const containsTolerated = predLabels.some(l => l.includes('benign') || l.includes('tolerated'));
    const isConcordant = !(containsDeleterious && containsTolerated);

    if (!isConcordant) {
      statements.push(`Computational predictors are not fully concordant for this allele.`);
    } else if (predLabels.length > 1) {
      statements.push(`Computational predictors show concordant prediction direction across available algorithms.`);
    }

    functionalPredictions = {
      available: statements.length > 0,
      alphaMissense: am,
      cadd,
      sift,
      polyphen,
      isConcordant,
      statements,
      source: 'Ensembl VEP REST API / dbNSFP (GRCh38)'
    };
  } else {
    functionalPredictions.statements.push(`Computational prediction data unavailable for this allele.`);
  }

  // 4. Protein Context Layer (UniProt)
  let proteinContext = {
    available: false,
    uniprotAccession: proteinContextData?.protein?.accession || 'N/A',
    proteinName: proteinContextData?.protein?.proteinName || 'N/A',
    proteinLength: proteinContextData?.protein?.sequenceLength || null,
    residuePosition,
    domainMatch: null,
    statements: []
  };

  if (proteinContextData && proteinContextData.protein) {
    const protein = proteinContextData.protein;
    const statements = [];

    statements.push(`The variant maps to human UniProt canonical protein entry ${protein.accession} (${protein.proteinName}, ${protein.sequenceLength || '?'} AA).`);
    
    if (residuePosition) {
      statements.push(`The affected residue is position ${residuePosition} (${activeAllele.referenceAA || 'Ref'} → ${activeAllele.alternateAA || 'Alt'}).`);
      
      // Check UniProt Domain Match
      const domains = protein.domains || [];
      const matchedDomain = domains.find(d => typeof d.start === 'number' && typeof d.end === 'number' && residuePosition >= d.start && residuePosition <= d.end);

      if (matchedDomain) {
        proteinContext.domainMatch = matchedDomain;
        statements.push(`The affected residue (position ${residuePosition}) falls within the annotated ${matchedDomain.name} region (residues ${matchedDomain.start}–${matchedDomain.end}).`);
      } else {
        statements.push(`The affected residue (position ${residuePosition}) does not fall within currently retrieved UniProt annotated domain regions.`);
      }
    }

    proteinContext = {
      available: true,
      uniprotAccession: protein.accession,
      proteinName: protein.proteinName,
      proteinLength: protein.sequenceLength,
      residuePosition,
      domainMatch: proteinContext.domainMatch,
      statements
    };
  } else {
    proteinContext.statements.push(`UniProt protein context unavailable for this variant.`);
  }

  // 5. Structural Context Layer (RCSB PDB & AlphaFold DB)
  let structuralContext = {
    available: false,
    pdbAvailable: false,
    pdbCoverageCount: 0,
    representativePdb: null,
    alphaFoldAvailable: false,
    modelId: null,
    residuePlddt: null,
    confidenceCategory: 'N/A',
    statements: []
  };

  if (structuralContextData) {
    const coveringPdbs = structuralContextData.coveringPdbStructures || [];
    const bestPdb = coveringPdbs[0] || structuralContextData.bestPdb || null;
    const alphafold = structuralContextData.alphafold || null;
    const resPlddt = alphafold?.residueContext?.residuePlddt ?? structuralContextData.summary?.residuePlddt ?? null;
    const confCat = alphafold?.residueContext?.residueCategory || structuralContextData.summary?.residueCategory || 'N/A';

    const statements = [];

    if (coveringPdbs.length > 0 && bestPdb) {
      statements.push(`The affected residue is covered by ${coveringPdbs.length} experimentally determined structure(s) in the retrieved PDB set (representative PDB: ${bestPdb.pdbId}, ${bestPdb.method || 'X-ray'}, ${bestPdb.resolution || 'N/A'} resolution).`);
    } else {
      statements.push(`The affected residue is outside available experimental PDB structure coverage.`);
    }

    if (alphafold) {
      statements.push(`The AlphaFold model (${alphafold.entryId || alphafold.modelId}) covers the protein sequence.`);
      if (resPlddt !== null && resPlddt !== undefined) {
        statements.push(`The AlphaFold model assigns a residue-specific pLDDT confidence of ${resPlddt} at residue position ${residuePosition || 'target'} (${confCat}).`);
      }
    }

    structuralContext = {
      available: true,
      pdbAvailable: coveringPdbs.length > 0,
      pdbCoverageCount: coveringPdbs.length,
      representativePdb: bestPdb,
      alphaFoldAvailable: Boolean(alphafold),
      modelId: alphafold?.entryId || alphafold?.modelId || null,
      residuePlddt: resPlddt,
      confidenceCategory: confCat,
      statements
    };
  } else {
    structuralContext.statements.push(`3D structural context unavailable for this variant.`);
  }

  // 6. Evidence Consistency Matrix (Stage 10 Reconciliation)
  let consistency = {
    ncbi: 'Matched',
    clinvar: clinicalEvidence.available ? 'Matched' : 'Unavailable',
    uniprot: proteinContext.available ? 'Matched' : 'Unavailable',
    vep: functionalPredictions.available ? 'Matched' : 'Unavailable',
    discrepancies: reconciliationData?.discrepancies || [],
    matrix: [
      { source: 'NCBI dbSNP', status: 'Matched', detail: `Resolved rsID ${rsid} on chromosome ${chromosome}:${genomicPosition}.` },
      { source: 'NCBI ClinVar', status: clinicalEvidence.available ? 'Matched' : 'Unavailable', detail: clinicalEvidence.available ? `Retrieved ${clinicalEvidence.recordsCount} allele-specific record(s).` : 'No ClinVar records found.' },
      { source: 'UniProtKB', status: proteinContext.available ? 'Matched' : 'Unavailable', detail: proteinContext.available ? `Mapped to canonical entry ${proteinContext.uniprotAccession}.` : 'UniProt protein mapping unavailable.' },
      { source: 'Ensembl VEP', status: functionalPredictions.available ? 'Matched' : 'Unavailable', detail: functionalPredictions.available ? `Retrieved computational predictions for ${alternateAllele}.` : 'VEP predictions unavailable.' }
    ]
  };

  // 7. Aggregate Factual Evidence Statements
  const evidenceStatements = [
    ...clinicalEvidence.statements,
    ...functionalPredictions.statements,
    ...proteinContext.statements,
    ...structuralContext.statements
  ];

  // 8. Dynamic Scientific Takeaway Synthesis Paragraph
  const takeawayParts = [];
  takeawayParts.push(`This variant is annotated as a ${consequence} change (${proteinHGVS}) in gene ${geneSymbol}.`);
  
  if (clinicalEvidence.available) {
    if (clinicalEvidence.conflicts) {
      takeawayParts.push(`ClinVar database records report conflicting interpretations of clinical significance (${clinicalEvidence.classifications.join(', ')}).`);
    } else {
      takeawayParts.push(`ClinVar reports clinical classification as ${clinicalEvidence.classifications.join(', ')}.`);
    }
  } else {
    takeawayParts.push(`No ClinVar clinical evidence records were retrieved for this specific allele.`);
  }

  if (functionalPredictions.available) {
    if (!functionalPredictions.isConcordant) {
      takeawayParts.push(`Computational predictors (AlphaMissense, CADD, SIFT, PolyPhen-2) are not fully concordant for this allele.`);
    } else {
      takeawayParts.push(`Computational predictors provide concordant evaluations across available algorithms.`);
    }
  }

  if (structuralContext.pdbAvailable) {
    takeawayParts.push(`The affected residue is covered by experimental PDB structures.`);
  } else if (structuralContext.alphaFoldAvailable) {
    takeawayParts.push(`The affected residue is outside experimental PDB coverage but is modeled by AlphaFold with ${structuralContext.confidenceCategory} confidence.`);
  }

  takeawayParts.push(`These evidence types describe distinct molecular, clinical, computational, and structural dimensions of the variant and should not be interpreted as a single calculated clinical diagnostic score.`);

  const scientificTakeaway = takeawayParts.join(' ');

  return {
    available: true,
    alleleOptions: availableAlleles,
    selectedAlleleIndex: validIndex,
    activeAllele,
    variantIdentity: {
      rsid,
      gene: geneSymbol,
      chromosome,
      genomicPosition,
      referenceAllele,
      alternateAllele,
      genomicHGVS,
      codingHGVS,
      proteinHGVS
    },
    molecularConsequence: {
      consequence,
      proteinChange: proteinHGVS,
      residuePosition,
      referenceAA: activeAllele.referenceAA || 'Ref',
      alternateAA: activeAllele.alternateAA || 'Alt'
    },
    clinicalEvidence,
    functionalPredictions,
    proteinContext,
    structuralContext,
    consistency,
    evidenceStatements,
    scientificTakeaway,
    scientificDisclaimer: 'CGVE presents evidence retrieved live from official external biological databases and computational prediction resources. Computational predictions and structural observations do not independently establish clinical significance. Clinical interpretations should be evaluated in the context of underlying database evidence and appropriate professional guidance.'
  };
}
