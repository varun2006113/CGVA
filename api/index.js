import { getGeneInfo } from '../lib/services/ncbiService.js';
import { getClinVarVariantsForGene, getClinVarForVariant } from '../lib/services/clinvarService.js';
import { getProteinForGene } from '../lib/services/uniprotService.js';
import { getPDBStructures, getAlphaFoldStructure } from '../lib/services/structureService.js';
import { getVariantInfo } from '../lib/services/variantService.js';
import { getProteinContextForVariant } from '../lib/services/proteinContextService.js';
import { getStructuralContextForVariant } from '../lib/services/structureContextService.js';
import { getFunctionalPredictionsForVariant } from '../lib/services/predictorService.js';
import { reconcileVariantEvidence } from '../lib/services/reconciliationService.js';
import { generateEvidenceSummary } from '../lib/services/evidenceSummaryService.js';
import { getGeneAnalytics } from '../lib/services/analyticsService.js';
import { analyzeVariantComparison } from '../lib/services/comparisonService.js';

/**
 * Single Vercel Serverless Function Entry Point & Router
 */
export default async function handler(req, res) {
  // Utility response helpers for consistency across environments
  if (!res.status) {
    res.status = function (code) {
      res.statusCode = code;
      return res;
    };
  }
  if (!res.json) {
    res.json = function (data) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify(data));
    };
  }
  if (!res.send) {
    res.send = function (data) {
      res.end(data);
    };
  }

  try {
    const host = req.headers?.host || 'localhost:5173';
    const rawUrl = req.url || '/api/variant';
    const urlObj = new URL(rawUrl, `http://${host}`);
    const pathname = urlObj.pathname;
    const queryParams = Object.fromEntries(urlObj.searchParams);
    const query = { ...queryParams, ...(req.query || {}) };

    // 1. Gene Analytics Route (/api/gene/:symbol/analytics or /api/analytics)
    if (pathname.startsWith('/api/gene/') && pathname.endsWith('/analytics')) {
      const rawSymbol = pathname.slice('/api/gene/'.length, pathname.length - '/analytics'.length);
      const symbol = decodeURIComponent(rawSymbol).toUpperCase().trim();
      const limit = parseInt(query.limit, 10) || 50;
      const analytics = await getGeneAnalytics(symbol, limit);
      return res.status(200).json({ ...analytics, timestamp: new Date().toISOString() });
    }
    if (pathname === '/api/analytics' || pathname === '/api/analytics/') {
      const rawSymbol = query.symbol || query.query;
      if (!rawSymbol) {
        return res.status(400).json({ error: 'Missing gene symbol query parameter' });
      }
      const symbol = String(rawSymbol).toUpperCase().trim();
      const limit = parseInt(query.limit, 10) || 50;
      const analytics = await getGeneAnalytics(symbol, limit);
      return res.status(200).json({ ...analytics, timestamp: new Date().toISOString() });
    }

    // 2. Gene Info Route (/api/gene/:symbol or /api/gene)
    if (pathname.startsWith('/api/gene/') || pathname === '/api/gene' || pathname === '/api/gene/') {
      let symbol = query.symbol || query.query;
      if (pathname.startsWith('/api/gene/') && pathname !== '/api/gene/' && pathname !== '/api/gene') {
        const raw = pathname.slice('/api/gene/'.length);
        if (raw) symbol = decodeURIComponent(raw);
      }

      if (!symbol) {
        return res.status(400).json({ error: 'Missing gene symbol parameter' });
      }

      const result = await getGeneInfo(symbol);
      if (!result || result.error || !result.data) {
        return res.status(404).json({
          query: symbol,
          isDemoData: false,
          gene: null,
          clinvar: null,
          protein: null,
          structures: null,
          error: result?.error || 'NCBI gene data temporarily unavailable'
        });
      }

      let clinvarResult = null;
      try {
        clinvarResult = await getClinVarVariantsForGene(symbol, 25);
      } catch (cErr) {
        clinvarResult = { isDemoData: false, totalCount: 0, returnedCount: 0, variants: [], error: 'ClinVar data is temporarily unavailable.' };
      }

      let proteinResult = null;
      try {
        proteinResult = await getProteinForGene(symbol);
      } catch (pErr) {
        proteinResult = { isDemoData: false, protein: null, error: 'UniProt protein data is temporarily unavailable.' };
      }

      let structuresResult = {
        pdb: { isDemoData: false, pdbCount: 0, structures: [], error: 'UniProt accession not resolved' },
        alphafold: { isDemoData: false, modelAvailable: false, alphafold: null, error: 'UniProt accession not resolved' }
      };

      const resolvedAccession = proteinResult?.protein?.accession;
      if (resolvedAccession) {
        try {
          const [pdbRes, afRes] = await Promise.all([
            getPDBStructures(resolvedAccession),
            getAlphaFoldStructure(resolvedAccession)
          ]);
          structuresResult = { pdb: pdbRes, alphafold: afRes };
        } catch (sErr) {
          structuresResult = {
            pdb: { isDemoData: false, pdbCount: 0, structures: [], error: 'RCSB PDB structural data is temporarily unavailable.' },
            alphafold: { isDemoData: false, modelAvailable: false, alphafold: null, error: 'AlphaFold structural data is temporarily unavailable.' }
          };
        }
      }

      return res.status(200).json({
        query: symbol,
        isDemoData: false,
        gene: result.data,
        clinvar: clinvarResult,
        protein: proteinResult?.protein || null,
        proteinError: proteinResult?.error || null,
        structures: structuresResult,
        timestamp: new Date().toISOString()
      });
    }

    // 3. Variant Comparison Route (/api/compare or /api/variant/compare)
    if (pathname === '/api/compare' || pathname === '/api/compare/' || pathname === '/api/variant/compare' || pathname === '/api/variant/compare/') {
      const varAId = query.varA || query.variantA || query.q1 || query.queryA || 'rs28934578';
      const varBId = query.varB || query.variantB || query.q2 || query.queryB || 'rs121913343';

      const fetchFullVariantPayload = async (identifier) => {
        if (!identifier || typeof identifier !== 'string') {
          return { query: identifier || '', variant: null, clinvar: null, proteinContext: null, structuralContext: null, predictions: null, reconciliation: null, error: 'Missing identifier' };
        }
        const cleanQuery = identifier.trim();
        const result = await getVariantInfo(cleanQuery);
        if (result.error || !result.variant) {
          return { query: cleanQuery, variant: null, clinvar: null, proteinContext: null, structuralContext: null, predictions: null, reconciliation: null, error: result.error || 'Variant could not be resolved using NCBI.' };
        }
        const variant = result.variant;
        let clinvarRes = { records: [], totalCount: 0, error: null };
        try { clinvarRes = await getClinVarForVariant(variant); } catch (cErr) { clinvarRes = { records: [], totalCount: 0, error: 'ClinVar data unavailable' }; }

        let proteinRes = { protein: null, mappings: [], error: null };
        try { proteinRes = await getProteinContextForVariant(variant, clinvarRes); } catch (pErr) { proteinRes = { protein: null, mappings: [], error: 'Protein context unavailable' }; }

        let structuralRes = { uniprotAccession: null, summary: null, alleleStructuralMappings: [], coveringPdbStructures: [], nonCoveringPdbStructures: [], totalPdbCount: 0, alphafold: null, error: null };
        try { structuralRes = await getStructuralContextForVariant(variant, proteinRes); } catch (sErr) { structuralRes = { uniprotAccession: null, summary: null, alleleStructuralMappings: [], coveringPdbStructures: [], nonCoveringPdbStructures: [], totalPdbCount: 0, alphafold: null, error: 'Structural context unavailable' }; }

        let predRes = { allelePredictions: [], disagreementNote: null, sources: [], error: null };
        try { predRes = await getFunctionalPredictionsForVariant(variant, proteinRes); } catch (predErr) { predRes = { allelePredictions: [], disagreementNote: null, sources: [], error: 'Predictions unavailable' }; }

        let recRes = null;
        try { recRes = reconcileVariantEvidence(variant, clinvarRes, proteinRes, structuralRes, predRes); } catch (recErr) { recRes = { status: 'partial', summary: 'Reconciliation error', discrepancies: [], normalizedAlleles: [] }; }

        return { query: cleanQuery, variant, clinvar: clinvarRes, proteinContext: proteinRes, structuralContext: structuralRes, predictions: predRes, reconciliation: recRes, error: null };
      };

      const [payloadA, payloadB] = await Promise.all([
        fetchFullVariantPayload(varAId),
        fetchFullVariantPayload(varBId)
      ]);

      const comparison = analyzeVariantComparison(payloadA, payloadB);
      return res.status(200).json({ variantA: payloadA, variantB: payloadB, comparison, timestamp: new Date().toISOString() });
    }

    // 4. Sub-resource Variant Routes: Clinical evidence (/api/variant/:identifier/clinical)
    if (pathname.startsWith('/api/variant/') && pathname.endsWith('/clinical')) {
      const raw = pathname.slice('/api/variant/'.length, pathname.length - '/clinical'.length);
      const identifier = decodeURIComponent(raw) || query.identifier || 'rs28934578';
      const result = await getClinVarForVariant({ rsid: identifier });
      return res.status(200).json({ identifier, records: result.records || [], totalCount: result.totalCount || 0, error: result.error || null, timestamp: new Date().toISOString() });
    }

    // 5. Sub-resource Variant Routes: Protein context (/api/variant/:identifier/protein)
    if (pathname.startsWith('/api/variant/') && pathname.endsWith('/protein')) {
      const raw = pathname.slice('/api/variant/'.length, pathname.length - '/protein'.length);
      const symbol = decodeURIComponent(raw) || query.symbol || query.identifier || 'TP53';
      const result = await getProteinForGene(symbol);
      return res.status(200).json({ query: symbol, protein: result.protein || null, error: result.error || null, timestamp: new Date().toISOString() });
    }

    // 6. Sub-resource Variant Routes: Structure context (/api/variant/:identifier/structure)
    if (pathname.startsWith('/api/variant/') && pathname.endsWith('/structure')) {
      const raw = pathname.slice('/api/variant/'.length, pathname.length - '/structure'.length);
      const identifier = decodeURIComponent(raw) || query.identifier || 'rs28934578';
      const result = await getStructuralContextForVariant({ rsid: identifier }, null);
      return res.status(200).json({ identifier, structuralContext: result, error: result.error || null, timestamp: new Date().toISOString() });
    }

    // 7. Sub-resource Variant Routes: Predictions (/api/variant/:identifier/predictions)
    if (pathname.startsWith('/api/variant/') && pathname.endsWith('/predictions')) {
      const raw = pathname.slice('/api/variant/'.length, pathname.length - '/predictions'.length);
      const identifier = decodeURIComponent(raw) || query.identifier || 'rs28934578';
      const result = await getFunctionalPredictionsForVariant({ rsid: identifier }, null);
      return res.status(200).json({ identifier, predictions: result, error: result.error || null, timestamp: new Date().toISOString() });
    }

    // 8. Primary Variant Resolution Route (/api/variant/:identifier or /api/variant)
    if (pathname.startsWith('/api/variant') || pathname === '/api/variant/' || pathname === '/api/variant') {
      let identifier = query.identifier || query.query || query.rsid || query.id;
      if (pathname.startsWith('/api/variant/') && pathname !== '/api/variant/' && pathname !== '/api/variant') {
        const raw = pathname.slice('/api/variant/'.length);
        if (raw) identifier = decodeURIComponent(raw);
      }

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

      let clinvarResult = { records: [], totalCount: 0, error: null };
      try {
        clinvarResult = await getClinVarForVariant(result.variant);
      } catch (cErr) {
        clinvarResult = { records: [], totalCount: 0, error: 'ClinVar data is temporarily unavailable.' };
      }

      let proteinContextResult = { protein: null, mappings: [], error: null };
      try {
        proteinContextResult = await getProteinContextForVariant(result.variant, clinvarResult);
      } catch (pErr) {
        proteinContextResult = { protein: null, mappings: [], error: 'Protein information unavailable' };
      }

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
        structuralContextResult = { uniprotAccession: null, summary: null, alleleStructuralMappings: [], coveringPdbStructures: [], nonCoveringPdbStructures: [], totalPdbCount: 0, alphafold: null, error: 'Structural information unavailable' };
      }

      let predictionsResult = { allelePredictions: [], disagreementNote: null, sources: [], error: null };
      try {
        predictionsResult = await getFunctionalPredictionsForVariant(result.variant, proteinContextResult);
      } catch (predErr) {
        predictionsResult = { allelePredictions: [], disagreementNote: null, sources: [], error: 'Functional prediction data unavailable' };
      }

      let reconciliationResult = null;
      try {
        reconciliationResult = reconcileVariantEvidence(result.variant, clinvarResult, proteinContextResult, structuralContextResult, predictionsResult);
      } catch (recErr) {
        reconciliationResult = { status: 'partial', summary: 'Evidence reconciliation encountered an error', discrepancies: [], normalizedAlleles: [], error: recErr.message };
      }

      let evidenceSummaryResult = null;
      try {
        evidenceSummaryResult = generateEvidenceSummary(result.variant, clinvarResult, proteinContextResult, structuralContextResult, predictionsResult, reconciliationResult);
      } catch (eErr) {}

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
    }

    return res.status(404).json({ error: `API route not found: ${pathname}` });
  } catch (err) {
    console.error('[Unified API Dispatcher Error]:', err);
    return res.status(500).json({ error: err.message || 'Internal API Error' });
  }
}
