import React from 'react';
import { ShieldAlert, Star, ExternalLink, AlertTriangle, CheckCircle2, FileQuestion } from 'lucide-react';

export default function ClinicalEvidence({ clinicalData }) {
  if (!clinicalData) return null;

  const {
    classification,
    reviewStatus,
    reviewStars = 2,
    conditions = [],
    submissionsCount = 0,
    conflictingInterpretations = [],
    clinvarAccession,
    clinvarUrl,
    lastUpdated
  } = clinicalData;

  const renderStars = (count) => {
    return Array.from({ length: 4 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i < count ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
      />
    ));
  };

  const getBadgeStyle = (classification) => {
    const cls = (classification || '').toLowerCase();
    if (cls.includes('pathogenic')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (cls.includes('benign')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (cls.includes('uncertain') || cls.includes('vus')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-purple-50 text-purple-700 border-purple-200';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-700" />
          <span>Clinical Evidence (ClinVar)</span>
        </h2>

        {clinvarUrl && (
          <a
            href={clinvarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-cyan-700 hover:text-cyan-900 hover:underline"
          >
            <span>View ClinVar Record</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Classification */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-md p-3.5">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
            Clinical Significance
          </span>
          <span className={`inline-block px-2.5 py-1 rounded text-sm font-bold border ${getBadgeStyle(classification)}`}>
            {classification || 'Reported'}
          </span>
        </div>

        {/* Review Status */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-md p-3.5">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
            Review Status
          </span>
          <div className="flex items-center gap-1 mb-1">
            {renderStars(reviewStars)}
          </div>
          <span className="text-xs text-slate-700 font-medium block capitalize">
            {reviewStatus || 'criteria provided, single submitter'}
          </span>
        </div>

        {/* Submissions & Record ID */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-md p-3.5">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
            Submissions & Accession
          </span>
          <div className="font-mono text-xs font-semibold text-slate-900">
            {clinvarAccession || 'VCV000012374'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Submissions: <span className="font-semibold text-slate-800">{submissionsCount}</span>
            {lastUpdated && <span className="block text-[10px] text-slate-400">Evaluated: {lastUpdated}</span>}
          </div>
        </div>
      </div>

      {/* Associated Conditions */}
      <div className="mb-4">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
          Associated Conditions / Diseases:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {conditions && conditions.length > 0 ? (
            conditions.map((cond, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded border border-slate-200 text-xs font-medium">
                {cond}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500 italic">No specific condition listed.</span>
          )}
        </div>
      </div>

      {/* Conflicting Interpretations Callout Banner */}
      {conflictingInterpretations && conflictingInterpretations.length > 0 && (
        <div className="mt-4 p-4 rounded-md bg-purple-50 border border-purple-200">
          <div className="flex items-center gap-2 mb-2 text-purple-900 font-semibold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-purple-700" />
            <span>Conflicting Interpretations Reported</span>
          </div>
          <p className="text-xs text-purple-800 mb-3">
            Submitting clinical laboratories have reported conflicting interpretations for this variant.
          </p>

          <div className="space-y-1.5">
            {conflictingInterpretations.map((conflict, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-purple-100 font-mono">
                <span className="text-slate-700">{conflict.submitter}</span>
                <span className="font-bold text-purple-900">{conflict.classification}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
