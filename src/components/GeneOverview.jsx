import React from 'react';
import { Dna, MapPin, ExternalLink, Layers, Activity, FileText } from 'lucide-react';

export default function GeneOverview({ geneData }) {
  if (!geneData) return null;

  const {
    symbol = 'TP53',
    name = 'Tumor Protein P53',
    entrezId = '7157',
    chromosome = '17',
    cytoband = '17p13.1',
    genomicLocation = 'Chr 17: 7,668,421 - 7,687,490 (GRCh38)',
    canonicalTranscript = 'NM_000546.6',
    canonicalProtein = 'NP_000537.3',
    uniprotId = 'P04637',
    proteinLength = 393,
    summary = 'Acts as a tumor suppressor in many tumor types.',
    variantsCount = 3420,
    clinvarPathogenicCount = 1842
  } = geneData;

  const fields = [
    { label: 'Gene Symbol', value: symbol, highlight: true },
    { label: 'Gene Description', value: name },
    { label: 'NCBI Entrez Gene ID', value: entrezId },
    { label: 'Chromosome Location', value: `Chr ${chromosome} (${cytoband})` },
    { label: 'Genomic Coordinates', value: genomicLocation },
    { label: 'Canonical RefSeq Transcript', value: canonicalTranscript },
    { label: 'Canonical RefSeq Protein', value: canonicalProtein },
    { label: 'UniProt KB Accession', value: uniprotId, isUrl: true, url: `https://www.uniprot.org/uniprotkb/${uniprotId}` }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-slate-900 text-cyan-400 flex items-center justify-center font-bold text-lg">
            {symbol.slice(0, 2)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
              {symbol} <span className="text-base font-normal text-slate-500">— {name}</span>
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Homo sapiens (Human) • Chromosome {chromosome}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://www.ncbi.nlm.nih.gov/gene/${entrezId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-cyan-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-100"
          >
            <span>NCBI Gene: {entrezId}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Grid of Key Properties */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {fields.map((f, idx) => (
          <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded p-3">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
              {f.label}
            </span>
            {f.isUrl ? (
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-bold text-sm text-cyan-700 hover:underline flex items-center gap-1"
              >
                <span>{f.value}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className={`font-mono text-sm ${f.highlight ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                {f.value}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Function Narrative */}
      <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-5">
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
          Gene Function Narrative (NCBI / UniProt):
        </span>
        <p className="text-xs text-slate-700 leading-relaxed font-sans">
          {summary}
        </p>
      </div>

      {/* Real Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 text-white p-3.5 rounded border border-slate-800">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-0.5">
            Total Cataloged Variants
          </span>
          <span className="text-xl font-bold font-mono">
            {variantsCount.toLocaleString()}
          </span>
        </div>

        <div className="bg-red-950 text-red-100 p-3.5 rounded border border-red-900">
          <span className="text-[10px] font-mono text-red-300 uppercase tracking-wider block mb-0.5">
            ClinVar Pathogenic
          </span>
          <span className="text-xl font-bold font-mono text-red-200">
            {clinvarPathogenicCount.toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-100 text-slate-900 p-3.5 rounded border border-slate-200">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-0.5">
            Protein Length
          </span>
          <span className="text-xl font-bold font-mono">
            {proteinLength} AA
          </span>
        </div>

        <div className="bg-slate-100 text-slate-900 p-3.5 rounded border border-slate-200">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-0.5">
            Cytogenetic Location
          </span>
          <span className="text-xl font-bold font-mono text-cyan-800">
            {cytoband}
          </span>
        </div>
      </div>
    </div>
  );
}
