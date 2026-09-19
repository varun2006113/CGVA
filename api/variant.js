import { getVariantInfo } from './services/variantService.js';
import { getClinVarForVariant } from './services/clinvarService.js';
import { getProteinContextForVariant } from './services/proteinContextService.js';
import { getStructuralContextForVariant } from './services/structureContextService.js';
import { getFunctionalPredictionsForVariant } from './services/predictorService.js';
import { reconcileVariantEvidence } from './services/reconciliationService.js';
import { generateEvidenceSummary } from './services/evidenceSummaryService.js';

export default async function handler(req, res) {
  try {
    const identifier = req.query.identifier || req.query.query || req.query.rsid || req.query.id;
    if (!identifier) {
      return res.status(400).json({
        query: '',
        isDemoData: false,
        variant: null,
        clinvar: null,
        proteinContext: null,
        structuralContext: null,
        predictions: null,
        reconciliation: null,
        evidenceSummary: null,
        error: 'Missing variant identifier parameter'
      });
    }

    // 1. Live NCBI dbSNP Variant Resolution
    const result = await getVariantInfo(identifier);

    if (result.error || !result.variant) {
      return res.status(404).json({
        query: identifier,
        isDemoData: false,
        variant: null,
        clinvar: null,
        proteinContext: null,
        structuralContext: null,
        predictions: null,
        reconciliation: null,
        evidenceSummary: null,
        error: result.error || 'Variant could not be resolved using NCBI.'
      });
    }

    // 2. Fetch ClinVar Clinical Evidence for this specific variant (Decoupled)
    let clinvarResult = { records: [], totalCount: 0, error: null };
    try {
      clinvarResult = await getClinVarForVariant(result.variant);
    } catch (cErr) {
      console.warn(`[api/variant.js] ClinVar lookup warning for "${identifier}":`, cErr.message);
      clinvarResult = {
        records: [],
        totalCount: 0,
        error: 'ClinVar data is temporarily unavailable.'
      };
    }

    // 3. Fetch Stage 7 Variant -> Protein Context (Decoupled)
    let proteinContextResult = { protein: null, mappings: [], error: null };
    try {
      proteinContextResult = await getProteinContextForVariant(result.variant, clinvarResult);
    } catch (pErr) {
      console.warn(`[api/variant.js] Protein context lookup warning for "${identifier}":`, pErr.message);
      proteinContextResult = {
        protein: null,
        mappings: [],
        error: 'Protein information unavailable'
      };
    }

    // 4. Fetch Stage 8 Variant -> Structural Context (Decoupled)
    let structuralContextResult = {
      uniprotAccession: null,
      summary: null,
      alleleStructuralMappings: [],
      coveringPdbStructures: [],
      nonCoveringPdbStructures: [],
      totalPdbCount: 0,
      alphafold: null,
      error: null
    };
    try {
      structuralContextResult = await getStructuralContextForVariant(result.variant, proteinContextResult);
    } catch (sErr) {
      console.warn(`[api/variant.js] Structural context lookup warning for "${identifier}":`, sErr.message);
      structuralContextResult = {
        uniprotAccession: null,
        summary: null,
        alleleStructuralMappings: [],
        coveringPdbStructures: [],
        nonCoveringPdbStructures: [],
        totalPdbCount: 0,
        alphafold: null,
        error: 'Structural information unavailable'
      };
    }

    // 5. Fetch Stage 9 Variant -> Computational Functional Predictions (Decoupled)
    let predictionsResult = { allelePredictions: [], disagreementNote: null, sources: [], error: null };
    try {
      predictionsResult = await getFunctionalPredictionsForVariant(result.variant, proteinContextResult);
    } catch (predErr) {
      console.warn(`[api/variant.js] Predictions lookup warning for "${identifier}":`, predErr.message);
      predictionsResult = {
        allelePredictions: [],
        disagreementNote: null,
        sources: [],
        error: 'Functional prediction data unavailable'
      };
    }

    // 6. Stage 10 — Variant Representation & Evidence Reconciliation
    let reconciliationResult = null;
    try {
      reconciliationResult = reconcileVariantEvidence(
        result.variant,
        clinvarResult,
        proteinContextResult,
        structuralContextResult,
        predictionsResult
      );
    } catch (recErr) {
      console.warn(`[api/variant.js] Reconciliation warning for "${identifier}":`, recErr.message);
      reconciliationResult = {
        status: 'partial',
        summary: 'Evidence reconciliation encountered an error',
        discrepancies: [],
        normalizedAlleles: [],
        error: recErr.message
      };
    }

    // 7. Stage 14 — Evidence & Scientific Interpretation Summary
    let evidenceSummaryResult = null;
    try {
      evidenceSummaryResult = generateEvidenceSummary(
        result.variant,
        clinvarResult,
        proteinContextResult,
        structuralContextResult,
        predictionsResult,
        reconciliationResult
      );
    } catch (eErr) {
      console.warn(`[api/variant.js] Evidence summary warning for "${identifier}":`, eErr.message);
    }

    return res.status(200).json({
      query: identifier,
      isDemoData: false,
      variant: result.variant,
      clinvar: clinvarResult,
      proteinContext: proteinContextResult,
      structuralContext: structuralContextResult,
      predictions: predictionsResult,
      reconciliation: reconciliationResult,
      evidenceSummary: evidenceSummaryResult,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      query: req.query.identifier || req.query.query || '',
      isDemoData: false,
      variant: null,
      clinvar: null,
      proteinContext: null,
      structuralContext: null,
      predictions: null,
      error: 'Variant could not be resolved using NCBI.'
    });
  }
}
