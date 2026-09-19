import { getVariantInfo } from './services/variantService.js';
import { getClinVarForVariant } from './services/clinvarService.js';
import { getProteinContextForVariant } from './services/proteinContextService.js';
import { getStructuralContextForVariant } from './services/structureContextService.js';
import { getFunctionalPredictionsForVariant } from './services/predictorService.js';
import { reconcileVariantEvidence } from './services/reconciliationService.js';
import { analyzeVariantComparison } from './services/comparisonService.js';

/**
 * Fetch complete Stages 1-10 evidence payload for a single variant query
 */
async function fetchFullVariantPayload(identifier) {
  if (!identifier || typeof identifier !== 'string') {
    return { query: identifier || '', variant: null, clinvar: null, proteinContext: null, structuralContext: null, predictions: null, reconciliation: null, error: 'Missing identifier' };
  }

  const cleanQuery = identifier.trim();

  // 1. Live NCBI dbSNP Variant Resolution
  const result = await getVariantInfo(cleanQuery);
  if (result.error || !result.variant) {
    return { query: cleanQuery, variant: null, clinvar: null, proteinContext: null, structuralContext: null, predictions: null, reconciliation: null, error: result.error || 'Variant could not be resolved using NCBI.' };
  }

  const variant = result.variant;

  // 2. ClinVar Evidence
  let clinvarResult = { records: [], totalCount: 0, error: null };
  try {
    clinvarResult = await getClinVarForVariant(variant);
  } catch (cErr) {
    clinvarResult = { records: [], totalCount: 0, error: 'ClinVar data unavailable' };
  }

  // 3. Protein Context
  let proteinContextResult = { protein: null, mappings: [], error: null };
  try {
    proteinContextResult = await getProteinContextForVariant(variant, clinvarResult);
  } catch (pErr) {
    proteinContextResult = { protein: null, mappings: [], error: 'Protein context unavailable' };
  }

  // 4. Structural Context
  let structuralContextResult = { uniprotAccession: null, summary: null, alleleStructuralMappings: [], coveringPdbStructures: [], nonCoveringPdbStructures: [], totalPdbCount: 0, alphafold: null, error: null };
  try {
    structuralContextResult = await getStructuralContextForVariant(variant, proteinContextResult);
  } catch (sErr) {
    structuralContextResult = { uniprotAccession: null, summary: null, alleleStructuralMappings: [], coveringPdbStructures: [], nonCoveringPdbStructures: [], totalPdbCount: 0, alphafold: null, error: 'Structural context unavailable' };
  }

  // 5. Functional Predictions
  let predictionsResult = { allelePredictions: [], disagreementNote: null, sources: [], error: null };
  try {
    predictionsResult = await getFunctionalPredictionsForVariant(variant, proteinContextResult);
  } catch (predErr) {
    predictionsResult = { allelePredictions: [], disagreementNote: null, sources: [], error: 'Predictions unavailable' };
  }

  // 6. Reconciliation
  let reconciliationResult = null;
  try {
    reconciliationResult = reconcileVariantEvidence(variant, clinvarResult, proteinContextResult, structuralContextResult, predictionsResult);
  } catch (recErr) {
    reconciliationResult = { status: 'partial', summary: 'Reconciliation error', discrepancies: [], normalizedAlleles: [] };
  }

  return {
    query: cleanQuery,
    variant,
    clinvar: clinvarResult,
    proteinContext: proteinContextResult,
    structuralContext: structuralContextResult,
    predictions: predictionsResult,
    reconciliation: reconciliationResult,
    error: null
  };
}

export default async function handler(req, res) {
  try {
    const varAId = req.query.varA || req.query.variantA || req.query.q1 || req.query.queryA || 'rs28934578';
    const varBId = req.query.varB || req.query.variantB || req.query.q2 || req.query.queryB || 'rs121913343';

    // Concurrently fetch evidence for both variants in parallel
    const [payloadA, payloadB] = await Promise.all([
      fetchFullVariantPayload(varAId),
      fetchFullVariantPayload(varBId)
    ]);

    // Analyze shared features and differences
    const comparison = analyzeVariantComparison(payloadA, payloadB);

    return res.status(200).json({
      variantA: payloadA,
      variantB: payloadB,
      comparison,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[api/compare] Handler error:', error.message);
    return res.status(500).json({
      error: error.message || 'Error executing variant comparison'
    });
  }
}
