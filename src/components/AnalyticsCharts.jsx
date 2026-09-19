import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import {
  BarChart2,
  Activity,
  Layers,
  Info,
  Filter,
  Download,
  Database,
  Dna,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

const CLINVAR_COLORS = {
  'Pathogenic': '#dc2626',
  'Likely pathogenic': '#ea580c',
  'Uncertain significance': '#d97706',
  'Benign': '#16a34a',
  'Likely benign': '#059669',
  'Conflicting interpretations': '#9333ea',
  'Other / Unknown': '#64748b'
};

const CONSEQUENCE_COLORS = [
  '#0284c7', '#0891b2', '#0d9488', '#059669', '#d97706', '#dc2626', '#7c3aed', '#64748b'
];

export default function AnalyticsCharts({ analyticsData, symbol = 'TP53' }) {
  if (!analyticsData || !analyticsData.records) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 shadow-2xs">
        <Info className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        <p className="font-semibold text-slate-700">No analytics data available for {symbol}</p>
        <p className="text-xs text-slate-500 mt-1">Please try searching another gene symbol.</p>
      </div>
    );
  }

  const {
    totalAvailable = 0,
    recordsAnalyzed = 0,
    source = 'NCBI ClinVar / dbSNP',
    proteinLength = 0,
    proteinDomains = [],
    records = []
  } = analyticsData;

  // Client-side Filter States
  const [selectedSignificance, setSelectedSignificance] = useState([]);
  const [selectedClass, setSelectedClass] = useState([]);
  const [selectedConsequence, setSelectedConsequence] = useState([]);

  // Extract unique filter options from retrieved records
  const availableSignificances = useMemo(() => {
    const set = new Set();
    records.forEach(r => {
      if (r.clinVarSignificance) set.add(r.clinVarSignificance);
      else set.add('Other / Unknown');
    });
    return Array.from(set).sort();
  }, [records]);

  const availableClasses = useMemo(() => {
    const set = new Set();
    records.forEach(r => {
      if (r.variantClass) set.add(r.variantClass);
      else set.add('Unavailable');
    });
    return Array.from(set).sort();
  }, [records]);

  const availableConsequences = useMemo(() => {
    const set = new Set();
    records.forEach(r => {
      if (r.consequence) set.add(r.consequence);
      else set.add('Unavailable');
    });
    return Array.from(set).sort();
  }, [records]);

  // Apply filters to records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const sig = r.clinVarSignificance || 'Other / Unknown';
      const cls = r.variantClass || 'Unavailable';
      const csq = r.consequence || 'Unavailable';

      if (selectedSignificance.length > 0 && !selectedSignificance.includes(sig)) return false;
      if (selectedClass.length > 0 && !selectedClass.includes(cls)) return false;
      if (selectedConsequence.length > 0 && !selectedConsequence.includes(csq)) return false;

      return true;
    });
  }, [records, selectedSignificance, selectedClass, selectedConsequence]);

  // Dynamic Summary Metrics
  const summaryMetrics = useMemo(() => {
    const uniqueRsids = new Set(filteredRecords.map(r => r.rsId || r.title).filter(Boolean));
    
    // ClinVar distribution
    const sigMap = {};
    // Consequence distribution
    const csqMap = {};
    // Class distribution
    const classMap = {};
    // Protein positions aggregation
    const protMap = {};
    // Genomic positions aggregation
    const genomicMap = {};

    filteredRecords.forEach(r => {
      const sig = r.clinVarSignificance || 'Other / Unknown';
      sigMap[sig] = (sigMap[sig] || 0) + 1;

      const csq = r.consequence || 'Unavailable';
      csqMap[csq] = (csqMap[csq] || 0) + 1;

      const cls = r.variantClass || 'Unavailable';
      classMap[cls] = (classMap[cls] || 0) + 1;

      if (r.proteinPosition && r.proteinPosition > 0) {
        const key = r.proteinPosition;
        if (!protMap[key]) {
          protMap[key] = {
            position: key,
            count: 0,
            labels: new Set(),
            consequences: new Set(),
            significances: new Set(),
            rsIds: new Set()
          };
        }
        protMap[key].count += 1;
        if (r.proteinHgvs) protMap[key].labels.add(r.proteinHgvs);
        if (r.consequence) protMap[key].consequences.add(r.consequence);
        if (r.clinVarSignificance) protMap[key].significances.add(r.clinVarSignificance);
        if (r.rsId) protMap[key].rsIds.add(r.rsId);
      }

      if (r.genomicPosition && r.genomicPosition > 0) {
        const key = r.genomicPosition;
        if (!genomicMap[key]) {
          genomicMap[key] = {
            position: key,
            count: 0,
            chr: r.chromosome || 'Chr',
            rsIds: new Set(),
            alleles: new Set(),
            hgvs: new Set()
          };
        }
        genomicMap[key].count += 1;
        if (r.rsId) genomicMap[key].rsIds.add(r.rsId);
        if (r.ref && r.alt) genomicMap[key].alleles.add(`${r.ref}>${r.alt}`);
        if (r.genomicHgvs) genomicMap[key].hgvs.add(r.genomicHgvs);
      }
    });

    const clinicalDistribution = Object.entries(sigMap).map(([classification, count]) => ({
      classification,
      count,
      color: CLINVAR_COLORS[classification] || '#64748b'
    })).sort((a, b) => b.count - a.count);

    const consequenceDistribution = Object.entries(csqMap).map(([type, count]) => ({
      type,
      count
    })).sort((a, b) => b.count - a.count);

    const variantClassDistribution = Object.entries(classMap).map(([type, count]) => ({
      type,
      count
    })).sort((a, b) => b.count - a.count);

    const proteinPositionLandscape = Object.values(protMap).map(d => ({
      position: d.position,
      count: d.count,
      label: Array.from(d.labels).join(', ') || `Residue ${d.position}`,
      consequence: Array.from(d.consequences).join(', ') || 'Unknown',
      significance: Array.from(d.significances).join(', ') || 'Unknown',
      rsId: Array.from(d.rsIds).join(', ') || 'N/A'
    })).sort((a, b) => a.position - b.position);

    const genomicPositionLandscape = Object.values(genomicMap).map(d => ({
      position: d.position,
      count: d.count,
      chr: d.chr,
      rsId: Array.from(d.rsIds).join(', ') || 'N/A',
      alleles: Array.from(d.alleles).join(', ') || 'N/A',
      hgvs: Array.from(d.hgvs).join(', ') || ''
    })).sort((a, b) => a.position - b.position);

    return {
      filteredCount: filteredRecords.length,
      uniqueVariantsCount: uniqueRsids.size,
      clinicalDistribution,
      consequenceDistribution,
      variantClassDistribution,
      proteinPositionLandscape,
      genomicPositionLandscape
    };
  }, [filteredRecords]);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedSignificance([]);
    setSelectedClass([]);
    setSelectedConsequence([]);
  };

  // Toggle filter selections
  const toggleFilter = (setFn, currentList, value) => {
    if (currentList.includes(value)) {
      setFn(currentList.filter(item => item !== value));
    } else {
      setFn([...currentList, value]);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;

    const headers = [
      'rsID', 'Gene', 'Chromosome', 'Position', 'Ref', 'Alt',
      'Genomic_HGVS', 'Coding_HGVS', 'Protein_HGVS',
      'Consequence', 'ClinVar_Significance', 'Condition', 'Review_Status'
    ];

    const rows = filteredRecords.map(r => [
      `"${r.rsId || ''}"`,
      `"${r.gene || symbol}"`,
      `"${r.chromosome || ''}"`,
      `"${r.genomicPosition || ''}"`,
      `"${r.ref || ''}"`,
      `"${r.alt || ''}"`,
      `"${r.genomicHgvs || ''}"`,
      `"${r.codingHgvs || ''}"`,
      `"${r.proteinHgvs || ''}"`,
      `"${r.consequence || ''}"`,
      `"${r.clinVarSignificance || ''}"`,
      `"${(r.conditions || []).join('; ')}"`,
      `"${r.reviewStatus || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${symbol}_variant_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters = selectedSignificance.length > 0 || selectedClass.length > 0 || selectedConsequence.length > 0;

  return (
    <div className="space-y-6">

      {/* Transparency & Source Disclosure Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-4 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>Data Source & Transparency Notice</span>
          </div>
          <p className="text-xs text-slate-300">
            Source: <strong className="text-white">{source}</strong>
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1 font-mono">
            <span>ClinVar total records found: <strong className="text-cyan-300">{totalAvailable.toLocaleString()}</strong></span>
            <span>•</span>
            <span>Retrieved dataset size: <strong className="text-cyan-300">{recordsAnalyzed.toLocaleString()}</strong></span>
            <span>•</span>
            <span>Currently in view: <strong className="text-emerald-400">{summaryMetrics.filteredCount.toLocaleString()}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Export filtered records as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-lg flex items-center gap-2">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Scientific Notice:</strong> Charts reflect the currently loaded records ({recordsAnalyzed} analyzed out of {totalAvailable.toLocaleString()} total cataloged in ClinVar). This is descriptive analytics of retrieved evidence. No pathogenicity scores or predictive risk algorithms are applied.
        </span>
      </div>

      {/* Interactive Filtering Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 font-mono">
            <SlidersHorizontal className="w-4 h-4 text-cyan-700" />
            <span>Filter Retrieved Records ({summaryMetrics.filteredCount} / {recordsAnalyzed})</span>
          </h3>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Clinical Significance Filter */}
          <div>
            <span className="font-semibold text-slate-700 block mb-1">Clinical Significance:</span>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
              {availableSignificances.map(sig => {
                const active = selectedSignificance.includes(sig);
                return (
                  <button
                    key={sig}
                    onClick={() => toggleFilter(setSelectedSignificance, selectedSignificance, sig)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                      active
                        ? 'bg-cyan-700 text-white border-cyan-800 font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sig}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Variant Class Filter */}
          <div>
            <span className="font-semibold text-slate-700 block mb-1">Variant Class:</span>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
              {availableClasses.map(cls => {
                const active = selectedClass.includes(cls);
                return (
                  <button
                    key={cls}
                    onClick={() => toggleFilter(setSelectedClass, selectedClass, cls)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                      active
                        ? 'bg-cyan-700 text-white border-cyan-800 font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cls}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Molecular Consequence Filter */}
          <div>
            <span className="font-semibold text-slate-700 block mb-1">Molecular Consequence:</span>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
              {availableConsequences.map(csq => {
                const active = selectedConsequence.includes(csq);
                return (
                  <button
                    key={csq}
                    onClick={() => toggleFilter(setSelectedConsequence, selectedConsequence, csq)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                      active
                        ? 'bg-cyan-700 text-white border-cyan-800 font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {csq}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3 text-center shadow-2xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Total ClinVar Found</span>
          <span className="text-lg font-bold font-mono text-slate-900">{totalAvailable.toLocaleString()}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3 text-center shadow-2xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Records Analyzed</span>
          <span className="text-lg font-bold font-mono text-cyan-800">{summaryMetrics.filteredCount.toLocaleString()}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3 text-center shadow-2xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Unique rsIDs</span>
          <span className="text-lg font-bold font-mono text-emerald-800">{summaryMetrics.uniqueVariantsCount.toLocaleString()}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3 text-center shadow-2xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Variant Classes</span>
          <span className="text-lg font-bold font-mono text-amber-800">{summaryMetrics.variantClassDistribution.length}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3 text-center shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">ClinVar Categories</span>
          <span className="text-lg font-bold font-mono text-purple-800">{summaryMetrics.clinicalDistribution.length}</span>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. ClinVar Significance Distribution Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-700" />
              <span>ClinVar Clinical Significance Distribution</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
              ClinVar classification distribution among retrieved records
            </p>
          </div>
          {summaryMetrics.clinicalDistribution.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={summaryMetrics.clinicalDistribution} margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis dataKey="classification" type="category" tick={{ fontSize: 10, fill: '#334155' }} width={140} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '6px', fontSize: '12px' }}
                    formatter={(val) => [`${val} variants`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {summaryMetrics.clinicalDistribution.map((entry, index) => (
                      <Cell key={`cell-clin-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-mono">
              No clinical significance data available
            </div>
          )}
        </div>

        {/* 2. Molecular Consequence Distribution */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Dna className="w-4 h-4 text-cyan-700" />
              <span>Molecular Consequence Distribution</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
              Functional consequence annotations from retrieved annotations
            </p>
          </div>
          {summaryMetrics.consequenceDistribution.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryMetrics.consequenceDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="type" tick={{ fontSize: 10, fill: '#475569' }} interval={0} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '6px', fontSize: '12px' }}
                    formatter={(val) => [`${val} variants`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]}>
                    {summaryMetrics.consequenceDistribution.map((entry, index) => (
                      <Cell key={`cell-csq-${index}`} fill={CONSEQUENCE_COLORS[index % CONSEQUENCE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-mono">
              Consequence data unavailable for retrieved records
            </div>
          )}
        </div>

        {/* 3. Variant Class Distribution */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm lg:col-span-2">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-700" />
              <span>Variant Class Distribution</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
              NCBI dbSNP / ClinVar structural classification distribution
            </p>
          </div>
          {summaryMetrics.variantClassDistribution.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryMetrics.variantClassDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '6px', fontSize: '12px' }}
                    formatter={(val) => [`${val} variants`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#0e7490" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400 font-mono">
              Variant class data unavailable for retrieved records
            </div>
          )}
        </div>

      </div>

      {/* 4. Protein Variant Landscape */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-700" />
            <span>Protein Variant Landscape ({symbol})</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
            {proteinLength ? `Protein coordinate axis (1 to ${proteinLength} AA)` : 'Protein position scatter distribution'}
          </p>
        </div>

        {summaryMetrics.proteinPositionLandscape.length > 0 ? (
          <div className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="position"
                    type="number"
                    name="Residue Position"
                    domain={[1, proteinLength || 'auto']}
                    unit=" AA"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis dataKey="count" type="number" name="Variants" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <ZAxis dataKey="count" range={[60, 300]} name="Count" />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-2.5 rounded shadow-md border border-slate-700 font-mono space-y-1">
                            <div className="font-bold text-cyan-400">{d.rsId} (Position {d.position})</div>
                            <div>Protein HGVS: <span className="text-slate-200">{d.label}</span></div>
                            <div>Consequence: <span className="text-amber-300">{d.consequence}</span></div>
                            <div>ClinVar: <span className="text-emerald-300">{d.significance}</span></div>
                            <div className="text-cyan-300 font-bold mt-1">{d.count} retrieved variant record(s) at position</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter data={summaryMetrics.proteinPositionLandscape} fill="#0284c7" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* UniProt Protein Domains Visualization Sub-layer */}
            {proteinDomains && proteinDomains.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-2">
                <span className="text-xs font-mono font-bold text-slate-700 block uppercase tracking-wider">
                  UniProt Domain Regions (1 — {proteinLength || '?'} AA):
                </span>
                <div className="relative w-full h-8 bg-slate-200 rounded border border-slate-300 overflow-hidden flex items-center">
                  {proteinDomains.map((dom, i) => {
                    if (!proteinLength) return null;
                    const leftPct = (dom.start / proteinLength) * 100;
                    const widthPct = Math.max(((dom.end - dom.start + 1) / proteinLength) * 100, 2);
                    return (
                      <div
                        key={i}
                        className="absolute h-6 rounded bg-cyan-700 border border-cyan-800 text-[10px] text-white font-mono flex items-center justify-center px-1 truncate shadow-2xs"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        title={`${dom.name} (${dom.start}-${dom.end})`}
                      >
                        {dom.name} ({dom.start}-{dom.end})
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">
            Protein position coordinates unavailable for retrieved records
          </div>
        )}
      </div>

      {/* 5. Genomic Variant Landscape */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Dna className="w-4 h-4 text-cyan-700" />
            <span>Genomic Variant Landscape</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
            GRCh38 chromosome interval mapping of retrieved variants
          </p>
        </div>

        {summaryMetrics.genomicPositionLandscape.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="position"
                  type="number"
                  name="Genomic Position"
                  domain={['dataMin', 'dataMax']}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => val.toLocaleString()}
                />
                <YAxis dataKey="count" type="number" name="Variants" tick={{ fontSize: 11 }} allowDecimals={false} />
                <ZAxis dataKey="count" range={[60, 300]} name="Count" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2.5 rounded shadow-md border border-slate-700 font-mono space-y-1">
                          <div className="font-bold text-cyan-400">{d.rsId}</div>
                          <div>Chr {d.chr} : Pos {d.position.toLocaleString()}</div>
                          <div>Alleles: <span className="text-amber-300">{d.alleles}</span></div>
                          {d.hgvs && <div>Genomic HGVS: <span className="text-slate-300">{d.hgvs}</span></div>}
                          <div className="text-cyan-300 font-bold mt-1">{d.count} variant record(s) at position</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={summaryMetrics.genomicPositionLandscape} fill="#0d9488" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">
            Genomic position coordinates unavailable for retrieved records
          </div>
        )}
      </div>

    </div>
  );
}
