import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dna, ArrowRight, Activity, Database, Layers, Box, Cpu, FileText, CheckCircle2 } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { detectInputType } from '../utils/inputDetection';

export default function HomePage() {
  const navigate = useNavigate();

  const handleSearch = (queryStr, detectedType) => {
    const clean = queryStr.trim();
    const type = detectedType || detectInputType(clean);

    console.log(`[HomePage Search] Input: "${clean}", Type: "${type}"`);

    if (type === 'GENE') {
      navigate(`/gene/${encodeURIComponent(clean)}`);
    } else {
      navigate(`/variant/${encodeURIComponent(clean)}`);
    }
  };

  const exampleGenes = [
    { symbol: 'BRCA1', name: 'BRCA1 DNA Repair Associated', desc: 'Hereditary breast & ovarian cancer susceptibility', rsid: 'rs80357906' },
    { symbol: 'TP53', name: 'Tumor Protein P53', desc: 'Li-Fraumeni & multi-cancer tumor suppressor', rsid: 'rs28934578' },
    { symbol: 'BRCA2', name: 'BRCA2 DNA Repair Associated', desc: 'Fanconi anemia & hereditary breast cancer', rsid: 'rs80359550' },
    { symbol: 'KRAS', name: 'KRAS Proto-Oncogene, GTPase', desc: 'Pancreatic, colorectal & NSCLC driver mutations', rsid: 'rs121913279' },
    { symbol: 'BRAF', name: 'B-Raf Proto-Oncogene', desc: 'Cutaneous melanoma & papillary thyroid carcinoma', rsid: 'rs121913529' },
    { symbol: 'EGFR', name: 'Epidermal Growth Factor Receptor', desc: 'Lung adenocarcinoma EGFR-TKI target mutations', rsid: 'rs121434568' }
  ];

  const exampleVariants = [
    { rsid: 'rs28934578', gene: 'TP53', change: 'c.524G>A → p.Arg175His', desc: 'Zinc coordination hotspot mutation in TP53 DBD' },
    { rsid: 'rs121913343', gene: 'TP53', change: 'c.818G>A → p.Arg273His', desc: 'DNA contact hotspot mutation in TP53 DBD' },
    { rsid: 'rs1799966', gene: 'BRCA1', change: 'c.4837A>G → p.Ser1613Gly', desc: 'BRCA1 coding transcript representation' },
    { rsid: 'rs121913529', gene: 'BRAF', change: 'c.1799T>A → p.Val600Glu', desc: 'Constitutive kinase activation mutation' }
  ];

  const workflowSteps = [
    { step: '1', title: 'Variant', desc: 'Input rsID, HGVS, or Gene symbol' },
    { step: '2', title: 'NCBI dbSNP', desc: 'Genomic assembly & RefSeq identity' },
    { step: '3', title: 'ClinVar', desc: 'Variant-specific clinical evidence' },
    { step: '4', title: 'UniProt', desc: 'Protein accession & domain context' },
    { step: '5', title: 'PDB / AlphaFold', desc: 'Experimental PDB & pLDDT confidence' },
    { step: '6', title: 'Ensembl VEP', desc: 'AlphaMissense, CADD, SIFT, PolyPhen' },
    { step: '7', title: 'Reconciliation', desc: 'Allele-level representation matching' },
    { step: '8', title: '3D Viewer', desc: '3Dmol WebGL residue visualization' },
    { step: '9', title: 'Interpretation', desc: 'Multi-layer factual synthesis' }
  ];

  return (
    <div className="space-y-10 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      
      {/* Hero Section */}
      <div className="text-center py-10 bg-white border border-slate-200 rounded-xl p-6 sm:p-10 shadow-2xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-mono font-bold mb-4">
          <Dna className="w-4 h-4 text-cyan-700" />
          <span>Cancer Genomic Variant Explorer (CGVE)</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-3">
          Cancer Genomic Variant Explorer
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed mb-6 font-sans">
          An interactive bioinformatics platform for exploring genomic variants across clinical, molecular, computational, and structural evidence.
        </p>

        {/* Central Search Bar */}
        <div className="flex justify-center mb-5">
          <SearchBar onSearch={handleSearch} className="max-w-2xl" />
        </div>

        <p className="text-[11px] text-slate-500 italic max-w-2xl mx-auto font-mono">
          Research and educational use only. Information presented by this application is retrieved live from official external biological databases and should not be used for clinical diagnosis or medical decision-making.
        </p>
      </div>

      {/* Workflow Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-700" />
              <span>Bioinformatics Evidence Integration Workflow</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Unified transparent evidence resolution from sequence variant to structural interpretation.
            </p>
          </div>
          <span className="text-[11px] font-mono text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded border border-cyan-200 font-semibold self-start sm:self-auto">
            9-Stage Evidence Pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2 text-center pt-2">
          {workflowSteps.map((ws, i) => (
            <div key={ws.step} className="bg-slate-50 border border-slate-200 rounded p-2.5 flex flex-col items-center justify-between hover:border-cyan-400 transition-colors">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-cyan-400 text-[10px] font-bold font-mono flex items-center justify-center mb-1">
                {ws.step}
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono block leading-tight mb-0.5">
                {ws.title}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight">
                {ws.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Example Queries Section */}
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-700" />
            <span>Example Queries</span>
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Select any gene or variant identifier to launch live exploration
          </span>
        </div>

        {/* Subsection A: Example Cancer Genes */}
        <div>
          <h3 className="text-xs font-mono uppercase text-slate-500 font-bold mb-3">
            Example Cancer Genes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {exampleGenes.map((g) => (
              <div
                key={g.symbol}
                className="bg-white border border-slate-200 rounded-lg p-4 hover:border-cyan-500 transition-all flex flex-col justify-between shadow-2xs group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base font-bold text-slate-900 group-hover:text-cyan-800 transition-colors font-mono">
                      {g.symbol}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1">
                    {g.name}
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug mb-3">
                    {g.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-mono">
                  <button
                    onClick={() => navigate(`/gene/${encodeURIComponent(g.symbol)}`)}
                    className="text-cyan-700 font-semibold hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>Gene / {g.symbol}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subsection B: Example Specific Variants */}
        <div>
          <h3 className="text-xs font-mono uppercase text-slate-500 font-bold mb-3">
            Example Specific Variant Identifiers (rsID)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {exampleVariants.map((v) => (
              <div
                key={v.rsid}
                className="bg-white border border-slate-200 rounded-lg p-4 hover:border-cyan-500 transition-all flex flex-col justify-between shadow-2xs group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base font-bold text-cyan-800 font-mono">
                      {v.rsid}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {v.gene}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-900 block mb-1">
                    {v.change}
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug mb-3">
                    {v.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-mono">
                  <button
                    onClick={() => navigate(`/variant/${encodeURIComponent(v.rsid)}`)}
                    className="text-cyan-700 font-semibold hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>Explore / {v.rsid}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
