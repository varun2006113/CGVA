import React, { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';

export default function HGVSPanel({ hgvsData, referenceData }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const hgvsItems = [
    {
      key: 'genomic',
      label: 'Genomic HGVS',
      value: hgvsData?.genomic || 'NC_000017.11:g.7675088C>T',
      accession: referenceData?.genomic || 'NC_000017.11'
    },
    {
      key: 'coding',
      label: 'Coding HGVS',
      value: hgvsData?.coding || 'NM_000546.6:c.524G>A',
      accession: referenceData?.transcript || 'NM_000546.6'
    },
    {
      key: 'protein',
      label: 'Protein HGVS',
      value: hgvsData?.protein || 'NP_000537.3:p.Arg175His',
      accession: referenceData?.protein || 'NP_000537.3'
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4 text-cyan-700" />
        <span>HGVS Nomenclature</span>
      </h2>

      <div className="space-y-3">
        {hgvsItems.map((item) => (
          <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 border border-slate-200/80 rounded-md p-3 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {item.label}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                  Ref: {item.accession}
                </span>
              </div>
              <div className="font-mono text-sm font-semibold text-slate-900 mt-1 select-all">
                {item.value}
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(item.value, item.key)}
              className="self-start sm:self-center flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors shadow-xs"
              title="Copy HGVS to clipboard"
            >
              {copiedKey === item.key ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
