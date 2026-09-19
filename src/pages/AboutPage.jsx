import React from 'react';
import { Dna, ShieldAlert, Layers, Database, Cpu, Box, FileText, CheckCircle2, ExternalLink, HelpCircle, AlertTriangle } from 'lucide-react';

export default function AboutPage() {
  const dataSources = [
    { source: 'NCBI dbSNP / Variation', purpose: 'Variant identity, genomic coordinates (GRCh38), RefSeq transcripts (NM_), and RefSNP rsID resolution.', url: 'https://www.ncbi.nlm.nih.gov/snp/' },
    { source: 'NCBI ClinVar', purpose: 'Clinical variant interpretations (Pathogenic, Benign, VUS), submission counts, review stars, and conflicting assertions.', url: 'https://www.ncbi.nlm.nih.gov/clinvar/' },
    { source: 'UniProtKB', purpose: 'Canonical protein sequences, amino acid sequence length, protein domain boundaries, and functional annotations.', url: 'https://www.uniprot.org/' },
    { source: 'RCSB PDB', purpose: 'Experimentally determined 3D atomic structures (X-ray crystallography, cryo-EM) covering the target protein residue.', url: 'https://www.rcsb.org/' },
    { source: 'AlphaFold DB', purpose: 'Computationally predicted 3D protein structures with per-residue pLDDT structural confidence scores.', url: 'https://alphafold.ebi.ac.uk/' },
    { source: 'Ensembl VEP / dbNSFP', purpose: 'In-silico functional predictions (AlphaMissense, CADD, SIFT, PolyPhen-2) for allele consequences.', url: 'https://www.ensembl.org/info/docs/tools/vep/index.html' }
  ];

  const concepts = [
    { term: 'rsID', def: 'A stable identifier assigned to a variant record in dbSNP (e.g., rs28934578).' },
    { term: 'SNV', def: 'Single Nucleotide Variant — a DNA sequence variation occurring when a single nucleotide differs.' },
    { term: 'HGVS Nomenclature', def: 'Standardized nomenclature for describing genetic variants at genomic (g.), coding cDNA (c.), and protein (p.) levels.' },
    { term: 'Genomic HGVS (g.)', def: 'Variant nomenclature anchored to a specific genomic chromosome assembly (e.g., NC_000017.11:g.7675088C>T).' },
    { term: 'Coding HGVS (c.)', def: 'Variant nomenclature anchored to a specific RefSeq mRNA transcript sequence (e.g., NM_000546.6:c.524G>A).' },
    { term: 'Protein HGVS (p.)', def: 'Variant nomenclature describing amino acid substitution in a protein sequence (e.g., NP_000537.3:p.Arg175His).' },
    { term: 'Missense Variant', def: 'A single nucleotide change that results in a codon coding for a different amino acid.' },
    { term: 'ClinVar Significance', def: 'Clinical assertions (Pathogenic, Benign, VUS) submitted by laboratories to NCBI ClinVar.' },
    { term: 'Computational Prediction', def: 'In-silico algorithmic estimations (AlphaMissense, CADD, SIFT, PolyPhen-2) assessing sequence alteration impact.' },
    { term: 'PDB', def: 'Protein Data Bank — public repository of experimentally determined 3D biological macromolecular structures.' },
    { term: 'AlphaFold DB', def: 'Database of 3D protein structures predicted computationally by DeepMind\'s AlphaFold system.' },
    { term: 'pLDDT', def: 'Predicted Local Distance Difference Test — residue-level structural prediction confidence score (0–100) assigned by AlphaFold.' },
    { term: 'Evidence Reconciliation', def: 'Algorithmic verification confirming that evidence retrieved across databases maps to the exact same biological allele.' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 font-sans">
      
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded bg-slate-900 text-cyan-400 flex items-center justify-center font-bold text-lg shrink-0">
            <Dna className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              About & Scientific Methodology
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Cancer Genomic Variant Explorer (CGVE) — System Architecture, Data Provenance & Scientific Guidelines
            </p>
          </div>
        </div>
      </div>

      {/* 1. What is CGVE? */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-3">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          1. What is CGVE?
        </h2>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          The Cancer Genomic Variant Explorer (CGVE) is an educational and research bioinformatics platform designed to aggregate, normalize, and present multi-dimensional evidence for cancer-associated genetic variants.
        </p>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          Rather than generating artificial combined pathogenicity scores or diagnostic rankings, CGVE aggregates raw, authoritative evidence directly from primary biological databases—allowing researchers, students, and clinicians to evaluate clinical interpretations, molecular consequences, computational functional predictions, protein domain context, and 3D structural parameters transparently.
        </p>
      </div>

      {/* 2. Scientific Workflow */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          2. End-to-End Scientific Integration Pipeline
        </h2>
        <div className="bg-slate-900 text-cyan-300 p-4 rounded-md font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
          User Query (Gene Symbol / rsID / HGVS)<br />
          &nbsp;&nbsp;│<br />
          &nbsp;&nbsp;▼<br />
          Stage 1 — Input Detection & Validation<br />
          &nbsp;&nbsp;│<br />
          &nbsp;&nbsp;▼<br />
          Stage 2 & 6A — NCBI dbSNP / Variation Services (Variant Identity & HGVS)<br />
          &nbsp;&nbsp;│<br />
          &nbsp;&nbsp;├───────► Stage 3 & 6B: NCBI ClinVar (Clinical Records & Review Stars)<br />
          &nbsp;&nbsp;├───────► Stage 4 & 7: UniProtKB (Protein Mapping & Domain Context)<br />
          &nbsp;&nbsp;├───────► Stage 5 & 8: RCSB PDB & AlphaFold DB (3D Structural Context & pLDDT)<br />
          &nbsp;&nbsp;└───────► Stage 9: Ensembl VEP / dbNSFP (AlphaMissense, CADD, SIFT, PolyPhen-2)<br />
          &nbsp;&nbsp;│<br />
          &nbsp;&nbsp;▼<br />
          Stage 10 — Allele-Level Evidence Reconciliation & Discrepancy Detection<br />
          &nbsp;&nbsp;│<br />
          &nbsp;&nbsp;▼<br />
          Stage 13 — WebGL 3D Structural Visualization (3Dmol.js)<br />
          &nbsp;&nbsp;│<br />
          &nbsp;&nbsp;▼<br />
          Stage 14 — Transparent Multi-Layer Evidence Interpretation & Factual Takeaway
        </div>
      </div>

      {/* 3. Primary Data Sources Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          3. Primary Biological Data Sources
        </h2>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs font-sans border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-900 text-slate-200 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Data Source</th>
                <th className="py-2.5 px-3">Primary Purpose & Content</th>
                <th className="py-2.5 px-3">Official Resource</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {dataSources.map((ds, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">
                    {ds.source}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">
                    {ds.purpose}
                  </td>
                  <td className="py-2.5 px-3">
                    <a
                      href={ds.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-700 hover:text-cyan-900 font-mono font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Bioinformatics Concepts Glossary */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-700" />
          <span>4. Essential Bioinformatics Concepts</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {concepts.map((c, i) => (
            <div key={i} className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="font-bold text-cyan-800 font-mono block mb-0.5">
                {c.term}
              </span>
              <p className="text-slate-700 leading-normal">
                {c.def}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Key Scientific Disclaimers & Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Experimental vs Predicted Structures */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 font-mono flex items-center gap-2">
            <Box className="w-4 h-4 text-cyan-700" />
            <span>Experimental vs. Predicted Structures</span>
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-900 font-mono">PDB:</strong> Represents <em>experimentally determined</em> atomic structures (X-ray, Cryo-EM, NMR) deposited in the Protein Data Bank.
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-900 font-mono">AlphaFold:</strong> Represents <em>computationally predicted</em> 3D models generated by deep learning.
          </p>
          <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-cyan-50 p-2.5 rounded border border-cyan-200 text-cyan-900">
            <strong>pLDDT Interpretation Note:</strong> pLDDT measures local structural prediction confidence (0–100). High pLDDT does NOT imply clinical pathogenicity, nor does low pLDDT imply benignity.
          </p>
        </div>

        {/* ClinVar & Predictor Disclaimers */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 font-mono flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-700" />
            <span>Clinical & Computational Disclaimers</span>
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-900">ClinVar Assertions:</strong> All clinical classifications displayed in CGVE are retrieved directly from NCBI ClinVar records and are attributed to submitting clinical laboratories. CGVE does not generate clinical classifications.
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-900">Computational Predictors:</strong> Scores from AlphaMissense, CADD, SIFT, and PolyPhen-2 are computational predictions only and are not equivalent to clinical diagnosis. CGVE does not collapse predictors into a single score.
          </p>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-100 p-2.5 rounded border border-slate-200 font-mono">
            <strong>3D Viewer Note:</strong> 3Dmol displays reference structures with the target variant residue position highlighted. CGVE does not perform in-silico mutant energy modeling.
          </p>
        </div>

      </div>

      {/* 6. Honest Scientific Limitations */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-3">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>5. Honest Scientific Limitations</span>
        </h2>
        <ul className="text-xs text-slate-700 leading-relaxed space-y-1.5 list-disc list-inside">
          <li>External APIs (NCBI, ClinVar, UniProt, RCSB PDB, Ensembl VEP) may be temporarily rate-limited or unavailable.</li>
          <li>Analytics visualizations reflect the subset of records retrieved for selected genes rather than the full genomic database.</li>
          <li>Alternative mRNA transcripts (NM_ RefSeq identifiers) can alter coding and protein HGVS residue numbering.</li>
          <li>Multi-allelic rsIDs possess multiple alternate alleles with distinct molecular and clinical consequences.</li>
          <li>AlphaFold 3D structures are computational predictions and may differ from native physiological conformations.</li>
          <li>Absence of an experimental PDB structure covering a residue does not imply lack of functional importance.</li>
          <li><strong>Non-Diagnostic Notice:</strong> CGVE is strictly an educational and research software platform, not a medical diagnostic system.</li>
        </ul>
      </div>

    </div>
  );
}
