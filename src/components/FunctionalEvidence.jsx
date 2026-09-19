import React from 'react';
import { Cpu, AlertCircle, Info } from 'lucide-react';

export default function FunctionalEvidence({ functionalData }) {
  const predictors = [
    { name: 'SIFT', key: 'sift', defaultSource: 'SIFT 6.2.1' },
    { name: 'PolyPhen-2', key: 'polyphen', defaultSource: 'PolyPhen-2 v2.2.2' },
    { name: 'CADD', key: 'cadd', defaultSource: 'CADD v1.6' },
    { name: 'AlphaMissense', key: 'alphaMissense', defaultSource: 'AlphaMissense (2023)' }
  ];

  const getResultBadge = (result) => {
    if (!result || result.toLowerCase().includes('unavailable') || result.toLowerCase().includes('not available')) {
      return (
        <span className="text-slate-400 font-mono text-xs italic">
          Unavailable
        </span>
      );
    }

    const res = result.toLowerCase();
    if (res.includes('deleterious') || res.includes('damaging') || res.includes('pathogenic')) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          {result}
        </span>
      );
    }

    if (res.includes('tolerated') || res.includes('benign')) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          {result}
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {result}
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
        <Cpu className="w-4 h-4 text-cyan-700" />
        <span>Functional Prediction Evidence</span>
      </h2>

      {/* Table */}
      <div className="overflow-x-auto mb-4 border border-slate-200 rounded-md">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">Predictor</th>
              <th className="py-2.5 px-3">Prediction Result</th>
              <th className="py-2.5 px-3">Numerical Score</th>
              <th className="py-2.5 px-3">Data Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {predictors.map((p) => {
              const item = functionalData?.[p.key];
              const resultStr = item?.result || `${p.name} data unavailable`;
              const scoreStr = item?.score !== null && item?.score !== undefined ? item.score : 'N/A';
              const sourceStr = item?.source || p.defaultSource;

              return (
                <tr key={p.key} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900 font-sans">{p.name}</td>
                  <td className="py-3 px-3">{getResultBadge(resultStr)}</td>
                  <td className="py-3 px-3 text-slate-700 font-semibold">{scoreStr}</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px] font-sans">{sourceStr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Scientific Disclaimer Note */}
      <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
        <p>
          <strong>Scientific Rule:</strong> Computational predictions provide supporting evidence about possible molecular functional effects and should not be treated as clinical diagnoses or confused with ClinVar clinical classification.
        </p>
      </div>
    </div>
  );
}
