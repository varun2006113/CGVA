import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { detectInputType, getDetectionLabel } from '../utils/inputDetection';
import { Dna, CheckCircle2, Search, Loader2, AlertTriangle, ExternalLink, FileText, Layers, MapPin, Database, Activity, Box } from 'lucide-react';

export default function GeneExplorerPage() {
  const { symbol: pathSymbol } = useParams();
  const [searchParams] = useSearchParams();
  const rawQuery = pathSymbol || searchParams.get('query') || '';
  const query = decodeURIComponent(rawQuery).trim();
  const detectedType = detectInputType(query);
  const navigate = useNavigate();

  const [geneData, setGeneData] = useState(null);
  const [clinvarData, setClinvarData] = useState(null);
  const [proteinData, setProteinData] = useState(null);
  const [structuresData, setStructuresData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clinvarError, setClinvarError] = useState(null);
  const [proteinError, setProteinError] = useState(null);
  const [structuresError, setStructuresError] = useState(null);

  const fetchGeneData = async (symbolToFetch) => {
    if (!symbolToFetch) return;
    setLoading(true);
    setError(null);
    setClinvarError(null);
    setProteinError(null);
    setStructuresError(null);
    setGeneData(null);
    setClinvarData(null);
    setProteinData(null);
    setStructuresData(null);

    try {
      console.log(`[GeneExplorerPage] Requesting live NCBI gene, ClinVar, UniProt, and Structural data for: "${symbolToFetch}"`);
      const res = await fetch(`/api/gene/${encodeURIComponent(symbolToFetch)}`);
      const json = await res.json();

      if (!res.ok || json.error || !json.gene) {
        throw new Error(json.error || 'NCBI gene data temporarily unavailable');
      }

      setGeneData(json.gene);

      if (json.clinvar && !json.clinvar.error) {
        setClinvarData(json.clinvar);
      } else if (json.clinvar?.error) {
        setClinvarError(json.clinvar.error);
      }

      if (json.protein) {
        setProteinData(json.protein);
      } else if (json.proteinError) {
        setProteinError(json.proteinError);
      }

      if (json.structures) {
        setStructuresData(json.structures);
      }
    } catch (err) {
      console.error('[GeneExplorerPage] Fetch Error:', err.message);
      setError(err.message || 'NCBI gene data temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      fetchGeneData(query);
    } else {
      setGeneData(null);
      setClinvarData(null);
      setProteinData(null);
      setError(null);
      setClinvarError(null);
      setProteinError(null);
      setLoading(false);
    }
  }, [query]);

  const handleSearch = (inputVal, type) => {
    const clean = inputVal.trim();
    const resolvedType = type || detectInputType(clean);

    console.log(`[GeneExplorerPage Search] Input: "${clean}", Type: "${resolvedType}"`);

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
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Dna className="w-5 h-5 text-cyan-700" />
            <span>Gene Explorer</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live gene, ClinVar variant, and UniProt protein evidence powered by NCBI and UniProt APIs.
          </p>
        </div>

        <SearchBar onSearch={handleSearch} initialQuery={query} className="max-w-xl" />
      </div>

      {/* Main Content Area */}
      {query ? (
        <div className="space-y-6">
          
          {/* Main Identifier & Route Banner */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-slate-900 text-cyan-400 flex items-center justify-center font-bold text-xl font-mono">
                  {query.slice(0, 4).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500 uppercase">Requested Gene Symbol:</span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                      {detectedType}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-0.5">
                    {query.toUpperCase()}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded bg-slate-100 border border-slate-200 font-mono text-xs text-slate-700 font-medium">
                  Route: /gene/{query.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Classification & Route Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                  Target Gene Symbol
                </span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {query.toUpperCase()}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                  Input Classification
                </span>
                <span className="text-base font-bold font-mono text-cyan-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                  <span>{getDetectionLabel(detectedType)}</span>
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                  Active Route Path
                </span>
                <span className="text-base font-bold font-mono text-slate-900">
                  /gene/{query.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
              <Loader2 className="w-8 h-8 text-cyan-600 animate-spin mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">Fetching Live Gene, ClinVar & UniProt Data</h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Querying NCBI & UniProt REST APIs for <span className="font-bold text-cyan-700">{query.toUpperCase()}</span>...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-rose-900">Retrieval Failed</h3>
                  <p className="text-xs text-rose-700 mt-1 font-mono">{error}</p>
                  <button
                    onClick={() => fetchGeneData(query)}
                    className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold font-mono transition-colors shadow-2xs"
                  >
                    Retry NCBI Retrieval
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Gene Data Display */}
          {geneData && !loading && (
            <div className="space-y-6">

              {/* Top Overview Card */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold font-mono text-slate-900">
                        {geneData.symbol}
                      </h2>
                      {geneData.organism && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {geneData.organism}
                        </span>
                      )}
                    </div>
                    {geneData.officialName && (
                      <p className="text-sm font-medium text-slate-700 mt-1">
                        {geneData.officialName}
                      </p>
                    )}
                  </div>

                  {geneData.entrezId && (
                    <a
                      href={`https://www.ncbi.nlm.nih.gov/gene/${geneData.entrezId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-mono font-semibold hover:bg-cyan-100 transition-colors self-start md:self-auto"
                    >
                      <Database className="w-3.5 h-3.5 text-cyan-600" />
                      <span>NCBI Gene ID: {geneData.entrezId}</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 text-cyan-600" />
                    </a>
                  )}
                </div>

                {/* Key Attributes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Chromosome & Cytoband */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-700" />
                      <span>Chromosome & Cytoband</span>
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-900 block">
                      {geneData.chromosome ? `Chr ${geneData.chromosome}` : 'N/A'}
                      {geneData.cytoband && ` (${geneData.cytoband})`}
                    </span>
                  </div>

                  {/* Genomic Location */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1 mb-1">
                      <Layers className="w-3.5 h-3.5 text-cyan-700" />
                      <span>Genomic Location</span>
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-900 block truncate">
                      {geneData.genomicLocation || 'N/A'}
                    </span>
                  </div>

                  {/* Genome Build / Assembly */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1 mb-1">
                      <Database className="w-3.5 h-3.5 text-cyan-700" />
                      <span>Genome Assembly</span>
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-900 block truncate">
                      {geneData.genomeBuild || 'GRCh38'}
                    </span>
                  </div>

                  {/* Coordinates / Exon Count */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1 mb-1">
                      <FileText className="w-3.5 h-3.5 text-cyan-700" />
                      <span>Exon Count</span>
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-900 block">
                      {geneData.genomicCoordinates?.exonCount ?? 'N/A'}
                    </span>
                  </div>

                </div>

                {/* Aliases */}
                {geneData.aliases && geneData.aliases.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-slate-500 uppercase mr-1">Aliases:</span>
                    {geneData.aliases.slice(0, 10).map((alias, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
                        {alias}
                      </span>
                    ))}
                    {geneData.aliases.length > 10 && (
                      <span className="text-xs font-mono text-slate-400">
                        +{geneData.aliases.length - 10} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Functional Summary Section */}
              {geneData.summary && (
                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-cyan-700" />
                    <span>NCBI Gene Summary</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded border border-slate-200">
                    {geneData.summary}
                  </p>
                </div>
              )}

              {/* RefSeq Transcript Information */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-700" />
                    <span>RefSeq Transcripts</span>
                  </h3>
                  <span className="text-xs font-mono bg-cyan-50 text-cyan-800 px-2.5 py-1 rounded border border-cyan-200 font-semibold">
                    {geneData.refseqTranscripts?.length || 0} Retrieved
                  </span>
                </div>

                {geneData.refseqTranscripts && geneData.refseqTranscripts.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded overflow-hidden">
                    {geneData.refseqTranscripts.map((t, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 hover:bg-slate-100/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-900 text-cyan-400 font-mono text-xs font-bold rounded">
                            {t.accession}
                          </span>
                          <span className="text-xs font-medium text-slate-700 line-clamp-1">
                            {t.title || 'RefSeq RNA Transcript'}
                          </span>
                        </div>
                        <a
                          href={`https://www.ncbi.nlm.nih.gov/nuccore/${t.accession}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono text-cyan-700 hover:text-cyan-900 hover:underline inline-flex items-center gap-1 shrink-0"
                        >
                          <span>NCBI Nuccore</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-mono italic bg-slate-50 p-4 rounded border border-slate-200">
                    RefSeq transcript information unavailable for this gene record.
                  </p>
                )}
              </div>

              {/* ClinVar Variant Evidence Section */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-700" />
                      <span>ClinVar Variant Evidence</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cancer & disease-associated variant records retrieved live from NCBI ClinVar.
                    </p>
                  </div>
                  
                  {clinvarData && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-xs font-mono bg-cyan-50 text-cyan-800 px-2.5 py-1 rounded border border-cyan-200 font-semibold">
                        {clinvarData.totalCount ? `${clinvarData.totalCount.toLocaleString()} Total Records` : 'ClinVar Records'}
                      </span>
                      <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200 font-medium">
                        Displaying {clinvarData.returnedCount || 0}
                      </span>
                    </div>
                  )}
                </div>

                {/* ClinVar Error Banner (Decoupled) */}
                {clinvarError && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-4 text-xs font-mono text-amber-800 flex items-center justify-between gap-4">
                    <span>ClinVar data is temporarily unavailable.</span>
                    <button
                      onClick={() => fetchGeneData(query)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold shrink-0 transition-colors shadow-2xs"
                    >
                      Retry ClinVar Fetch
                    </button>
                  </div>
                )}

                {/* ClinVar Variants Table */}
                {clinvarData && clinvarData.variants && clinvarData.variants.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs font-sans border-collapse min-w-[850px]">
                      <thead>
                        <tr className="bg-slate-900 text-slate-200 font-mono text-[11px] uppercase tracking-wider">
                          <th className="py-3 px-3">Variant / Accession</th>
                          <th className="py-3 px-3">rsID</th>
                          <th className="py-3 px-3">HGVS (Coding / Protein)</th>
                          <th className="py-3 px-3">Consequence</th>
                          <th className="py-3 px-3">ClinVar Clinical Significance</th>
                          <th className="py-3 px-3">Condition / Disease</th>
                          <th className="py-3 px-3">Review Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {clinvarData.variants.map((v, idx) => (
                          <tr key={v.variationId || idx} className="hover:bg-slate-50/80 transition-colors">
                            {/* Accession & Title */}
                            <td className="py-3 px-3 align-top">
                              <a
                                href={v.clinvarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-cyan-700 hover:text-cyan-900 hover:underline font-bold flex items-center gap-1 mb-0.5"
                              >
                                <span>{v.accession}</span>
                                <ExternalLink className="w-3 h-3 text-cyan-600" />
                              </a>
                              <p className="text-[11px] text-slate-600 line-clamp-2 max-w-xs">{v.title}</p>
                            </td>

                            {/* rsID */}
                            <td className="py-3 px-3 align-top font-mono">
                              {v.rsid ? (
                                <a
                                  href={`https://www.ncbi.nlm.nih.gov/snp/${v.rsid}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-slate-900 hover:text-cyan-700 hover:underline bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold"
                                >
                                  <span>{v.rsid}</span>
                                </a>
                              ) : (
                                <span className="text-slate-400 text-[11px]">N/A</span>
                              )}
                            </td>

                            {/* HGVS */}
                            <td className="py-3 px-3 align-top font-mono text-[11px] max-w-[200px]">
                              {v.hgvsCoding && (
                                <div className="text-slate-900 font-semibold truncate" title={v.hgvsCoding}>
                                  {v.hgvsCoding}
                                </div>
                              )}
                              {v.hgvsProtein && (
                                <div className="text-cyan-800 font-medium truncate" title={v.hgvsProtein}>
                                  {v.hgvsProtein}
                                </div>
                              )}
                              {!v.hgvsCoding && !v.hgvsProtein && (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>

                            {/* Consequence */}
                            <td className="py-3 px-3 align-top">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                                {v.consequence}
                              </span>
                            </td>

                            {/* ClinVar Clinical Significance */}
                            <td className="py-3 px-3 align-top">
                              {getSignificanceBadge(v.clinicalSignificance)}
                            </td>

                            {/* Condition */}
                            <td className="py-3 px-3 align-top text-slate-700 text-[11px] max-w-[180px]">
                              <span className="line-clamp-2" title={v.condition || 'Not specified'}>
                                {v.condition || 'Not specified'}
                              </span>
                            </td>

                            {/* Review Status */}
                            <td className="py-3 px-3 align-top">
                              {renderReviewStars(v.reviewStars, v.reviewStatus)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  !clinvarError && (
                    <p className="text-xs text-slate-500 font-mono italic bg-slate-50 p-4 rounded border border-slate-200">
                      No ClinVar variant records available for this gene.
                    </p>
                  )
                )}
              </div>

              {/* Protein Information Section */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Dna className="w-4 h-4 text-cyan-700" />
                      <span>Protein Information</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Canonical protein product, sequence metadata, and domain annotations retrieved live from UniProt REST API.
                    </p>
                  </div>

                  {proteinData && proteinData.accession && (
                    <a
                      href={proteinData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-mono font-semibold hover:bg-cyan-100 transition-colors self-start sm:self-auto"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-600" />
                      <span>UniProt: {proteinData.accession}</span>
                    </a>
                  )}
                </div>

                {/* Decoupled UniProt Error Banner */}
                {proteinError && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-4 text-xs font-mono text-amber-800 flex items-center justify-between gap-4">
                    <span>UniProt protein data is temporarily unavailable.</span>
                    <button
                      onClick={() => fetchGeneData(query)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold shrink-0 transition-colors shadow-2xs"
                    >
                      Retry UniProt Fetch
                    </button>
                  </div>
                )}

                {/* Protein Content Display */}
                {proteinData ? (
                  <div className="space-y-4">

                    {/* Protein Header Overview */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded border border-slate-200">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-lg font-bold font-mono text-slate-900">
                            {proteinData.proteinName}
                          </h4>
                          {proteinData.isReviewed && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Swiss-Prot (Reviewed)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-mono">
                          Canonical Accession: <span className="font-bold text-slate-900">{proteinData.accession}</span>
                        </p>
                      </div>

                      {/* Protein Stats Badges */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="bg-white px-3 py-1.5 rounded border border-slate-200">
                          <span className="text-[10px] font-mono text-slate-500 uppercase block">Sequence Length</span>
                          <span className="text-xs font-bold font-mono text-slate-900">
                            {proteinData.sequenceLength ? `${proteinData.sequenceLength.toLocaleString()} aa` : 'N/A'}
                          </span>
                        </div>

                        <div className="bg-white px-3 py-1.5 rounded border border-slate-200">
                          <span className="text-[10px] font-mono text-slate-500 uppercase block">Isoforms</span>
                          <span className="text-xs font-bold font-mono text-cyan-800">
                            {proteinData.isoformsCount || 1} Reported
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Function Description */}
                    {proteinData.functionSummary && (
                      <div className="bg-slate-50 p-4 rounded border border-slate-200">
                        <span className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1 mb-1">
                          <FileText className="w-3.5 h-3.5 text-cyan-700" />
                          <span>Functional Annotation</span>
                        </span>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {proteinData.functionSummary}
                        </p>
                      </div>
                    )}

                    {/* Domain Annotations Table */}
                    <div>
                      <h4 className="text-xs font-mono uppercase text-slate-500 font-bold mb-2 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-cyan-700" />
                        <span>Domain Annotations ({proteinData.domains?.length || 0})</span>
                      </h4>

                      {proteinData.domains && proteinData.domains.length > 0 ? (
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left text-xs font-sans border-collapse min-w-[500px]">
                            <thead>
                              <tr className="bg-slate-900 text-slate-200 font-mono text-[11px] uppercase tracking-wider">
                                <th className="py-2.5 px-3">Domain / Region Name</th>
                                <th className="py-2.5 px-3 text-right">Start Pos</th>
                                <th className="py-2.5 px-3 text-right">End Pos</th>
                                <th className="py-2.5 px-3">Annotation Type</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {proteinData.domains.map((d, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-2 px-3 font-semibold text-slate-900 font-mono">
                                    {d.name}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-medium text-slate-700">
                                    {d.start ?? 'N/A'}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-medium text-slate-700">
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
                      ) : (
                        <p className="text-xs text-slate-500 font-mono italic bg-slate-50 p-4 rounded border border-slate-200">
                          No specific domain annotations cataloged for this protein entry.
                        </p>
                      )}
                    </div>

                  </div>
                ) : (
                  !proteinError && (
                    <p className="text-xs text-slate-500 font-mono italic bg-slate-50 p-4 rounded border border-slate-200">
                      Protein information unavailable
                    </p>
                  )
                )}
              </div>

              {/* Structural Information Section */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Box className="w-4 h-4 text-cyan-700" />
                    <span>Structural Information</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    3D molecular structure records from RCSB Protein Data Bank (PDB) and AlphaFold Structure Database.
                  </p>
                </div>

                {/* Subsection 1: Experimental Structures — RCSB PDB */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                        <span>Experimental Structures — RCSB PDB</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          Experimentally Determined
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Empirical structures solved via X-ray crystallography, NMR, or Cryo-EM. Note: A PDB entry may represent only a domain, fragment, or complex.
                      </p>
                    </div>

                    {structuresData?.pdb?.structures && structuresData.pdb.structures.length > 0 && (
                      <span className="text-xs font-mono bg-blue-50 text-blue-800 px-2.5 py-1 rounded border border-blue-200 font-semibold shrink-0">
                        {structuresData.pdb.structures.length} PDB Entries
                      </span>
                    )}
                  </div>

                  {structuresData?.pdb?.error && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs font-mono text-amber-800">
                      {structuresData.pdb.error}
                    </div>
                  )}

                  {structuresData?.pdb?.structures && structuresData.pdb.structures.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-80 overflow-y-auto">
                      <table className="w-full text-left text-xs font-sans border-collapse min-w-[600px]">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-slate-900 text-slate-200 font-mono text-[11px] uppercase tracking-wider">
                            <th className="py-2.5 px-3">PDB ID</th>
                            <th className="py-2.5 px-3">Method</th>
                            <th className="py-2.5 px-3">Resolution</th>
                            <th className="py-2.5 px-3">Coverage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {structuresData.pdb.structures.map((s, idx) => (
                            <tr key={s.pdbId || idx} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2 px-3 font-mono font-bold">
                                <a
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-700 hover:text-cyan-900 hover:underline inline-flex items-center gap-1"
                                >
                                  <span>{s.pdbId}</span>
                                  <ExternalLink className="w-3 h-3 text-cyan-600" />
                                </a>
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-700">
                                {s.method}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-700">
                                {s.resolution}
                              </td>
                              <td className="py-2 px-3 font-mono text-xs text-slate-600">
                                {s.coverage}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    !structuresData?.pdb?.error && (
                      <p className="text-xs text-slate-500 font-mono italic bg-slate-50 p-4 rounded border border-slate-200">
                        No experimental PDB structures were found for this protein.
                      </p>
                    )
                  )}
                </div>

                <hr className="border-slate-100" />

                {/* Subsection 2: Predicted Structure — AlphaFold */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                      <span>Predicted Structure — AlphaFold</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        Computationally Predicted Structure
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      3D model predicted computationally by AlphaFold. Not experimentally determined.
                    </p>
                  </div>

                  {structuresData?.alphafold?.error && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs font-mono text-amber-800">
                      {structuresData.alphafold.error}
                    </div>
                  )}

                  {structuresData?.alphafold?.modelAvailable && structuresData.alphafold.alphafold ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-900">
                              Model Identifier: {structuresData.alphafold.alphafold.entryId}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-purple-50 text-purple-800 border border-purple-200">
                              AlphaFold DB
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 font-mono">
                            UniProt Accession: <span className="font-bold text-slate-900">{structuresData.alphafold.alphafold.uniprotAccession}</span>
                          </p>
                        </div>

                        <a
                          href={structuresData.alphafold.alphafold.entryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-mono font-semibold transition-colors self-start sm:self-auto"
                        >
                          <span>View Official AlphaFold Model</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                        <div className="bg-white p-3 rounded border border-slate-200">
                          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                            Model Availability
                          </span>
                          <span className="text-xs font-bold font-mono text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Available</span>
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded border border-slate-200">
                          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                            Confidence (pLDDT)
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-900 block">
                            {structuresData.alphafold.alphafold.globalPlddt !== null ? `${structuresData.alphafold.alphafold.globalPlddt}` : 'N/A'}
                            <span className="text-[11px] font-normal text-slate-500 ml-1">
                              ({structuresData.alphafold.alphafold.confidenceCategory})
                            </span>
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded border border-slate-200">
                          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                            Model Coverage
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-900 block">
                            {structuresData.alphafold.alphafold.coverage}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    !structuresData?.alphafold?.error && (
                      <p className="text-xs text-slate-500 font-mono italic bg-slate-50 p-4 rounded border border-slate-200">
                        No AlphaFold model is available for this protein.
                      </p>
                    )
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      ) : (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-2xs">
          <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Enter a Gene Symbol</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Search for cancer gene symbols such as <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-cyan-800">BRCA1</code>, <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-cyan-800">TP53</code>, <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-cyan-800">BRCA2</code>, <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-cyan-800">KRAS</code>, <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-cyan-800">EGFR</code>.
          </p>
        </div>
      )}

    </div>
  );
}



