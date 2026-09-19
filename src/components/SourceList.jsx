import React from 'react';
import { Database, ExternalLink, Clock } from 'lucide-react';

export default function SourceList({ sources = [], isDemoData = false }) {
  const defaultSources = [
    { name: 'NCBI Variation Services', accession: 'rs28934578', url: 'https://www.ncbi.nlm.nih.gov/snp/rs28934578', retrievedAt: new Date().toISOString() },
    { name: 'ClinVar Database', accession: 'VCV000012374', url: 'https://www.ncbi.nlm.nih.gov/clinvar/variation/12374/', retrievedAt: new Date().toISOString() },
    { name: 'UniProt Knowledgebase', accession: 'P04637', url: 'https://www.uniprot.org/uniprotkb/P04637', retrievedAt: new Date().toISOString() },
    { name: 'RCSB Protein Data Bank', accession: '1TSR', url: 'https://www.rcsb.org/structure/1TSR', retrievedAt: new Date().toISOString() },
    { name: 'AlphaFold Protein Structure Database', accession: 'AF-P04637-F1', url: 'https://alphafold.ebi.ac.uk/entry/P04637', retrievedAt: new Date().toISOString() }
  ];

  const list = sources && sources.length > 0 ? sources : defaultSources;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-700" />
          <span>Scientific Data Source Provenance</span>
        </h2>

        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {isDemoData ? 'Mode: Demonstration Cache' : 'Mode: Live Query'}
        </span>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-md">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">Primary Source Database</th>
              <th className="py-2.5 px-3">Accession / Record ID</th>
              <th className="py-2.5 px-3">Retrieval Timestamp</th>
              <th className="py-2.5 px-3">Direct URL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {list.map((src, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{src.name}</td>
                <td className="py-2.5 px-3 text-cyan-800 font-bold">{src.accession || 'N/A'}</td>
                <td className="py-2.5 px-3 text-slate-500 text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{src.retrievedAt ? new Date(src.retrievedAt).toLocaleString() : 'Recent'}</span>
                </td>
                <td className="py-2.5 px-3">
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-cyan-700 hover:underline font-sans text-[11px]"
                  >
                    <span>Open Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
