import React from 'react';
import { Activity, ShieldCheck, AlertTriangle, HelpCircle, CheckCircle, Database } from 'lucide-react';

export default function VariantHeader({ variantData }) {
  if (!variantData) return null;

  const { variant, consequence, clinical, isDemoData } = variantData;

  const getClinicalBadge = (classification) => {
    const cls = (classification || '').toLowerCase();
    if (cls.includes('pathogenic')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
          {classification}
        </span>
      );
    }
    if (cls.includes('benign')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          {classification}
        </span>
      );
    }
    if (cls.includes('uncertain') || cls.includes('vus')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          {classification}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
        <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
        {classification || 'Reported'}
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Gene Symbol & Identifiers */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              {variant?.gene || 'TP53'}
            </h1>
            <span className="px-2.5 py-0.5 rounded text-sm font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {variant?.rsid || 'rs28934578'}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono uppercase bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold">
              {variant?.type || 'SNV'}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono uppercase bg-slate-100 text-slate-700 border border-slate-200">
              {consequence?.type || 'Missense'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Location: Chr {variant?.chromosome || 17}:{variant?.position?.toLocaleString() || '7,675,088'} ({variant?.genomeBuild || 'GRCh38'})
          </p>
        </div>

        {/* Clinical Badge & Data Provenance Status */}
        <div className="flex items-center gap-3">
          {getClinicalBadge(clinical?.classification)}
          
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>{isDemoData ? 'Demonstration Data' : 'Live NCBI / ClinVar Data'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
