import React from 'react';
import { GitCompare, ExternalLink, ShieldCheck, Cpu, Dna, CheckCircle2, Info, AlertTriangle, Activity, MapPin, Database, Box } from 'lucide-react';

export default function VariantComparison({ payloadA, payloadB, comparison }) {
  if (!payloadA && !payloadB) return null;

  const varA = payloadA?.variant;
  const varB = payloadB?.variant;

  const rsidA = varA?.rsid || payloadA?.query || 'Variant A';
  const rsidB = varB?.rsid || payloadB?.query || 'Variant B';

  const geneA = varA?.gene?.symbol || 'N/A';
  const geneB = varB?.gene?.symbol || 'N/A';

  const labelA = `${rsidA} (${geneA})`;
  const labelB = `${rsidB} (${geneB})`;

  // Extract ClinVar primary record or summary
  const cvA = payloadA?.clinvar?.records?.[0] || null;
  const cvB = payloadB?.clinvar?.records?.[0] || null;

  // Extract Protein Context summary
  const pcA = payloadA?.proteinContext;
  const pcB = payloadB?.proteinContext;

  // Extract Structural Context summary
  const scA = payloadA?.structuralContext;
  const scB = payloadB?.structuralContext;

  // Extract Predictions primary allele
  const predA = payloadA?.predictions?.allelePredictions?.[0];
  const predB = payloadB?.predictions?.allelePredictions?.[0];

  // Extract Reconciliation status
  const recA = payloadA?.reconciliation;
  const recB = payloadB?.reconciliation;

  return (
    <div className="space-y-6">

      {/* Same Variant Notice Banner */}
      {comparison?.sameRsid && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 font-mono text-xs text-cyan-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-700 shrink-0" />
          <span>
            <strong className="font-bold">Identical RefSNP Query Notice:</strong> Both inputs resolve to the exact same RefSNP identifier (<code className="font-bold text-cyan-950">{rsidA}</code>). Showing single-variant evidence profile.
          </span>
        </div>
      )}

      {/* Partial Comparison Notice Banner */}
      {comparison?.isPartial && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 font-mono text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong className="font-bold">Partial Comparison Notice:</strong> {comparison.summaryNote}
            </span>
          </div>
        </div>
      )}

      {/* Shared Characteristics & Factual Differences Grid */}
      {comparison && (!comparison.sameRsid || comparison.shared?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Shared Characteristics */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 font-mono">
                Shared Factual Characteristics ({comparison.shared?.length || 0})
              </h3>
            </div>
            {comparison.shared && comparison.shared.length > 0 ? (
              <ul className="space-y-2 text-xs font-sans text-slate-700">
                {comparison.shared.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></span>
                    <span className="font-semibold text-slate-800">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs font-mono italic text-slate-500 bg-slate-50 p-3 rounded">
                No major shared attributes identified beyond basic genomic format.
              </p>
            )}
          </div>

          {/* Factual Differences */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Info className="w-4 h-4 text-cyan-700 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 font-mono">
                Factual Differences ({comparison.differences?.length || 0})
              </h3>
            </div>
            {comparison.differences && comparison.differences.length > 0 ? (
              <ul className="space-y-2 text-xs font-sans text-slate-700">
                {comparison.differences.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-cyan-50/50 p-2.5 rounded border border-cyan-200/60">
                    <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full mt-1.5 shrink-0"></span>
                    <span className="font-semibold text-slate-800">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs font-mono italic text-slate-500 bg-slate-50 p-3 rounded">
                No major factual differences identified.
              </p>
            )}
          </div>

        </div>
      )}

      {/* Main Side-by-Side Comparison Matrix */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        
        {/* Table Header */}
        <div className="bg-slate-900 text-white p-4 border-b border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-4">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-400">
                Evidence Category / Metric
              </span>
            </div>
            <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-4">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-cyan-400 block">
                Variant A: {labelA}
              </span>
            </div>
            <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-4">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-amber-400 block">
                Variant B: {labelB}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Variant Identity */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center gap-2 font-mono text-xs font-bold text-slate-900">
          <MapPin className="w-4 h-4 text-cyan-700" />
          <span>1. Variant Identity & Genomic Locus (Stage 6A)</span>
        </div>
        <div className="divide-y divide-slate-200 font-mono text-xs">
          
          {/* Gene Symbol */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">Gene Symbol</div>
            <div className="md:col-span-4 font-bold text-cyan-900">{varA?.gene?.symbol || 'N/A'}</div>
            <div className="md:col-span-4 font-bold text-amber-900">{varB?.gene?.symbol || 'N/A'}</div>
          </div>

          {/* rsID */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">RefSNP Identifier</div>
            <div className="md:col-span-4 font-bold text-slate-900">{varA?.rsid || payloadA?.query || 'N/A'}</div>
            <div className="md:col-span-4 font-bold text-slate-900">{varB?.rsid || payloadB?.query || 'N/A'}</div>
          </div>

          {/* Genomic Location */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">GRCh38 Location</div>
            <div className="md:col-span-4 text-slate-800">
              {varA ? `chr${varA.genomic?.chromosome || 'N/A'}:${varA.genomic?.position || 'N/A'}` : 'N/A'}
            </div>
            <div className="md:col-span-4 text-slate-800">
              {varB ? `chr${varB.genomic?.chromosome || 'N/A'}:${varB.genomic?.position || 'N/A'}` : 'N/A'}
            </div>
          </div>

          {/* Ref / Alt Alleles */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">Ref / Alt Alleles</div>
            <div className="md:col-span-4 text-slate-900">
              {varA ? `${varA.genomic?.reference || ''} > [${varA.genomic?.alternate || ''}]` : 'N/A'}
            </div>
            <div className="md:col-span-4 text-slate-900">
              {varB ? `${varB.genomic?.reference || ''} > [${varB.genomic?.alternate || ''}]` : 'N/A'}
            </div>
          </div>

          {/* Genomic HGVS */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">Genomic HGVS</div>
            <div className="md:col-span-4 text-slate-800 text-[11px] truncate" title={varA?.hgvs?.genomic || ''}>
              {varA?.hgvs?.genomic || 'N/A'}
            </div>
            <div className="md:col-span-4 text-slate-800 text-[11px] truncate" title={varB?.hgvs?.genomic || ''}>
              {varB?.hgvs?.genomic || 'N/A'}
            </div>
          </div>
        </div>

        {/* Section 2: Molecular Consequence */}
        <div className="p-4 bg-slate-50/80 border-t border-b border-slate-200 flex items-center gap-2 font-mono text-xs font-bold text-slate-900">
          <Dna className="w-4 h-4 text-cyan-700" />
          <span>2. Molecular Consequence (Stage 7)</span>
        </div>
        <div className="divide-y divide-slate-200 font-mono text-xs">
          
          {/* Coding HGVS */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">Coding HGVS (c.)</div>
            <div className="md:col-span-4 font-semibold text-cyan-900">{varA?.hgvs?.coding || 'N/A'}</div>
            <div className="md:col-span-4 font-semibold text-amber-900">{varB?.hgvs?.coding || 'N/A'}</div>
          </div>

          {/* Protein HGVS */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">Protein Change (p.)</div>
            <div className="md:col-span-4 font-bold text-slate-900">{varA?.hgvs?.protein || pcA?.proteinHgvs || 'N/A'}</div>
            <div className="md:col-span-4 font-bold text-slate-900">{varB?.hgvs?.protein || pcB?.proteinHgvs || 'N/A'}</div>
          </div>

          {/* Amino Acid Substitution */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">Residue Substitution</div>
            <div className="md:col-span-4 text-slate-800">
              {pcA?.proteinPosition ? `Residue ${pcA.proteinPosition} (${pcA.referenceAA || ''} → ${pcA.alternateAA || ''})` : 'N/A'}
            </div>
            <div className="md:col-span-4 text-slate-800">
              {pcB?.proteinPosition ? `Residue ${pcB.proteinPosition} (${pcB.referenceAA || ''} → ${pcB.alternateAA || ''})` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Section 3: ClinVar Clinical Evidence */}
        <div className="p-4 bg-slate-50/80 border-t border-b border-slate-200 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Activity className="w-4 h-4 text-cyan-700" />
            <span>3. ClinVar Clinical Evidence (Stage 6B)</span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans">Submitted Clinical Significations</span>
        </div>
        <div className="divide-y divide-slate-200 font-mono text-xs">
          
          {/* Clinical Significance */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">Clinical Significance</div>
            <div className="md:col-span-4">
              {cvA ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                  {cvA.clinicalSignificance}
                </span>
              ) : (
                <span className="text-slate-500 italic font-sans text-[11px]">No ClinVar record</span>
              )}
            </div>
            <div className="md:col-span-4">
              {cvB ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                  {cvB.clinicalSignificance}
                </span>
              ) : (
                <span className="text-slate-500 italic font-sans text-[11px]">No ClinVar record</span>
              )}
            </div>
          </div>

          {/* Condition / Disease */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">Condition / Disease</div>
            <div className="md:col-span-4 text-slate-800 text-[11px] font-sans truncate" title={cvA?.condition || ''}>
              {cvA?.condition || 'N/A'}
            </div>
            <div className="md:col-span-4 text-slate-800 text-[11px] font-sans truncate" title={cvB?.condition || ''}>
              {cvB?.condition || 'N/A'}
            </div>
          </div>

          {/* Review Status & Stars */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">Review Status & Stars</div>
            <div className="md:col-span-4 text-slate-800 font-sans text-[11px]">
              {cvA ? `${'★'.repeat(cvA.reviewStars || 0)} (${cvA.reviewStatus || 'provided'})` : 'N/A'}
            </div>
            <div className="md:col-span-4 text-slate-800 font-sans text-[11px]">
              {cvB ? `${'★'.repeat(cvB.reviewStars || 0)} (${cvB.reviewStatus || 'provided'})` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Section 4: Protein Context */}
        <div className="p-4 bg-slate-50/80 border-t border-b border-slate-200 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Dna className="w-4 h-4 text-cyan-700" />
            <span>4. UniProt Protein Context (Stage 7)</span>
          </div>
          {pcA?.uniprotAccession && pcB?.uniprotAccession && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              pcA.uniprotAccession === pcB.uniprotAccession
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-cyan-100 text-cyan-900 border border-cyan-200'
            }`}>
              {pcA.uniprotAccession === pcB.uniprotAccession ? 'Same UniProt Protein' : 'Different UniProt Proteins'}
            </span>
          )}
        </div>
        <div className="divide-y divide-slate-200 font-mono text-xs">
          
          {/* UniProt Accession */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">UniProt Accession</div>
            <div className="md:col-span-4 font-bold text-cyan-900">{pcA?.uniprotAccession || 'N/A'}</div>
            <div className="md:col-span-4 font-bold text-amber-900">{pcB?.uniprotAccession || 'N/A'}</div>
          </div>

          {/* Protein Name */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">Protein Name</div>
            <div className="md:col-span-4 text-slate-800 text-[11px] font-sans truncate" title={pcA?.protein?.name || ''}>
              {pcA?.protein?.name || 'N/A'}
            </div>
            <div className="md:col-span-4 text-slate-800 text-[11px] font-sans truncate" title={pcB?.protein?.name || ''}>
              {pcB?.protein?.name || 'N/A'}
            </div>
          </div>
        </div>

        {/* Section 5: Structural Context */}
        <div className="p-4 bg-slate-50/80 border-t border-b border-slate-200 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Box className="w-4 h-4 text-cyan-700" />
            <span>5. Structural Context (Stage 8)</span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans">RCSB PDB & AlphaFold DB</span>
        </div>
        <div className="divide-y divide-slate-200 font-mono text-xs">
          
          {/* PDB Coverage */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">PDB Residue Coverage</div>
            <div className="md:col-span-4 text-cyan-900 font-bold">
              {scA?.summary ? `${scA.summary.coveringPdbCount} / ${scA.summary.totalPdbCount} PDBs` : 'N/A'}
            </div>
            <div className="md:col-span-4 text-amber-900 font-bold">
              {scB?.summary ? `${scB.summary.coveringPdbCount} / ${scB.summary.totalPdbCount} PDBs` : 'N/A'}
            </div>
          </div>

          {/* AlphaFold pLDDT */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">AlphaFold Residue pLDDT</div>
            <div className="md:col-span-4 text-slate-900">
              {scA?.summary?.residuePlddt !== null ? (
                <span>
                  <strong className="font-bold">{scA.summary.residuePlddt}</strong>
                  <span className="text-[10px] text-slate-500 ml-1 font-sans">({scA.summary.residueCategory})</span>
                </span>
              ) : 'Unavailable'}
            </div>
            <div className="md:col-span-4 text-slate-900">
              {scB?.summary?.residuePlddt !== null ? (
                <span>
                  <strong className="font-bold">{scB.summary.residuePlddt}</strong>
                  <span className="text-[10px] text-slate-500 ml-1 font-sans">({scB.summary.residueCategory})</span>
                </span>
              ) : 'Unavailable'}
            </div>
          </div>
        </div>

        {/* Section 6: Computational Functional Predictions */}
        <div className="p-4 bg-slate-50/80 border-t border-b border-slate-200 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Cpu className="w-4 h-4 text-cyan-700" />
            <span>6. Computational Functional Predictions (Stage 9)</span>
          </div>
          <span className="text-[10px] text-purple-800 font-mono font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            Independent Predictions — No Combined Score
          </span>
        </div>
        <div className="divide-y divide-slate-200 font-mono text-xs">
          
          {/* AlphaMissense */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">AlphaMissense</div>
            <div className="md:col-span-4 text-slate-900">
              {predA?.predictors?.alphaMissense ? (
                <span>
                  <strong className="font-bold">{predA.predictors.alphaMissense.prediction}</strong>
                  {predA.predictors.alphaMissense.score !== null && (
                    <span className="text-[11px] text-slate-500 ml-1">({predA.predictors.alphaMissense.score})</span>
                  )}
                </span>
              ) : 'Not available'}
            </div>
            <div className="md:col-span-4 text-slate-900">
              {predB?.predictors?.alphaMissense ? (
                <span>
                  <strong className="font-bold">{predB.predictors.alphaMissense.prediction}</strong>
                  {predB.predictors.alphaMissense.score !== null && (
                    <span className="text-[11px] text-slate-500 ml-1">({predB.predictors.alphaMissense.score})</span>
                  )}
                </span>
              ) : 'Not available'}
            </div>
          </div>

          {/* CADD PHRED */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">CADD PHRED</div>
            <div className="md:col-span-4 font-bold text-slate-900">
              {predA?.predictors?.cadd?.score != null ? `PHRED ${predA.predictors.cadd.score}` : 'Not available'}
            </div>
            <div className="md:col-span-4 font-bold text-slate-900">
              {predB?.predictors?.cadd?.score != null ? `PHRED ${predB.predictors.cadd.score}` : 'Not available'}
            </div>
          </div>

          {/* SIFT */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">SIFT</div>
            <div className="md:col-span-4 text-slate-900">
              {predA?.predictors?.sift ? (
                <span>
                  <strong className="font-bold">{predA.predictors.sift.prediction}</strong>
                  {predA.predictors.sift.score !== null && (
                    <span className="text-[11px] text-slate-500 ml-1">({predA.predictors.sift.score})</span>
                  )}
                </span>
              ) : 'Not available'}
            </div>
            <div className="md:col-span-4 text-slate-900">
              {predB?.predictors?.sift ? (
                <span>
                  <strong className="font-bold">{predB.predictors.sift.prediction}</strong>
                  {predB.predictors.sift.score !== null && (
                    <span className="text-[11px] text-slate-500 ml-1">({predB.predictors.sift.score})</span>
                  )}
                </span>
              ) : 'Not available'}
            </div>
          </div>

          {/* PolyPhen-2 */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">PolyPhen-2</div>
            <div className="md:col-span-4 text-slate-900">
              {predA?.predictors?.polyphen ? (
                <span>
                  <strong className="font-bold">{predA.predictors.polyphen.prediction}</strong>
                  {predA.predictors.polyphen.score !== null && (
                    <span className="text-[11px] text-slate-500 ml-1">({predA.predictors.polyphen.score})</span>
                  )}
                </span>
              ) : 'Not available'}
            </div>
            <div className="md:col-span-4 text-slate-900">
              {predB?.predictors?.polyphen ? (
                <span>
                  <strong className="font-bold">{predB.predictors.polyphen.prediction}</strong>
                  {predB.predictors.polyphen.score !== null && (
                    <span className="text-[11px] text-slate-500 ml-1">({predB.predictors.polyphen.score})</span>
                  )}
                </span>
              ) : 'Not available'}
            </div>
          </div>
        </div>

        {/* Section 7: Evidence Consistency */}
        <div className="p-4 bg-slate-50/80 border-t border-b border-slate-200 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>7. Evidence Consistency (Stage 10)</span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans">Multi-Database Reconciliation</span>
        </div>
        <div className="divide-y divide-slate-200 font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 p-3 hover:bg-slate-50 transition-colors">
            <div className="md:col-span-4 text-slate-600 font-sans font-semibold">Reconciliation Status</div>
            <div className="md:col-span-4 font-bold text-slate-900">
              {recA?.status ? (
                <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-900 border border-slate-200">
                  {recA.status}
                </span>
              ) : 'N/A'}
            </div>
            <div className="md:col-span-4 font-bold text-slate-900">
              {recB?.status ? (
                <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-900 border border-slate-200">
                  {recB.status}
                </span>
              ) : 'N/A'}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
