import React from 'react';
import { Dna, Hash, MapPin, Layers, Binary } from 'lucide-react';

export default function VariantIdentity({ variantData }) {
  if (!variantData) return null;
  const { variant } = variantData;

  const items = [
    { label: 'Gene', value: variant?.gene || 'TP53', icon: Dna },
    { label: 'rsID', value: variant?.rsid || 'rs28934578', icon: Hash },
    { label: 'Genome Build', value: variant?.genomeBuild || 'GRCh38', icon: Layers },
    { label: 'Chromosome', value: `Chr ${variant?.chromosome || '17'}`, icon: MapPin },
    { label: 'Genomic Position', value: variant?.position?.toLocaleString() || '7,675,088', icon: MapPin },
    { label: 'Reference Allele', value: variant?.referenceAllele || 'G', isAllele: true, isRef: true },
    { label: 'Alternate Allele', value: variant?.alternateAllele || 'A', isAllele: true, isAlt: true },
    { label: 'Variant Class', value: variant?.type || 'SNV', icon: Binary }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
        <Dna className="w-4 h-4 text-cyan-700" />
        <span>Genomic Identity</span>
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <div key={index} className="bg-slate-50 border border-slate-200/80 rounded-md p-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
              {item.label}
            </span>
            <div className="flex items-center gap-2">
              {item.isAllele ? (
                <span className={`px-2 py-0.5 font-mono font-bold text-sm rounded ${item.isRef ? 'bg-slate-200 text-slate-800' : 'bg-amber-100 text-amber-900 border border-amber-300'}`}>
                  {item.value}
                </span>
              ) : (
                <span className="font-mono font-semibold text-slate-900 text-sm">
                  {item.value}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
