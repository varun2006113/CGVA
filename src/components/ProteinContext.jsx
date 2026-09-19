import React from 'react';
import { Layers, ExternalLink, Activity, Info } from 'lucide-react';

export default function ProteinContext({ proteinData, consequenceData }) {
  if (!proteinData) return null;

  const { uniprotId, name, length, function: funcText, domains = [] } = proteinData;
  const variantPos = consequenceData?.position || 175;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-700" />
          <span>Protein Context (UniProt)</span>
        </h2>

        {uniprotId && (
          <a
            href={`https://www.uniprot.org/uniprotkb/${uniprotId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-cyan-700 hover:text-cyan-900 hover:underline font-mono"
          >
            <span>UniProt: {uniprotId}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-slate-50 border border-slate-200/80 rounded-md p-3">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
            Protein Name
          </span>
          <span className="text-xs font-semibold text-slate-900 block font-sans">
            {name || 'Cellular tumor antigen p53'}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-md p-3">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
            Sequence Length
          </span>
          <span className="text-sm font-bold text-slate-900 block font-mono">
            {length || 393} Amino Acids
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-md p-3">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
            Variant Residue Position
          </span>
          <span className="text-sm font-bold text-cyan-800 block font-mono">
            Position {variantPos}
          </span>
        </div>
      </div>

      {/* Function Description */}
      {funcText && (
        <div className="mb-4">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
            Biological Function Narrative:
          </span>
          <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200/70 leading-relaxed font-sans">
            {funcText}
          </p>
        </div>
      )}

      {/* Domain Table */}
      {domains && domains.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
            Annotated Protein Domains ({domains.length}):
          </span>
          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-2 px-3">Domain Name</th>
                  <th className="py-2 px-3">Residue Span</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Variant Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {domains.map((dom, idx) => {
                  const isHit = variantPos >= dom.start && variantPos <= dom.end;
                  return (
                    <tr key={idx} className={isHit ? 'bg-cyan-50/70 font-semibold' : 'hover:bg-slate-50'}>
                      <td className="py-2 px-3 font-sans font-medium text-slate-900">{dom.name}</td>
                      <td className="py-2 px-3 text-slate-700">{dom.start} - {dom.end}</td>
                      <td className="py-2 px-3 text-slate-600 font-sans text-[11px]">{dom.description}</td>
                      <td className="py-2 px-3">
                        {isHit ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            ★ Mutation Site
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
