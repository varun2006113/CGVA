import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import Variant3DViewer from '../components/Variant3DViewer';
import EvidenceInterpretation from '../components/EvidenceInterpretation';
import { detectInputType, getDetectionLabel } from '../utils/inputDetection';
import { Activity, CheckCircle2, Search, Loader2, AlertTriangle, ExternalLink, Dna, MapPin, Database, FileText, Layers, Box, ChevronDown, ChevronUp, Cpu, Info } from 'lucide-react';

export default function VariantExplorerPage() {
  const params = useParams();
  const wildcardParam = params['*'] || params.identifier || '';
  const [searchParams] = useSearchParams();
  const rawQuery = wildcardParam || searchParams.get('query') || '';
  const query = decodeURIComponent(rawQuery).trim();
  const detectedType = detectInputType(query);
  const navigate = useNavigate();

  const [variantData, setVariantData] = useState(null);
  const [clinvarData, setClinvarData] = useState(null);
  const [proteinContextData, setProteinContextData] = useState(null);
  const [structuralContextData, setStructuralContextData] = useState(null);
  const [predictionsData, setPredictionsData] = useState(null);
  const [reconciliationData, setReconciliationData] = useState(null);
  const [evidenceSummaryData, setEvidenceSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clinvarError, setClinvarError] = useState(null);
  const [proteinContextError, setProteinContextError] = useState(null);
  const [structuralContextError, setStructuralContextError] = useState(null);
  const [predictionsError, setPredictionsError] = useState(null);
  const [reconciliationError, setReconciliationError] = useState(null);
  const [showNonCoveringPdbs, setShowNonCoveringPdbs] = useState(false);

  const fetchVariantData = async (queryToFetch) => {
    if (!queryToFetch) return;
    setLoading(true);
    setError(null);
    setClinvarError(null);
    setProteinContextError(null);
    setStructuralContextError(null);
    setPredictionsError(null);
    setReconciliationError(null);
    setVariantData(null);
    setClinvarData(null);
    setProteinContextData(null);
    setStructuralContextData(null);
    setPredictionsData(null);
    setReconciliationData(null);
    setEvidenceSummaryData(null);

    try {
      console.log(`[VariantExplorerPage] Resolving variant from NCBI, ClinVar & UniProt: "${queryToFetch}"`);
      const res = await fetch(`/api/variant?query=${encodeURIComponent(queryToFetch)}`);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`API returned non-JSON response (${res.status}): ${text.slice(0, 100)}`);
      }
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }
      const json = await res.json();
      if (json.error && !json.variant) {
        throw new Error(json.error);
      }

      setVariantData(json.variant);

      if (json.clinvar && !json.clinvar.error) {
        setClinvarData(json.clinvar);
      } else if (json.clinvar?.error) {
        setClinvarError(json.clinvar.error);
      }

      if (json.proteinContext) {
        setProteinContextData(json.proteinContext);
        if (json.proteinContext.error) {
          setProteinContextError(json.proteinContext.error);
        }
      }

      if (json.structuralContext) {
        setStructuralContextData(json.structuralContext);
        if (json.structuralContext.error) {
          setStructuralContextError(json.structuralContext.error);
        }
      }

      if (json.predictions) {
        setPredictionsData(json.predictions);
        if (json.predictions.error) {
          setPredictionsError(json.predictions.error);
        }
      }

      if (json.reconciliation) {
        setReconciliationData(json.reconciliation);
        if (json.reconciliation.error) {
          setReconciliationError(json.reconciliation.error);
        }
      }

      if (json.evidenceSummary) {
        setEvidenceSummaryData(json.evidenceSummary);
      }
    } catch (err) {
      console.error('[VariantExplorerPage] Fetch Error:', err.message);
      setError(err.message || 'Variant could not be resolved using NCBI.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      fetchVariantData(query);
    } else {
      setVariantData(null);
      setClinvarData(null);
      setProteinContextData(null);
      setStructuralContextData(null);
      setPredictionsData(null);
      setReconciliationData(null);
      setError(null);
      setClinvarError(null);
      setProteinContextError(null);
      setStructuralContextError(null);
      setPredictionsError(null);
      setReconciliationError(null);
      setLoading(false);
    }
  }, [query]);

  const handleSearch = (inputVal, type) => {
    const clean = inputVal.trim();
    const resolvedType = type || detectInputType(clean);

    console.log(`[VariantExplorerPage Search] Input: "${clean}", Type: "${resolvedType}"`);

    if (resolvedType === 'GENE') {
      navigate(`/gene/${encodeURIComponent(clean)}`);
    } else {
      navigate(`/variant/${encodeURIComponent(clean)}`);
    }
  };

  const getSignificanceBadge = (significance) => {
    if (!significance) return <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700">Not specified</span>;
    const lower = significance.toLowerCase();
    if (lower.includes('pathogenic') && !lower.includes('likely') && !lower.includes('conflict')) {
      return <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">Pathogenic</span>;
    }
    if (lower.includes('likely pathogenic')) {
      return <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">Likely pathogenic</span>;
    }
    if (lower.includes('benign') && !lower.includes('likely')) {
      return <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Benign</span>;
    }
    if (lower.includes('likely benign')) {
      return <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Likely benign</span>;
    }
    if (lower.includes('uncertain') || lower.includes('vus')) {
      return <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300">Uncertain significance</span>;
    }
    if (lower.includes('conflict')) {
      return <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">Conflicting interpretations</span>;
    }
    return <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">{significance}</span>;
  };

  const renderReviewStars = (stars, statusText) => {
    return (
      <div className="flex flex-col gap-0.5" title={statusText || 'Review Status'}>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4].map(s => (
            <span key={s} className={`text-xs ${s <= (stars || 0) ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>★</span>
          ))}
        </div>
        <span className="text-[10px] font-mono text-slate-500 truncate max-w-[130px]">{statusText}</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      
      {/* Top Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-700" />
            <span>Variant Explorer</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            RefSNP variant identity, genomic location, HGVS representations, ClinVar evidence, and UniProt protein context.
          </p>
        </div>

        <SearchBar onSearch={handleSearch} initialQuery={query} className="max-w-xl" />
      </div>

      {query ? (
        <div className="space-y-6">
          
          {/* Main Identifier Result Banner */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-slate-900 text-cyan-400 flex items-center justify-center font-bold text-xl font-mono">
                  VAR
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500 uppercase">Input Classification:</span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                      {detectedType}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 font-mono tracking-tight mt-0.5 select-all">
                    {query}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded bg-slate-100 border border-slate-200 font-mono text-xs text-slate-700 font-medium">
                  Route: /variant/{query}
                </span>
              </div>
            </div>

            {/* Target Query Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                  Entered Variant Identifier
                </span>
                <span className="text-sm font-bold font-mono text-slate-900 block truncate">
                  {query}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                  Input Classification
                </span>
                <span className="text-sm font-bold font-mono text-cyan-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                  <span>{getDetectionLabel(detectedType)}</span>
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                  Active Route Path
                </span>
                <span className="text-sm font-bold font-mono text-slate-900 block truncate">
                  /variant/{query}
                </span>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
              <Loader2 className="w-8 h-8 text-cyan-600 animate-spin mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">Resolving Live Variant, ClinVar & Protein Context</h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Querying NCBI dbSNP, ClinVar & UniProt REST APIs for <span className="font-bold text-cyan-700">{query}</span>...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-rose-900">Resolution Failed</h3>
                  <p className="text-xs text-rose-700 mt-1 font-mono">{error}</p>
                  <button
                    onClick={() => fetchVariantData(query)}
                    className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold font-mono transition-colors shadow-2xs"
                  >
                    Retry NCBI Resolution
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Variant Resolved Content */}
          {variantData && !loading && (
            <div className="space-y-6">
              
              {/* Section 1: Variant Identity */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-700" />
                    <span>Variant Identity</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Biological nomenclature and gene association retrieved live from NCBI dbSNP.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* rsID */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                      rsID
                    </span>
                    <a
                      href={`https://www.ncbi.nlm.nih.gov/snp/${variantData.rsid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-bold font-mono text-cyan-700 hover:text-cyan-900 hover:underline flex items-center gap-1"
                    >
                      <span>{variantData.rsid || 'Not available'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Variant Class/Type */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                      Variant Type
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-900 uppercase">
                      {variantData.type || 'Not available'}
                    </span>
                  </div>

                  {/* Gene Symbol */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1 mb-1">
                      <Dna className="w-3.5 h-3.5 text-cyan-700" />
                      <span>Associated Gene</span>
                    </span>
                    {variantData.gene?.symbol ? (
                      <button
                        onClick={() => navigate(`/gene/${variantData.gene.symbol}`)}
                        className="text-sm font-bold font-mono text-cyan-700 hover:text-cyan-900 hover:underline flex items-center gap-1"
                      >
                        <span>{variantData.gene.symbol}</span>
                      </button>
                    ) : (
                      <span className="text-sm font-bold font-mono text-slate-400">
                        Not available
                      </span>
                    )}
                  </div>

                  {/* NCBI Gene ID */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1 mb-1">
                      <Database className="w-3.5 h-3.5 text-cyan-700" />
                      <span>NCBI Gene ID</span>
                    </span>
                    {variantData.gene?.entrezId ? (
                      <a
                        href={`https://www.ncbi.nlm.nih.gov/gene/${variantData.gene.entrezId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold font-mono text-cyan-700 hover:text-cyan-900 hover:underline flex items-center gap-1"
                      >
                        <span>{variantData.gene.entrezId}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-sm font-bold font-mono text-slate-400">
                        Not available
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Genomic Location */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-700" />
                    <span>Genomic Location</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Coordinates, assembly build, and allele changes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Assembly */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                      Genome Assembly
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-900 block">
                      {variantData.genomic?.assembly || 'GRCh38'}
                    </span>
                  </div>

                  {/* Chromosome */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                      Chromosome
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-900 block">
                      {variantData.genomic?.chromosome ? `Chr ${variantData.genomic.chromosome}` : 'Not available'}
                    </span>
                  </div>

                  {/* Position */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                      Position (GRCh38)
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-900 block truncate">
                      {variantData.genomic?.position ? Number(variantData.genomic.position).toLocaleString() : 'Not available'}
                    </span>
                  </div>

                  {/* Reference Allele */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                      Reference Allele
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                      {variantData.genomic?.reference || 'Not available'}
                    </span>
                  </div>

                  {/* Alternate Allele(s) */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                      Alternate Allele(s)
                    </span>
                    <span className="text-xs font-bold font-mono text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block">
                      {variantData.genomic?.alternate || 'Not available'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: HGVS Representations */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-700" />
                    <span>HGVS Representations</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authoritative normalized HGVS nomenclature for genomic, coding transcript, and protein expressions.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Genomic HGVS */}
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-900 text-cyan-400 font-mono text-xs font-bold rounded">
                        Genomic (g.)
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-900 select-all">
                        {variantData.hgvs?.genomic || 'Not available'}
                      </span>
                    </div>
                  </div>

                  {/* Coding HGVS */}
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-900 text-cyan-400 font-mono text-xs font-bold rounded">
                        Coding (c.)
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-900 select-all">
                        {variantData.hgvs?.coding || 'Not available'}
                      </span>
                    </div>
                  </div>

                  {/* Protein HGVS */}
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-900 text-cyan-400 font-mono text-xs font-bold rounded">
                        Protein (p.)
                      </span>
                      <span className="text-xs font-mono font-semibold text-cyan-800 select-all">
                        {variantData.hgvs?.protein || 'Not available'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: ClinVar Clinical Evidence */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-700" />
                      <span>ClinVar Clinical Evidence</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Variant-specific clinical significance, disease associations, and review assertions retrieved live from NCBI ClinVar.
                    </p>
                  </div>

                  {clinvarData && clinvarData.records && (
                    <span className="text-xs font-mono bg-cyan-50 text-cyan-800 px-2.5 py-1 rounded border border-cyan-200 font-semibold self-start sm:self-auto">
                      {clinvarData.records.length} ClinVar {clinvarData.records.length === 1 ? 'Record' : 'Records'} Found
                    </span>
                  )}
                </div>

                {/* Decoupled ClinVar Error Banner */}
                {clinvarError && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-4 text-xs font-mono text-amber-800 flex items-center justify-between gap-4">
                    <span>ClinVar data is temporarily unavailable.</span>
                    <button
                      onClick={() => fetchVariantData(query)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold shrink-0 transition-colors shadow-2xs"
                    >
                      Retry ClinVar Fetch
                    </button>
                  </div>
                )}

                {/* Conflicting Interpretations Notice Banner */}
                {clinvarData?.records?.some(r => r.hasConflict) && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs font-mono text-purple-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-purple-700 shrink-0" />
                    <span>
                      <strong className="font-bold">Conflicting interpretations reported in ClinVar</strong> — Submitters disagree on clinical significance for one or more allele representations of this variant.
                    </span>
                  </div>
                )}

                {/* ClinVar Records Table */}
                {clinvarData && clinvarData.records && clinvarData.records.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs font-sans border-collapse min-w-[750px]">
                      <thead>
                        <tr className="bg-slate-900 text-slate-200 font-mono text-[11px] uppercase tracking-wider">
                          <th className="py-3 px-3">ClinVar ID / Title</th>
                          <th className="py-3 px-3">Allele / Change</th>
                          <th className="py-3 px-3">ClinVar Clinical Significance</th>
                          <th className="py-3 px-3">Condition / Disease</th>
                          <th className="py-3 px-3">Review Status</th>
                          <th className="py-3 px-3 text-center">Submissions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {clinvarData.records.map((r, idx) => (
                          <tr key={r.variationId || idx} className="hover:bg-slate-50/80 transition-colors">
                            {/* Accession & Title */}
                            <td className="py-3 px-3 align-top">
                              <a
                                href={r.clinvarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-cyan-700 hover:text-cyan-900 hover:underline font-bold flex items-center gap-1 mb-0.5"
                              >
                                <span>{r.accession}</span>
                                <ExternalLink className="w-3 h-3 text-cyan-600" />
                              </a>
                              <p className="text-[11px] text-slate-600 line-clamp-2 max-w-xs">{r.title}</p>
                            </td>

                            {/* Allele */}
                            <td className="py-3 px-3 align-top font-mono text-[11px] text-slate-900 font-semibold max-w-[160px] truncate">
                              {r.allele || 'N/A'}
                            </td>

                            {/* ClinVar Clinical Significance */}
                            <td className="py-3 px-3 align-top">
                              {getSignificanceBadge(r.clinicalSignificance)}
                              {r.hasConflict && (
                                <span className="block mt-1 text-[10px] font-mono text-purple-700 font-semibold">
                                  ⚠ Conflicting interpretations
                                </span>
                              )}
                            </td>

                            {/* Condition */}
                            <td className="py-3 px-3 align-top text-slate-700 text-[11px] max-w-[200px]">
                              <span className="line-clamp-2" title={r.condition || 'Not specified'}>
                                {r.condition || 'Not specified'}
                              </span>
                            </td>

                            {/* Review Status & Stars */}
                            <td className="py-3 px-3 align-top">
                              {renderReviewStars(r.reviewStars, r.reviewStatus)}
                            </td>

                            {/* Submissions Count */}
                            <td className="py-3 px-3 align-top text-center font-mono text-xs font-semibold text-slate-700">
                              {r.submissionCount || 1}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  !clinvarError && (
                    <p className="text-xs text-slate-500 font-mono italic bg-slate-50 p-4 rounded border border-slate-200">
                      No ClinVar evidence records found specifically associated with this variant.
                    </p>
                  )
                )}
              </div>

              {/* Section 5: Stage 7 Protein Context */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Dna className="w-4 h-4 text-cyan-700" />
                    <span>Protein Context</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Connects specific variant alleles to RefSeq protein accessions, residue positions, molecular consequences, and UniProt functional annotations.
                  </p>
                </div>

                {/* Decoupled Protein Error Banner */}
                {proteinContextError && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-4 text-xs font-mono text-amber-800 flex items-center justify-between gap-4">
                    <span>Protein information unavailable</span>
                    <button
                      onClick={() => fetchVariantData(query)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold shrink-0 transition-colors shadow-2xs"
                    >
                      Retry Protein Fetch
                    </button>
                  </div>
                )}

                {/* Subsection A: Variant -> Protein Mapping Table */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                    <span>Variant → Protein Mapping</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                      Allele-Specific Consequences
                    </span>
                  </h4>

                  {proteinContextData && proteinContextData.mappings && proteinContextData.mappings.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs font-sans border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-slate-900 text-slate-200 font-mono text-[11px] uppercase tracking-wider">
                            <th className="py-2.5 px-3">Allele / Representation</th>
                            <th className="py-2.5 px-3">Coding HGVS</th>
                            <th className="py-2.5 px-3">Protein HGVS</th>
                            <th className="py-2.5 px-3 text-center">Residue Pos</th>
                            <th className="py-2.5 px-3">Ref → Alt AA</th>
                            <th className="py-2.5 px-3">Molecular Consequence</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {proteinContextData.mappings.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors font-mono">
                              <td className="py-2.5 px-3 font-semibold text-slate-900">
                                {m.allele || 'N/A'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">
                                {m.codingHgvs || 'N/A'}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-cyan-800">
                                {m.proteinHgvs || 'N/A'}
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                                {m.position !== null && m.position !== undefined ? m.position : 'N/A'}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                {m.referenceAA ? `${m.referenceAA} (${m.referenceAA1}) → ${m.alternateAA} (${m.alternateAA1})` : 'N/A'}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  m.consequence?.toLowerCase().includes('missense')
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : m.consequence?.toLowerCase().includes('nonsense')
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : m.consequence?.toLowerCase().includes('synonymous')
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {m.consequence}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-mono italic bg-slate-50 p-4 rounded border border-slate-200">
                      Protein-level consequence not available for this representation.
                    </p>
                  )}
                </div>

                <hr className="border-slate-100" />

                {/* Subsection B: UniProt Protein Details */}
                {proteinContextData && proteinContextData.protein ? (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded border border-slate-200">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-lg font-bold font-mono text-slate-900">
                            {proteinContextData.protein.proteinName}
                          </h4>
                          {proteinContextData.protein.isReviewed && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Swiss-Prot (Reviewed)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-mono">
                          UniProt Accession: <span className="font-bold text-slate-900">{proteinContextData.protein.accession}</span>
                          {proteinContextData.protein.geneSymbol && (
                            <span className="ml-3">Gene: <strong className="text-cyan-800">{proteinContextData.protein.geneSymbol}</strong></span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-white px-3 py-1.5 rounded border border-slate-200">
                          <span className="text-[10px] font-mono text-slate-500 uppercase block">Sequence Length</span>
                          <span className="text-xs font-bold font-mono text-slate-900">
                            {proteinContextData.protein.sequenceLength ? `${proteinContextData.protein.sequenceLength.toLocaleString()} aa` : 'N/A'}
                          </span>
                        </div>

                        <a
                          href={proteinContextData.protein.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-mono font-semibold hover:bg-cyan-100 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View on UniProt</span>
                        </a>
                      </div>
                    </div>

                    {/* Functional Summary */}
                    {proteinContextData.protein.functionSummary && (
                      <div className="bg-slate-50 p-4 rounded border border-slate-200">
                        <span className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1 mb-1">
                          <FileText className="w-3.5 h-3.5 text-cyan-700" />
                          <span>UniProt Functional Annotation</span>
                        </span>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {proteinContextData.protein.functionSummary}
                        </p>
                      </div>
                    )}

                    {/* Domain Annotations */}
                    {proteinContextData.protein.domains && proteinContextData.protein.domains.length > 0 && (
                      <div>
                        <h4 className="text-xs font-mono uppercase text-slate-500 font-bold mb-2 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-cyan-700" />
                          <span>Protein Domains & Regions ({proteinContextData.protein.domains.length})</span>
                        </h4>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left text-xs font-sans border-collapse min-w-[500px]">
                            <thead>
                              <tr className="bg-slate-900 text-slate-200 font-mono text-[11px] uppercase tracking-wider">
                                <th className="py-2.5 px-3">Domain Name</th>
                                <th className="py-2.5 px-3 text-right">Start</th>
                                <th className="py-2.5 px-3 text-right">End</th>
                                <th className="py-2.5 px-3">Type</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {proteinContextData.protein.domains.map((d, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-2 px-3 font-semibold text-slate-900 font-mono">
                                    {d.name}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-slate-700">
                                    {d.start ?? 'N/A'}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-slate-700">
                                    {d.end ?? 'N/A'}
                                  </td>
                                  <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                      {d.type || 'Domain'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  !proteinContextError && (
                    <p className="text-xs text-slate-500 font-mono italic bg-slate-50 p-4 rounded border border-slate-200">
                      Protein information unavailable
                    </p>
                  )
                )}
              </div>

              {/* Section 6: Stage 8 Structural Context */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Box className="w-4 h-4 text-cyan-700" />
                    <span>Structural Context</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Residue-specific experimental PDB structure coverage and AlphaFold predicted model confidence for resolved variant alleles.
                  </p>
                </div>

                {/* Decoupled Structural Error Banner */}
                {structuralContextError && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-4 text-xs font-mono text-amber-800 flex items-center justify-between gap-4">
                    <span>Experimental structural data unavailable</span>
                    <button
                      onClick={() => fetchVariantData(query)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold shrink-0 transition-colors shadow-2xs"
                    >
                      Retry Structural Fetch
                    </button>
                  </div>
                )}

                {structuralContextData ? (
                  <div className="space-y-6">

                    {/* Structural Coverage Summary Cards */}
                    {structuralContextData.summary && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-4 rounded border border-slate-200">
                          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                            Primary Variant Residue
                          </span>
                          <span className="text-sm font-bold font-mono text-slate-900">
                            {structuralContextData.summary.primaryPosition !== null
                              ? `Position ${structuralContextData.summary.primaryPosition}`
                              : 'Unavailable'}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-4 rounded border border-slate-200">
                          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                            PDB Residue Coverage
                          </span>
                          <span className="text-sm font-bold font-mono text-cyan-800">
                            {structuralContextData.summary.coveringPdbCount} / {structuralContextData.summary.totalPdbCount} PDBs
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                            {structuralContextData.summary.coveringPdbCount > 0 ? 'Covered in experimental structures' : 'Not in PDB experimental coverage'}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-4 rounded border border-slate-200">
                          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                            AlphaFold Model
                          </span>
                          <span className="text-sm font-bold font-mono text-slate-900 flex items-center gap-1">
                            <span>{structuralContextData.summary.alphafoldAvailable ? 'Available' : 'Unavailable'}</span>
                            {structuralContextData.summary.alphafoldResidueCovered && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Covered
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-4 rounded border border-slate-200">
                          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                            Residue pLDDT Confidence
                          </span>
                          <span className="text-sm font-bold font-mono text-slate-900">
                            {structuralContextData.summary.residuePlddt !== null
                              ? `${structuralContextData.summary.residuePlddt}`
                              : 'Unavailable'}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 block mt-0.5 truncate" title={structuralContextData.summary.residueCategory || ''}>
                            {structuralContextData.summary.residueCategory || structuralContextData.summary.residuePlddtStatus || 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Subsection A: Allele-Specific Structural Coverage Table */}
                    {structuralContextData.alleleStructuralMappings && structuralContextData.alleleStructuralMappings.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                          <span>Allele-Specific Residue Structural Coverage</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                            Multi-Allelic Mapping
                          </span>
                        </h4>

                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left text-xs font-sans border-collapse min-w-[700px]">
                            <thead>
                              <tr className="bg-slate-900 text-slate-200 font-mono text-[11px] uppercase tracking-wider">
                                <th className="py-2.5 px-3">Allele / Representation</th>
                                <th className="py-2.5 px-3">Protein HGVS</th>
                                <th className="py-2.5 px-3 text-center">Residue Pos</th>
                                <th className="py-2.5 px-3 text-center">PDB Coverage</th>
                                <th className="py-2.5 px-3 text-center">AlphaFold Coverage</th>
                                <th className="py-2.5 px-3">Residue pLDDT</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white font-mono">
                              {structuralContextData.alleleStructuralMappings.map((m, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                                    {m.allele || 'N/A'}
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-cyan-800">
                                    {m.proteinHgvs || 'N/A'}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                                    {m.position !== null ? m.position : 'N/A'}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      m.isCoveredByPdb
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                      {m.pdbCoveredCount} / {m.totalPdbCount} PDBs
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      m.isCoveredByAlphaFold
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                      {m.isCoveredByAlphaFold ? 'Covered' : 'Not Covered'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                                    {m.residuePlddt !== null ? (
                                      <span>
                                        <strong className="text-slate-900">{m.residuePlddt}</strong>
                                        <span className="text-[10px] text-slate-500 ml-1 font-normal">({m.residueCategory})</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-500 italic text-[11px]">Residue-specific confidence unavailable</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <hr className="border-slate-100" />

                    {/* Subsection B: Experimental PDB Structures */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                            <span>Experimental Structures (RCSB PDB)</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              Experimental Structure
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5 font-mono">
                            {structuralContextData.coveringPdbStructures.length} of {structuralContextData.totalPdbCount} PDB structures cover the variant residue position.
                          </p>
                        </div>
                      </div>

                      {structuralContextData.coveringPdbStructures.length > 0 ? (
                        <div className="overflow-x-auto border border-slate-200 rounded-lg font-mono">
                          <table className="w-full text-left text-xs font-sans border-collapse min-w-[700px]">
                            <thead>
                              <tr className="bg-slate-900 text-slate-200 font-mono text-[11px] uppercase tracking-wider">
                                <th className="py-2.5 px-3">PDB ID</th>
                                <th className="py-2.5 px-3">Experimental Method</th>
                                <th className="py-2.5 px-3 text-right">Resolution</th>
                                <th className="py-2.5 px-3">Chain(s)</th>
                                <th className="py-2.5 px-3">Residue Coverage</th>
                                <th className="py-2.5 px-3 text-center">Variant Residue</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white font-mono">
                              {structuralContextData.coveringPdbStructures.map((pdb) => (
                                <tr key={pdb.pdbId} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-2.5 px-3 font-bold">
                                    <a
                                      href={pdb.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-cyan-700 hover:text-cyan-900 hover:underline flex items-center gap-1"
                                    >
                                      <span>{pdb.pdbId}</span>
                                      <ExternalLink className="w-3 h-3 text-cyan-600" />
                                    </a>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-700">
                                    {pdb.method}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                                    {pdb.resolution}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-700">
                                    {pdb.coveredChains}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                                    {pdb.coverage}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      Covered
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 font-mono italic bg-slate-50 p-4 rounded border border-slate-200">
                          No experimental PDB structures explicitly cover this variant residue position.
                        </p>
                      )}

                      {/* Collapsible non-covering PDB entries */}
                      {structuralContextData.nonCoveringPdbStructures.length > 0 && (
                        <div className="pt-2">
                          <button
                            onClick={() => setShowNonCoveringPdbs(!showNonCoveringPdbs)}
                            className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-700 hover:text-cyan-800 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded border border-slate-300"
                          >
                            {showNonCoveringPdbs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            <span>
                              {showNonCoveringPdbs ? 'Hide' : 'Show'} Non-Covering PDB Entries ({structuralContextData.nonCoveringPdbStructures.length})
                            </span>
                          </button>

                          {showNonCoveringPdbs && (
                            <div className="mt-3 overflow-x-auto border border-slate-200 rounded-lg max-h-80 overflow-y-auto">
                              <table className="w-full text-left text-xs font-sans border-collapse min-w-[700px]">
                                <thead>
                                  <tr className="bg-slate-800 text-slate-200 font-mono text-[11px] uppercase tracking-wider sticky top-0">
                                    <th className="py-2.5 px-3">PDB ID</th>
                                    <th className="py-2.5 px-3">Method</th>
                                    <th className="py-2.5 px-3 text-right">Resolution</th>
                                    <th className="py-2.5 px-3">Residue Coverage</th>
                                    <th className="py-2.5 px-3 text-center">Variant Residue</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white font-mono">
                                  {structuralContextData.nonCoveringPdbStructures.map((pdb) => (
                                    <tr key={pdb.pdbId} className="hover:bg-slate-50 transition-colors">
                                      <td className="py-2 px-3 font-bold">
                                        <a
                                          href={pdb.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-cyan-700 hover:text-cyan-900 hover:underline flex items-center gap-1"
                                        >
                                          <span>{pdb.pdbId}</span>
                                          <ExternalLink className="w-3 h-3 text-cyan-600" />
                                        </a>
                                      </td>
                                      <td className="py-2 px-3 text-slate-700">{pdb.method}</td>
                                      <td className="py-2 px-3 text-right font-semibold text-slate-800">{pdb.resolution}</td>
                                      <td className="py-2 px-3 text-slate-600 text-[11px]">{pdb.coverage}</td>
                                      <td className="py-2 px-3 text-center">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                          Not Covered
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <hr className="border-slate-100" />

                    {/* Subsection C: AlphaFold Predicted Structure */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                        <span>Predicted Structure (AlphaFold Database)</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Predicted Structure
                        </span>
                      </h4>

                      {structuralContextData.alphafold ? (
                        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-4 font-mono">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-base font-bold text-slate-900">
                                  {structuralContextData.alphafold.entryId}
                                </h5>
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                  AlphaFold Monomer v2.0
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">
                                UniProt Accession: <strong className="text-slate-900">{structuralContextData.alphafold.uniprotAccession}</strong>
                              </p>
                            </div>

                            <a
                              href={structuralContextData.alphafold.entryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold hover:bg-cyan-100 transition-colors shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View on AlphaFold DB</span>
                            </a>
                          </div>

                          {/* Grid Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                            <div className="bg-white p-3 rounded border border-slate-200">
                              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Model Coverage</span>
                              <span className="font-bold text-slate-900">{structuralContextData.alphafold.coverage}</span>
                            </div>

                            <div className="bg-white p-3 rounded border border-slate-200">
                              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Global pLDDT Score</span>
                              <span className="font-bold text-slate-900">{structuralContextData.alphafold.globalPlddt ?? 'N/A'}</span>
                              <span className="text-[10px] text-slate-500 block truncate">{structuralContextData.alphafold.confidenceCategory}</span>
                            </div>

                            <div className="bg-white p-3 rounded border border-slate-200">
                              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Variant Residue Position</span>
                              <span className="font-bold text-slate-900">
                                {structuralContextData.alphafold.residueContext?.residuePosition
                                  ? `Residue ${structuralContextData.alphafold.residueContext.residuePosition}`
                                  : 'N/A'}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-bold block">
                                {structuralContextData.alphafold.residueContext?.isCovered ? 'Covered in Model' : 'Outside Coverage'}
                              </span>
                            </div>

                            <div className="bg-white p-3 rounded border border-slate-200">
                              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Residue-Specific pLDDT</span>
                              <span className="font-bold text-cyan-900 text-sm">
                                {structuralContextData.alphafold.residueContext?.residuePlddt !== null
                                  ? `${structuralContextData.alphafold.residueContext.residuePlddt}`
                                  : 'N/A'}
                              </span>
                              <span className="text-[10px] text-slate-600 block truncate" title={structuralContextData.alphafold.residueContext?.residueCategory || ''}>
                                {structuralContextData.alphafold.residueContext?.residueCategory || structuralContextData.alphafold.residueContext?.status || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 font-mono italic bg-slate-50 p-4 rounded border border-slate-200">
                          AlphaFold structural data unavailable
                        </p>
                      )}
                    </div>

                  </div>
                ) : (
                  !structuralContextError && (
                    <p className="text-xs text-slate-500 font-mono italic bg-slate-50 p-4 rounded border border-slate-200">
                      Residue-specific structural mapping unavailable because no protein context is available.
                    </p>
                  )
                )}
              </div>

              {/* Section 6.5: Stage 13 Interactive 3D Structural View */}
              {structuralContextData && (
                <Variant3DViewer
                  structuralContextData={structuralContextData}
                  proteinContextData={proteinContextData}
                  variantData={variantData}
                  query={query}
                />
              )}

              {/* Section 7: Stage 9 Computational Functional Predictions */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-700" />
                      <span>Computational Functional Predictions</span>
                    </h3>
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200 w-fit">
                      Computational predictions — not clinical classifications
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Evaluates potential deleteriousness based on sequence conservation, structural features, or machine learning models. Kept completely separate from ClinVar clinical evidence and structural coverage.
                  </p>
                </div>

                {/* Decoupled Predictions Error Banner */}
                {predictionsError && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-4 text-xs font-mono text-amber-800 flex items-center justify-between gap-4">
                    <span>Functional prediction data unavailable</span>
                    <button
                      onClick={() => fetchVariantData(query)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold shrink-0 transition-colors shadow-2xs"
                    >
                      Retry Prediction Fetch
                    </button>
                  </div>
                )}

                {predictionsData && predictionsData.allelePredictions && predictionsData.allelePredictions.length > 0 ? (
                  <div className="space-y-6">

                    {/* Disagreement / Scientific Explanatory Note */}
                    {predictionsData.disagreementNote && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-slate-700 font-sans">
                        <Info className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-semibold text-slate-900 font-mono">Scientific Note: </span>
                          <span>{predictionsData.disagreementNote}</span>
                        </div>
                      </div>
                    )}

                    {/* Predictions Per Allele */}
                    {predictionsData.allelePredictions.map((alleleItem, aIdx) => (
                      <div key={aIdx} className="bg-slate-50/70 border border-slate-200 rounded-lg p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold font-mono text-slate-900">
                                {alleleItem.allele}
                              </h4>
                              {alleleItem.proteinHgvs && alleleItem.proteinHgvs !== 'N/A' && (
                                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-100 text-cyan-900 border border-cyan-200">
                                  {alleleItem.proteinHgvs}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                              Transcript: <span className="text-slate-800">{alleleItem.transcriptId}</span> | Gene: <span className="font-bold text-cyan-800">{alleleItem.geneSymbol}</span>
                            </p>
                          </div>
                        </div>

                        {/* Predictors Table for this allele */}
                        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                          <table className="w-full text-left text-xs font-sans border-collapse min-w-[650px]">
                            <thead>
                              <tr className="bg-slate-900 text-slate-200 font-mono text-[11px] uppercase tracking-wider">
                                <th className="py-2.5 px-3">Predictor</th>
                                <th className="py-2.5 px-3">Prediction / Result</th>
                                <th className="py-2.5 px-3 text-right">Score</th>
                                <th className="py-2.5 px-3">Source & Version</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white font-mono">
                              {/* AlphaMissense */}
                              {alleleItem.predictors?.alphaMissense && (
                                <tr className="hover:bg-slate-50 transition-colors">
                                  <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>AlphaMissense</span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      alleleItem.predictors.alphaMissense.prediction?.toLowerCase().includes('pathogenic')
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : alleleItem.predictors.alphaMissense.prediction?.toLowerCase().includes('benign')
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : alleleItem.predictors.alphaMissense.prediction?.toLowerCase().includes('ambiguous')
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}>
                                      {alleleItem.predictors.alphaMissense.prediction}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                    {alleleItem.predictors.alphaMissense.score !== null ? alleleItem.predictors.alphaMissense.score : 'N/A'}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                    {alleleItem.predictors.alphaMissense.source}
                                  </td>
                                </tr>
                              )}

                              {/* CADD */}
                              {alleleItem.predictors?.cadd && (
                                <tr className="hover:bg-slate-50 transition-colors">
                                  <td className="py-2.5 px-3 font-bold text-slate-900">
                                    <span>CADD PHRED</span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                                      {alleleItem.predictors.cadd.prediction}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                    {alleleItem.predictors.cadd.score !== null ? alleleItem.predictors.cadd.score : 'N/A'}
                                    {alleleItem.predictors.cadd.rawScore !== null && (
                                      <span className="text-[10px] text-slate-500 ml-1 font-normal">(raw {alleleItem.predictors.cadd.rawScore})</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                    {alleleItem.predictors.cadd.source} {alleleItem.predictors.cadd.version}
                                  </td>
                                </tr>
                              )}

                              {/* SIFT */}
                              {alleleItem.predictors?.sift && (
                                <tr className="hover:bg-slate-50 transition-colors">
                                  <td className="py-2.5 px-3 font-bold text-slate-900">
                                    <span>SIFT</span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      alleleItem.predictors.sift.prediction?.toLowerCase().includes('deleterious')
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : alleleItem.predictors.sift.prediction?.toLowerCase().includes('tolerated')
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}>
                                      {alleleItem.predictors.sift.prediction}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                    {alleleItem.predictors.sift.score !== null ? alleleItem.predictors.sift.score : 'N/A'}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                    {alleleItem.predictors.sift.source} {alleleItem.predictors.sift.version}
                                  </td>
                                </tr>
                              )}

                              {/* PolyPhen-2 */}
                              {alleleItem.predictors?.polyphen && (
                                <tr className="hover:bg-slate-50 transition-colors">
                                  <td className="py-2.5 px-3 font-bold text-slate-900">
                                    <span>PolyPhen-2</span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      alleleItem.predictors.polyphen.prediction?.toLowerCase().includes('damaging')
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : alleleItem.predictors.polyphen.prediction?.toLowerCase().includes('benign')
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}>
                                      {alleleItem.predictors.polyphen.prediction}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                    {alleleItem.predictors.polyphen.score !== null ? alleleItem.predictors.polyphen.score : 'N/A'}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                    {alleleItem.predictors.polyphen.source} {alleleItem.predictors.polyphen.version}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}

                  </div>
                ) : (
                  !predictionsError && (
                    <p className="text-xs text-slate-500 font-mono italic bg-slate-50 p-4 rounded border border-slate-200">
                      Functional prediction data unavailable for this representation.
                    </p>
                  )
                )}
              </div>

              {/* Section 8: Stage 10 Evidence Consistency */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Evidence Consistency</span>
                    </h3>

                    {reconciliationData && (
                      <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold w-fit ${
                        reconciliationData.status === 'matched'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : reconciliationData.status === 'equivalent'
                          ? 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                          : reconciliationData.status === 'partial'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-800 border border-slate-300'
                      }`}>
                        {reconciliationData.status === 'matched' && 'NCBI ↔ ClinVar ↔ UniProt ↔ VEP: Allele Matched ✓'}
                        {reconciliationData.status === 'equivalent' && 'Equivalent Representation Across Transcripts / Isoforms ⇄'}
                        {reconciliationData.status === 'partial' && 'Partial Evidence Reconciliation'}
                        {reconciliationData.status === 'unavailable' && 'Consistency Unavailable'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Verifies that NCBI dbSNP, ClinVar clinical records, UniProt protein context, and Ensembl VEP predictions resolve to the exact same biological allele.
                  </p>
                </div>

                {reconciliationData && (
                  <div className="space-y-6">

                    {/* Genomic Baseline & RefSeq Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-3.5 rounded border border-slate-200">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                          NCBI RefSNP Locus
                        </span>
                        <span className="text-xs font-bold font-mono text-slate-900 select-all block">
                          {reconciliationData.genomicLocus || 'N/A'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded border border-slate-200">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                          Primary Coding HGVS
                        </span>
                        <span className="text-xs font-bold font-mono text-cyan-900 select-all block">
                          {reconciliationData.primaryCodingHgvs || 'N/A'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded border border-slate-200">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                          Primary Protein HGVS
                        </span>
                        <span className="text-xs font-bold font-mono text-slate-900 select-all block">
                          {reconciliationData.primaryProteinHgvs || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Discrepancies & Representation Differences */}
                    {reconciliationData.discrepancies && reconciliationData.discrepancies.length > 0 && (
                      <div className="bg-cyan-50/70 border border-cyan-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-cyan-800 shrink-0" />
                          <h4 className="text-xs font-bold font-mono text-cyan-950 uppercase">
                            Representation Differences Detected ({reconciliationData.discrepancies.length})
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {reconciliationData.discrepancies.map((d, dIdx) => (
                            <div key={dIdx} className="bg-white p-3 rounded border border-cyan-200 text-xs font-sans">
                              <div className="flex items-center justify-between gap-2 font-mono mb-1">
                                <span className="font-bold text-slate-900">
                                  Allele {d.allele} — {d.type}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-100 text-cyan-900 font-bold border border-cyan-200">
                                  {d.source}
                                </span>
                              </div>
                              <p className="text-slate-700 text-[11px] leading-relaxed">
                                {d.detail}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Per-Allele Evidence Source Matrix */}
                    {reconciliationData.normalizedAlleles && reconciliationData.normalizedAlleles.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider flex items-center justify-between">
                          <span>Allele Evidence Consistency Matrix</span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            {reconciliationData.normalizedAlleles.length} Alternate Alleles Evaluated
                          </span>
                        </h4>

                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left text-xs font-sans border-collapse min-w-[700px]">
                            <thead>
                              <tr className="bg-slate-900 text-slate-200 font-mono text-[11px] uppercase tracking-wider">
                                <th className="py-2.5 px-3">Alternate Allele</th>
                                <th className="py-2.5 px-3 text-center">NCBI dbSNP</th>
                                <th className="py-2.5 px-3 text-center">ClinVar</th>
                                <th className="py-2.5 px-3 text-center">UniProt Context</th>
                                <th className="py-2.5 px-3 text-center">Ensembl VEP</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white font-mono text-[11px]">
                              {reconciliationData.normalizedAlleles.map((na, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-2.5 px-3 font-bold text-slate-900">
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-900 font-mono font-bold">
                                        Allele {na.alternateAllele}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-normal">
                                        ({na.proteinHgvs || na.codingHgvs || 'N/A'})
                                      </span>
                                    </div>
                                  </td>

                                  {/* NCBI */}
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      NCBI ✓
                                    </span>
                                  </td>

                                  {/* ClinVar */}
                                  <td className="py-2.5 px-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      na.sources.clinvar.status === 'matched'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : na.sources.clinvar.status === 'partial'
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                                    }`}>
                                      {na.sources.clinvar.status === 'matched' && 'ClinVar ✓'}
                                      {na.sources.clinvar.status === 'partial' && 'ClinVar ⚠ Partial'}
                                      {na.sources.clinvar.status === 'unavailable' && 'ClinVar — Unavailable'}
                                    </span>
                                  </td>

                                  {/* UniProt */}
                                  <td className="py-2.5 px-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      na.sources.uniprot.status === 'matched'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : na.sources.uniprot.status === 'equivalent'
                                        ? 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                                    }`}>
                                      {na.sources.uniprot.status === 'matched' && 'UniProt ✓'}
                                      {na.sources.uniprot.status === 'equivalent' && 'UniProt ⇄ Equivalent'}
                                      {na.sources.uniprot.status === 'unavailable' && 'UniProt — Unavailable'}
                                    </span>
                                  </td>

                                  {/* Ensembl VEP */}
                                  <td className="py-2.5 px-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      na.sources.vep.status === 'matched'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                                    }`}>
                                      {na.sources.vep.status === 'matched' ? 'VEP ✓' : 'VEP — Unavailable'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* Section 9: Stage 14 Evidence & Scientific Interpretation Layer */}
              {variantData && (
                <EvidenceInterpretation
                  evidenceSummaryData={evidenceSummaryData}
                  variantData={variantData}
                  clinvarData={clinvarData}
                  proteinContextData={proteinContextData}
                  structuralContextData={structuralContextData}
                  predictionsData={predictionsData}
                  reconciliationData={reconciliationData}
                />
              )}

            </div>
          )}

        </div>
      ) : (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-2xs">
          <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Enter a Variant Identifier</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Search for a RefSNP rsID such as <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-cyan-800">rs28934578</code>, <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-cyan-800">rs121913343</code>, <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-cyan-800">rs1799966</code>, or <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-cyan-800">rs121913529</code>.
          </p>
        </div>
      )}

    </div>
  );
}
