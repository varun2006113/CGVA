import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import AnalyticsCharts from '../components/AnalyticsCharts';
import { detectInputType } from '../utils/inputDetection';
import { BarChart2, Search, Dna, Loader2, AlertCircle, Sparkles } from 'lucide-react';

const EXAMPLE_GENES = ['TP53', 'BRCA1', 'BRCA2', 'KRAS', 'EGFR'];

export default function AnalyticsPage() {
  const { symbol: pathSymbol } = useParams();
  const [searchParams] = useSearchParams();
  const rawQuery = pathSymbol || searchParams.get('query') || '';
  const query = decodeURIComponent(rawQuery).trim().toUpperCase();
  const navigate = useNavigate();

  const [recordLimit, setRecordLimit] = useState(50);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) {
      setAnalyticsData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/analytics?symbol=${encodeURIComponent(query)}&limit=${recordLimit}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Failed to fetch analytics data`);
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (!data || data.found === false || !data.records || data.records.length === 0) {
          setAnalyticsData(null);
          setError(`No analytics data available for gene "${query}"`);
        } else {
          setAnalyticsData(data);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Analytics page fetch error:', err);
        setAnalyticsData(null);
        setError(err.message || 'Error loading gene analytics');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [query, recordLimit]);

  const handleSearch = (newQuery, type) => {
    const clean = newQuery.trim().toUpperCase();
    if (!clean) return;

    const resolvedType = type || detectInputType(clean);

    if (resolvedType === 'GENE' || resolvedType === 'UNKNOWN') {
      navigate(`/analytics/${encodeURIComponent(clean)}`);
    } else {
      navigate(`/variant/${encodeURIComponent(clean)}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      
      {/* Page Title & Subtitle Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <BarChart2 className="w-6 h-6 text-cyan-700" />
              <span>Variant Analytics</span>
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Descriptive analysis of retrieved cancer-associated genomic variant data
            </p>
          </div>

          <SearchBar onSearch={handleSearch} initialQuery={query} className="max-w-xl" />
        </div>

        {/* Gene Selector Examples & Limit Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 font-mono">Analyze gene:</span>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_GENES.map((g) => (
                <button
                  key={g}
                  onClick={() => navigate(`/analytics/${g}`)}
                  className={`px-2.5 py-1 rounded border font-mono text-xs transition-all cursor-pointer ${
                    query === g
                      ? 'bg-cyan-800 text-white border-cyan-900 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  [{g}]
                </button>
              ))}
            </div>
          </div>

          {/* Record Limit Selector */}
          <div className="flex items-center gap-2 font-mono text-slate-600">
            <span>Retrieved records limit:</span>
            <div className="inline-flex rounded-md shadow-2xs border border-slate-200 overflow-hidden">
              {[20, 50, 100].map((limit) => (
                <button
                  key={limit}
                  onClick={() => setRecordLimit(limit)}
                  className={`px-2.5 py-1 text-xs cursor-pointer transition-colors ${
                    recordLimit === limit
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {limit}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-16 text-center shadow-2xs space-y-3">
          <Loader2 className="w-8 h-8 text-cyan-700 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-800 font-mono">
            Retrieving live ClinVar & UniProt records for {query}...
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Querying NCBI E-Utilities for live cataloged variants and mapping UniProt domain coordinates.
          </p>
        </div>
      ) : query ? (
        error || !analyticsData ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-2xs space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No analytics data available</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No live ClinVar variant records could be retrieved for gene symbol <code className="font-mono text-cyan-800 font-bold">{query}</code>.
            </p>
          </div>
        ) : (
          <AnalyticsCharts analyticsData={analyticsData} symbol={query} />
        )
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-16 text-center shadow-2xs space-y-4">
          <Search className="w-12 h-12 text-cyan-700 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-slate-900">Enter a Gene Symbol for Analytics</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Search for cancer gene symbols such as <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-cyan-800 font-bold">TP53</code>, <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-cyan-800 font-bold">BRCA1</code>, <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-cyan-800 font-bold">BRCA2</code>, <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-cyan-800 font-bold">KRAS</code>, or <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-cyan-800 font-bold">EGFR</code> to analyze live retrieved ClinVar distributions and protein landscapes.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
