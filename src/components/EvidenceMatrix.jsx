import React from 'react';
import { ShieldCheck, ExternalLink, CheckCircle2, Layers, Box, Cpu, AlertCircle } from 'lucide-react';

export default function EvidenceMatrix({ variantData }) {
  if (!variantData) return null;

  const { clinical, functional, protein, structure, sources = [] } = variantData;

  const evidenceItems = [
    {
      category: 'Clinical Significance',
      source: 'NCBI ClinVar',
      status: clinical?.classification ? 'Available' : 'Unavailable',
      value: clinical?.classification || 'Reported',
      url: clinical?.clinvarUrl || 'https://www.ncbi.nlm.nih.gov/clinvar/',
      icon: ShieldCheck
    },
    {
      category: 'Computational Predictor',
      source: 'AlphaMissense',
      status: functional?.alphaMissense?.result && !functional?.alphaMissense?.result.includes('unavailable') ? 'Available' : 'Unavailable',
      value: functional?.alphaMissense?.result || 'Unavailable',
      url: 'https://alphafold.ebi.ac.uk/alphamissense',
      icon: Cpu
    },
    {
      category: 'Computational Predictor',
      source: 'CADD',
      status: functional?.cadd?.result && !functional?.cadd?.result.includes('unavailable') ? 'Available' : 'Unavailable',
      value: functional?.cadd?.result || 'Unavailable',
      url: 'https://cadd.gs.washington.edu/',
      icon: Cpu
    },
    {
      category: 'Protein Features',
      source: 'UniProt KB',
      status: protein?.uniprotId ? 'Available' : 'Unavailable',
      value: protein?.uniprotId ? `Accession ${protein.uniprotId}` : 'Unavailable',
      url: protein?.uniprotId ? `https://www.uniprot.org/uniprotkb/${protein.uniprotId}` : 'https://www.uniprot.org/',
      icon: Layers
    },
    {
      category: 'Experimental Structure',
      source: 'RCSB PDB',
      status: structure?.pdb && structure.pdb.length > 0 ? 'Available' : 'Unavailable',
      value: structure?.pdb && structure.pdb.length > 0 ? `${structure.pdb.length} Structure(s)` : 'Unavailable',
      url: 'https://www.rcsb.org/',
      icon: Box
    },
    {
      category: 'Predicted Structure',
      source: 'AlphaFold DB',
      status: structure?.alphafold ? 'Available' : 'Unavailable',
      value: structure?.alphafold ? `AF-${structure.alphafold.uniprotId}-F1` : 'Unavailable',
      url: structure?.alphafold?.uniprotId ? `https://alphafold.ebi.ac.uk/entry/${structure.alphafold.uniprotId}` : 'https://alphafold.ebi.ac.uk/',
      icon: Box
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-cyan-700" />
        <span>Multi-Omic Evidence Matrix</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {evidenceItems.map((item, idx) => {
          const isAvail = item.status === 'Available';
          const IconComp = item.icon;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-md border transition-all flex flex-col justify-between ${isAvail ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/50 border-slate-200/60 opacity-60'}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-medium text-slate-500 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {item.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <IconComp className="w-4 h-4 text-cyan-700 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 font-sans">
                    {item.source}
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-600 truncate">
                  {item.value}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 flex justify-end">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-medium text-cyan-700 hover:text-cyan-900 hover:underline"
                >
                  <span>External Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
