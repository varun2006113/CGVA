import React, { useState, useMemo } from 'react';
import {
  FileText,
  Activity,
  Dna,
  Box,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  ExternalLink
} from 'lucide-react';

export default function EvidenceInterpretation({
  evidenceSummaryData,
  variantData,
  clinvarData,
  proteinContextData,
  structuralContextData,
  predictionsData,
  reconciliationData
}) {
  const [selectedAlleleIdx, setSelectedAlleleIdx] = useState(0);

  // Consume pre-computed evidence summary from API/page state
  const summary = useMemo(() => {
    return evidenceSummaryData || null;
  }, [evidenceSummaryData]);

  if (!summary || !summary.available) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm font-sans text-xs text-slate-500 italic">
        Evidence interpretation unavailable.
      </div>
    );
  }

  const {
    alleleOptions = [],
    variantIdentity = {},
    molecularConsequence = {},
    clinicalEvidence = {},
    functionalPredictions = {},
    proteinContext = {},
    structuralContext = {},
    consistency = {},
    scientificTakeaway = '',
    scientificDisclaimer = ''
  } = summary;

  // Active allele calculation if multiple alleles exist
  const activeAllele = alleleOptions[selectedAlleleIdx] || summary.activeAllele || {};
  const currentVariantIdentity = {
    ...variantIdentity,
    alternateAllele: activeAllele.allele || variantIdentity.alternateAllele,
    proteinHGVS: activeAllele.proteinHgvs || variantIdentity.proteinHGVS,
    codingHGVS: activeAllele.codingHgvs || variantIdentity.codingHGVS
  };
  const currentMolecularConsequence = {
    ...molecularConsequence,
    alternateAA: activeAllele.alternateAA || molecularConsequence.alternateAA,
    referenceAA: activeAllele.referenceAA || molecularConsequence.referenceAA
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6 font-sans">
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-700" />
              <span>Evidence Interpretation</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
              Multi-Layer Factual Synthesis
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Transparent summary of retrieved clinical, computational, protein, and structural evidence.
          </p>
        </div>

        {/* Multi-Allelic Allele Selector Dropdown */}
        {alleleOptions.length > 1 && (
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200 font-mono text-xs self-start md:self-auto">
            <span className="font-bold text-slate-700">Select Allele:</span>
            <select
              value={selectedAlleleIdx}
              onChange={(e) => setSelectedAlleleIdx(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-cyan-600 cursor-pointer"
            >
              {alleleOptions.map((opt, i) => (
                <option key={i} value={i}>
                  {opt.allele} ({opt.proteinHgvs || 'N/A'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Layer 1 — Variant Identity */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
          <Dna className="w-4 h-4 text-cyan-700" />
          <span>Layer 1 — Variant Identity</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase">rsID / Identifier</span>
            <span className="font-bold text-cyan-800">{currentVariantIdentity.rsid}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase">Gene Symbol</span>
            <span className="font-bold text-slate-900">{currentVariantIdentity.gene}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase">Genomic Position</span>
            <span className="font-bold text-slate-900">Chr {currentVariantIdentity.chromosome}:{currentVariantIdentity.genomicPosition}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase">Selected Allele</span>
            <span className="font-bold text-emerald-800">{currentVariantIdentity.alternateAllele}</span>
          </div>
        </div>
        <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs font-mono flex flex-wrap items-center gap-4 text-slate-700">
          <span>Genomic: <strong className="text-slate-900">{currentVariantIdentity.genomicHGVS}</strong></span>
          <span>Coding: <strong className="text-slate-900">{currentVariantIdentity.codingHGVS}</strong></span>
          <span>Protein: <strong className="text-cyan-800">{currentVariantIdentity.proteinHGVS}</strong></span>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Layer 2 — Molecular Consequence */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-cyan-700" />
          <span>Layer 2 — Molecular Consequence</span>
        </h4>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 font-mono text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Consequence Type</span>
            <span className="font-bold text-slate-900 bg-slate-200/70 px-2 py-0.5 rounded inline-block">
              {currentMolecularConsequence.consequence}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Residue Position</span>
            <span className="font-bold text-slate-900">
              {currentMolecularConsequence.residuePosition ? `Residue ${currentMolecularConsequence.residuePosition}` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Amino Acid Change</span>
            <span className="font-bold text-cyan-800">
              {currentMolecularConsequence.referenceAA} → {currentMolecularConsequence.alternateAA}
            </span>
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Layer 3 — Clinical Evidence (ClinVar) */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-cyan-700" />
          <span>Layer 3 — Clinical Evidence (NCBI ClinVar)</span>
        </h4>

        {clinicalEvidence.available ? (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-800">ClinVar Classifications:</span>
                <div className="flex flex-wrap gap-1">
                  {clinicalEvidence.classifications.map((c, i) => (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                        c.toLowerCase().includes('pathogenic') && !c.toLowerCase().includes('likely')
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : c.toLowerCase().includes('likely pathogenic')
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : c.toLowerCase().includes('benign')
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-xs font-mono text-slate-600">
                Submissions: <strong className="text-slate-900">{clinicalEvidence.submissionCounts}</strong>
              </div>
            </div>

            {/* Conflicting Interpretations Alert */}
            {clinicalEvidence.conflicts && (
              <div className="bg-purple-50 border border-purple-200 text-purple-900 p-2.5 rounded text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-purple-700 shrink-0" />
                <span>Conflicting clinical significance assertions reported across ClinVar submitters.</span>
              </div>
            )}

            {/* Factual Statements List */}
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 font-sans">
              {clinicalEvidence.statements.map((stmt, i) => (
                <li key={i}>{stmt}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs font-mono text-slate-500 italic">
            No ClinVar clinical evidence records retrieved for this specific allele.
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* Layer 4 — Computational Evidence (Ensembl VEP / dbNSFP) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-700" />
            <span>Layer 4 — Computational Functional Predictions</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-500">
            Source: {functionalPredictions.source}
          </span>
        </div>

        {functionalPredictions.available ? (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              {/* AlphaMissense */}
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">AlphaMissense</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {functionalPredictions.alphaMissense?.prediction || 'N/A'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Score: {functionalPredictions.alphaMissense?.score ?? 'N/A'}
                </span>
              </div>

              {/* CADD */}
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">CADD</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {functionalPredictions.cadd?.phredScore !== null ? `PHRED ${functionalPredictions.cadd.phredScore}` : 'N/A'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Raw: {functionalPredictions.cadd?.rawScore ?? 'N/A'}
                </span>
              </div>

              {/* SIFT */}
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">SIFT</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {functionalPredictions.sift?.prediction || 'N/A'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Score: {functionalPredictions.sift?.score ?? 'N/A'}
                </span>
              </div>

              {/* PolyPhen-2 */}
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">PolyPhen-2</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {functionalPredictions.polyphen?.prediction || 'N/A'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Score: {functionalPredictions.polyphen?.score ?? 'N/A'}
                </span>
              </div>
            </div>

            {/* Predictor Discordance Warning */}
            {!functionalPredictions.isConcordant && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded text-xs font-mono flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Computational predictors are not fully concordant across algorithms for this allele.</span>
              </div>
            )}

            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 font-sans">
              {functionalPredictions.statements.map((stmt, i) => (
                <li key={i}>{stmt}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs font-mono text-slate-500 italic">
            Computational functional predictions unavailable for this allele.
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* Layer 5 — Protein Context */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-700" />
          <span>Layer 5 — Protein Context (UniProt)</span>
        </h4>

        {proteinContext.available ? (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2.5 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div>
                <span className="font-bold text-slate-900 text-sm">{proteinContext.proteinName}</span>
                <span className="text-slate-500 ml-2">({proteinContext.uniprotAccession})</span>
              </div>
              <span className="text-slate-600">
                Sequence Length: <strong className="text-slate-900">{proteinContext.proteinLength} AA</strong>
              </span>
            </div>

            {proteinContext.domainMatch ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-2.5 rounded flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Residue {proteinContext.residuePosition} falls within UniProt domain: <strong className="font-bold">{proteinContext.domainMatch.name}</strong> (Residues {proteinContext.domainMatch.start}–{proteinContext.domainMatch.end}).
                </span>
              </div>
            ) : (
              <div className="bg-slate-100 border border-slate-200 text-slate-700 p-2.5 rounded">
                Residue {proteinContext.residuePosition || 'N/A'} does not fall within currently retrieved UniProt annotated domain regions.
              </div>
            )}

            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 font-sans">
              {proteinContext.statements.map((stmt, i) => (
                <li key={i}>{stmt}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs font-mono text-slate-500 italic">
            UniProt protein context unavailable for this variant.
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* Layer 6 — Structural Context */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
          <Box className="w-4 h-4 text-cyan-700" />
          <span>Layer 6 — Structural Context (RCSB PDB & AlphaFold DB)</span>
        </h4>

        {structuralContext.available ? (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* PDB Summary */}
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Experimental PDB Coverage</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {structuralContext.pdbAvailable ? `${structuralContext.pdbCoverageCount} PDB Structure(s) Cover Residue` : 'Outside Experimental PDB Coverage'}
                </span>
                {structuralContext.representativePdb && (
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Representative: {structuralContext.representativePdb.pdbId} ({structuralContext.representativePdb.resolution || 'X-ray'})
                  </span>
                )}
              </div>

              {/* AlphaFold Summary */}
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">AlphaFold Predicted Model</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {structuralContext.modelId || 'N/A'}
                </span>
                <span className="text-[10px] text-cyan-800 font-bold block mt-0.5">
                  Residue pLDDT: {structuralContext.residuePlddt ?? 'N/A'} ({structuralContext.confidenceCategory})
                </span>
              </div>
            </div>

            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 font-sans">
              {structuralContext.statements.map((stmt, i) => (
                <li key={i}>{stmt}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs font-mono text-slate-500 italic">
            3D structural context unavailable for this variant.
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* Layer 7 — Evidence Consistency Matrix */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-cyan-700" />
          <span>Layer 7 — Evidence Consistency Matrix</span>
        </h4>

        {consistency.matrix && (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs font-mono border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-slate-900 text-slate-200 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Data Source</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Reconciliation Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {consistency.matrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{row.source}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.status === 'Matched'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : row.status === 'Partial'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : row.status === 'Conflict'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-sans text-[11px]">{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* Layer 8 — Scientific Takeaway & Disclaimer */}
      <div className="space-y-4">
        <h4 className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-cyan-700" />
          <span>Layer 8 — Scientific Takeaway</span>
        </h4>

        <div className="bg-slate-900 text-white p-5 rounded-lg space-y-3 border border-slate-800 shadow-sm">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
            Integrated Evidence Synthesis:
          </span>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            {scientificTakeaway}
          </p>
        </div>

        {/* Small Scientific Disclaimer */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded text-[11px] text-slate-600 font-sans leading-normal">
          <span className="font-bold text-slate-800">Scientific Disclaimer:</span> {scientificDisclaimer}
        </div>
      </div>

    </div>
  );
}
