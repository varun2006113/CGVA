import React from 'react';
import { Activity, MapPin } from 'lucide-react';

export default function ProteinMap({ proteinData, consequenceData }) {
  if (!proteinData) return null;

  const totalLength = proteinData.length || 393;
  const domains = proteinData.domains || [];
  const variantPos = consequenceData?.position || 175;
  const refAA = consequenceData?.referenceAA?.split(' ')[0] || 'R';
  const altAA = consequenceData?.alternateAA?.split(' ')[0] || 'H';

  // Calculate percentage along protein backbone
  const getPercentage = (pos) => Math.min(Math.max((pos / totalLength) * 100, 1), 99);
  const variantPct = getPercentage(variantPos);

  const colors = [
    'bg-sky-200 border-sky-400 text-sky-900',
    'bg-emerald-200 border-emerald-400 text-emerald-900',
    'bg-purple-200 border-purple-400 text-purple-900',
    'bg-amber-200 border-amber-400 text-amber-900',
    'bg-indigo-200 border-indigo-400 text-indigo-900'
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-700" />
          <span>Horizontal Protein Map</span>
        </div>
        <span className="text-xs font-mono text-slate-500">
          Scale: 1 to {totalLength} Residues
        </span>
      </h2>

      {/* Map Graphic Container */}
      <div className="py-6 px-4 bg-slate-50 border border-slate-200/80 rounded-md relative overflow-x-auto">
        <div className="min-w-[600px] relative pt-12 pb-14">

          {/* Mutation Pin Overlay */}
          <div
            className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center z-20"
            style={{ left: `${variantPct}%` }}
          >
            <div className="bg-slate-900 text-white font-mono text-xs font-bold px-2 py-1 rounded shadow-md border border-cyan-400 flex items-center gap-1 whitespace-nowrap">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Residue {variantPos}: {refAA}→{altAA}</span>
            </div>
            <div className="w-0.5 h-10 bg-cyan-700 border-l border-dashed border-cyan-400"></div>
            <div className="w-3 h-3 rounded-full bg-cyan-600 border-2 border-white shadow-sm -mt-1"></div>
          </div>

          {/* Central Backbone Line */}
          <div className="w-full h-4 bg-slate-200 rounded-full relative overflow-hidden border border-slate-300 shadow-inner">
            {/* Domain overlays inside backbone */}
            {domains.map((dom, idx) => {
              const startPct = getPercentage(dom.start);
              const endPct = getPercentage(dom.end);
              const widthPct = Math.max(endPct - startPct, 2);
              const color = colors[idx % colors.length];

              return (
                <div
                  key={idx}
                  title={`${dom.name} (${dom.start}-${dom.end})`}
                  className={`absolute top-0 bottom-0 border-x ${color} opacity-85 transition-opacity hover:opacity-100`}
                  style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                />
              );
            })}
          </div>

          {/* Domain Labels below backbone */}
          <div className="w-full relative mt-4 h-12">
            {domains.map((dom, idx) => {
              const startPct = getPercentage(dom.start);
              const endPct = getPercentage(dom.end);
              const centerPct = (startPct + endPct) / 2;

              return (
                <div
                  key={idx}
                  className="absolute transform -translate-x-1/2 text-center"
                  style={{ left: `${centerPct}%`, top: `${(idx % 2) * 20}px` }}
                >
                  <div className="text-[10px] font-mono font-semibold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs whitespace-nowrap">
                    {dom.name} ({dom.start}-{dom.end})
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sequence Tick Marks */}
          <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-6 border-t border-slate-200 pt-1">
            <span>1 AA (N-term)</span>
            <span>{Math.round(totalLength / 2)} AA</span>
            <span>{totalLength} AA (C-term)</span>
          </div>

        </div>
      </div>
    </div>
  );
}
