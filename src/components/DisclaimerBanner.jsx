import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <footer className="mt-12 bg-slate-900 text-slate-300 border-t border-slate-800 py-8 px-4 text-xs font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div className="flex items-start gap-3 max-w-4xl">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white block mb-0.5 uppercase tracking-wider font-mono text-[11px]">
              Scientific Research & Educational Use Disclaimer
            </span>
            <p className="text-slate-400 text-xs leading-relaxed">
              Information presented by the Cancer Genomic Variant Explorer (CGVE) is aggregated strictly from authoritative public bioinformatics resources (NCBI, ClinVar, UniProt, RCSB PDB, AlphaFold DB) for research and educational purposes. This application does not diagnose patients or independently determine clinical pathogenicity.
            </p>
          </div>
        </div>

        <div className="text-right text-[11px] text-slate-500 font-mono whitespace-nowrap">
          <div>CGVE Platform • Open Science</div>
          <div>No Paid Server Dependencies</div>
        </div>

      </div>
    </footer>
  );
}
