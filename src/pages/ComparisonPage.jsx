import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import VariantComparison from '../components/VariantComparison';
import { GitCompare, Loader2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { detectInputType } from '../utils/inputDetection';

export default function ComparisonPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialA = searchParams.get('varA') || searchParams.get('variantA') || 'rs28934578';
  const initialB = searchParams.get('varB') || searchParams.get('variantB') || 'rs121913343';

  const [inputA, setInputA] = useState(initialA);
  const [inputB, setInputB] = useState(initialB);

  const [loading, setLoading] = useState(true);
  const [compareData, setCompareData] = useState(null);
  const [error, setError] = useState(null);

  const executeCompare = async (a, b) => {
    if (!a.trim() || !b.trim()) return;
    setLoading(true);
    setError(null);

    try {
      console.log(`[ComparisonPage] Comparing variants: "${a}" vs "${b}"`);
      const res = await fetch(`/api/compare?varA=${encodeURIComponent(a.trim())}&varB=${encodeURIComponent(b.trim())}`);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`API returned non-JSON response (${res.status}): ${text.slice(0, 100)}`);
      }
      
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setCompareData(data);
    } catch (err) {
      console.error('[ComparisonPage] Fetch Error:', err.message);
      setError(err.message || 'Error executing variant comparison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeCompare(initialA, initialB);
  }, [initialA, initialB]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputA.trim() && inputB.trim()) {
      setSearchParams({ varA: inputA.trim(), varB: inputB.trim() });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Inputs Form */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h1 className="text-xl font-bold text-slate-900 font-sans flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-cyan-700" />
              <span>Variant Evidence Comparison</span>
            </h1>
            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 w-fit">
              Analytical Comparison — No Arbitrary Scoring
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Independently retrieves and compares multi-omic evidence profiles for two genomic variants across NCBI, ClinVar, UniProt, RCSB PDB, AlphaFold DB, and Ensembl VEP.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Variant A Identifier:
            </label>
            <input
              type="text"
              value={inputA}
              onChange={(e) => setInputA(e.target.value)}
              placeholder="e.g. rs28934578"
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-mono focus:outline-none focus:border-cyan-600 shadow-2xs"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Variant B Identifier:
            </label>
            <input
              type="text"
              value={inputB}
              onChange={(e) => setInputB(e.target.value)}
              placeholder="e.g. rs121913343"
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-mono focus:outline-none focus:border-cyan-600 shadow-2xs"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Comparing...</span>
                </>
              ) : (
                <>
                  <span>Compare Variants</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-lg p-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-cyan-700 animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold font-mono text-slate-800">
              Retrieving Evidence for Variant A ({inputA}) & Variant B ({inputB})...
            </p>
            <p className="text-xs text-slate-500 font-sans">
              Querying NCBI dbSNP, ClinVar, UniProt, RCSB PDB, AlphaFold DB, and Ensembl VEP in parallel.
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center text-rose-900 text-xs font-mono space-y-3">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
          <p className="font-bold">Error comparing variants: {error}</p>
          <button
            onClick={() => executeCompare(inputA, inputB)}
            className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded font-semibold transition-colors shadow-2xs"
          >
            Retry Comparison
          </button>
        </div>
      )}

      {/* Main Result Component */}
      {!loading && !error && compareData && (
        <VariantComparison payloadA={compareData.variantA} payloadB={compareData.variantB} comparison={compareData.comparison} />
      )}

    </div>
  );
}
