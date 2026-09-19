import React from 'react';
import { Activity, ArrowRight, Dna } from 'lucide-react';

export default function ConsequenceCard({ consequenceData, referenceData, variantData }) {
  if (!consequenceData) return null;

  const { type, position, referenceAA, alternateAA, codonChange, impact } = consequenceData;
  const transcript = referenceData?.transcript || 'NM_000546.6';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-700" />
          <span>Molecular Consequence</span>
        </div>
        {impact && (
          <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            Impact: {impact}
          </span>
        )}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column: Overview */}
        <div className="space-y-2">
          <div className="flex justify-between py-1.5 border-b border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Variant Class:</span>
            <span className="font-mono font-semibold text-slate-900">{variantData?.variant?.type || 'SNV'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Consequence Type:</span>
            <span className="font-mono font-semibold text-slate-900">{type || 'Missense'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Transcript Reference:</span>
            <span className="font-mono font-semibold text-slate-900">{transcript}</span>
          </div>
          <div className="flex justify-between py-1.5 text-xs">
            <span className="text-slate-500 font-medium">Protein Residue Position:</span>
            <span className="font-mono font-semibold text-cyan-800">{position || 175}</span>
          </div>
        </div>

        {/* Right column: Amino acid substitution visual */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex flex-col justify-center items-center text-center">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Amino Acid Substitution
          </span>

          <div className="flex items-center gap-3 my-1">
            <div className="bg-white border border-slate-300 px-3 py-1.5 rounded shadow-xs text-center">
              <span className="font-mono font-bold text-sm text-slate-900 block">{referenceAA || 'Ref'}</span>
              <span className="text-[10px] text-slate-400 block font-mono">Reference</span>
            </div>

            <ArrowRight className="w-5 h-5 text-cyan-700" />

            <div className="bg-amber-50 border border-amber-300 px-3 py-1.5 rounded shadow-xs text-center">
              <span className="font-mono font-bold text-sm text-amber-900 block">{alternateAA || 'Alt'}</span>
              <span className="text-[10px] text-amber-600 block font-mono">Alternate</span>
            </div>
          </div>

          {codonChange && (
            <div className="mt-2 text-xs font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
              Codon Change: <span className="font-semibold text-slate-800">{codonChange}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
