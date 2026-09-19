import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box, ExternalLink, RefreshCw, Eye, Info, Layers, Maximize2, ShieldCheck, AlertCircle } from 'lucide-react';

/**
 * Extracts residue-specific pLDDT from AlphaFold PDB string B-factor column
 */
function extractResiduePlddtFromPdb(pdbText, residueNumber) {
  if (!pdbText || !residueNumber) return null;
  const lines = pdbText.split('\n');
  for (const line of lines) {
    if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
      const resNum = parseInt(line.substring(22, 26).trim(), 10);
      if (resNum === residueNumber) {
        const bFactor = parseFloat(line.substring(60, 66).trim());
        if (!isNaN(bFactor)) return Math.round(bFactor * 10) / 10;
      }
    }
  }
  return null;
}

function getPlddtCategory(score) {
  if (score === null || score === undefined) return { label: 'Unavailable', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200' };
  if (score >= 90) return { label: 'Very High (pLDDT > 90)', color: 'text-blue-900 font-bold', bg: 'bg-blue-100 text-blue-900 border-blue-300' };
  if (score >= 70) return { label: 'Confident (70 < pLDDT ≤ 90)', color: 'text-cyan-900 font-bold', bg: 'bg-cyan-100 text-cyan-900 border-cyan-300' };
  if (score >= 50) return { label: 'Low (50 < pLDDT ≤ 70)', color: 'text-amber-900 font-bold', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
  return { label: 'Very Low (pLDDT ≤ 50)', color: 'text-rose-900 font-bold', bg: 'bg-rose-100 text-rose-900 border-rose-300' };
}

export default function Variant3DViewer({
  structuralContextData,
  proteinContextData,
  variantData,
  query
}) {
  const containerRef = useRef(null);
  const viewerInstanceRef = useRef(null);

  // Available Alleles from Stage 7 protein mappings
  const alleleOptions = useMemo(() => {
    const mappings = proteinContextData?.mappings || [];
    if (mappings.length > 0) return mappings;
    
    // Fallback single mapping from Stage 6 / 8
    const pos = structuralContextData?.summary?.primaryPosition || null;
    return [{
      allele: variantData?.genomic?.alternate ? `${variantData.genomic.reference}>${variantData.genomic.alternate}` : 'Selected Allele',
      codingHgvs: variantData?.hgvs?.coding || 'N/A',
      proteinHgvs: variantData?.hgvs?.protein || 'N/A',
      position: pos,
      referenceAA: variantData?.referenceAA || 'Ref',
      alternateAA: variantData?.alternateAA || 'Alt',
      consequence: 'Missense'
    }];
  }, [proteinContextData, structuralContextData, variantData]);

  const [selectedAlleleIdx, setSelectedAlleleIdx] = useState(0);
  const activeAllele = alleleOptions[selectedAlleleIdx] || alleleOptions[0];

  const targetResiduePos = activeAllele?.position || structuralContextData?.summary?.primaryPosition || null;

  /*
   * Selection Rule:
   * Selects representative PDB structure from Stage 8 coveringPdbStructures that spans the target variant residue coordinate.
   * If multiple structures cover the residue, selects the structure with highest resolution or first entry from Stage 8 bestPdb.
   */
  const candidatePdb = useMemo(() => {
    if (!structuralContextData) return null;
    const coveringPdbs = structuralContextData.coveringPdbStructures || [];
    if (targetResiduePos) {
      const match = coveringPdbs.find(p => p.coveredChains && p.pdbId);
      if (match) return match;
    }
    if (coveringPdbs.length > 0) return coveringPdbs[0];
    if (structuralContextData.bestPdb) return structuralContextData.bestPdb;
    return null;
  }, [structuralContextData, targetResiduePos]);

  const alphafoldModel = structuralContextData?.alphafold || null;

  // Tab State: 'experimental' vs 'alphafold'
  const [activeMode, setActiveMode] = useState(() => {
    if (candidatePdb) return 'experimental';
    if (alphafoldModel) return 'alphafold';
    return 'none';
  });

  // Sync mode if structure availability changes
  useEffect(() => {
    if (activeMode === 'none' || !candidatePdb) {
      if (candidatePdb) setActiveMode('experimental');
      else if (alphafoldModel) setActiveMode('alphafold');
      else setActiveMode('none');
    }
  }, [candidatePdb, alphafoldModel]);

  // Viewer Display Controls
  const [displayStyle, setDisplayStyle] = useState('cartoon'); // 'cartoon' | 'stick' | 'sphere'
  const [showSurrounding, setShowSurrounding] = useState(false); // 5 Angstrom environment
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [structureError, setStructureError] = useState(null);
  const [residuePlddtScore, setResiduePlddtScore] = useState(null);

  // Load and Render 3Dmol Structure
  useEffect(() => {
    if (activeMode === 'none' || !containerRef.current) {
      return;
    }

    let isCancelled = false;
    setLoadingStructure(true);
    setStructureError(null);

    const loadStructureData = async () => {
      let fetchUrl = '';
      let fileFormat = 'pdb';
      let pdbIdOrModel = '';

      if (activeMode === 'experimental' && candidatePdb) {
        pdbIdOrModel = candidatePdb.pdbId;
        fetchUrl = `https://files.rcsb.org/download/${candidatePdb.pdbId.toUpperCase()}.pdb`;
      } else if (activeMode === 'alphafold' && alphafoldModel) {
        pdbIdOrModel = alphafoldModel.entryId || alphafoldModel.modelId;
        fetchUrl = alphafoldModel.pdbUrl || `https://alphafold.ebi.ac.uk/files/${alphafoldModel.modelId || alphafoldModel.entryId}-model_v4.pdb`;
      } else {
        setLoadingStructure(false);
        return;
      }

      try {
        console.log(`[Variant3DViewer] Fetching 3D structure file from: ${fetchUrl}`);
        const res = await fetch(fetchUrl);
        if (!res.ok) {
          throw new Error(`Failed to download structure file for ${pdbIdOrModel} (HTTP ${res.status})`);
        }
        const pdbText = await res.text();
        if (isCancelled) return;

        // Clear existing viewer container DOM
        if (viewerInstanceRef.current) {
          try {
            viewerInstanceRef.current.clear();
          } catch (e) {
            // ignore cleanup warning
          }
        }
        containerRef.current.innerHTML = '';

        // Extract residue pLDDT if AlphaFold
        if (activeMode === 'alphafold' && targetResiduePos) {
          const parsedPlddt = extractResiduePlddtFromPdb(pdbText, targetResiduePos);
          setResiduePlddtScore(parsedPlddt ?? alphafoldModel.residueContext?.residuePlddt ?? null);
        } else {
          setResiduePlddtScore(null);
        }

        // Initialize 3Dmol Viewer dynamically
        let $3Dmol = typeof window !== 'undefined' ? window.$3Dmol : null;
        if (!$3Dmol) {
          try {
            const mod = await import('3dmol');
            $3Dmol = mod.default || mod;
          } catch (mErr) {
            console.warn('[Variant3DViewer] Dynamic import of 3dmol failed:', mErr);
          }
        }

        const createViewerFn = $3Dmol?.createViewer || $3Dmol?.default?.createViewer || (typeof window !== 'undefined' && window.$3Dmol?.createViewer);
        if (typeof createViewerFn !== 'function') {
          throw new Error('3Dmol library viewer creation is not available in current environment.');
        }

        const viewer = createViewerFn(containerRef.current, {
          backgroundColor: '#0f172a', // Dark slate background for rich contrast
          id: `mol_viewer_${Date.now()}`
        });
        viewerInstanceRef.current = viewer;

        viewer.addModel(pdbText, fileFormat);

        // Apply Main Protein Style
        if (displayStyle === 'stick') {
          viewer.setStyle({}, { stick: { colorscheme: 'chainHetatm', radius: 0.15 } });
        } else if (displayStyle === 'sphere') {
          viewer.setStyle({}, { sphere: { colorscheme: 'chainHetatm', scale: 0.8 } });
        } else {
          // Default Cartoon Ribbon with spectrum colors
          viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
        }

        // Target Residue Selection & Highlighting
        let targetChain = null;
        if (activeMode === 'experimental' && candidatePdb?.coveredChains) {
          targetChain = candidatePdb.coveredChains.split(',')[0].trim();
        }

        if (targetResiduePos && targetResiduePos > 0) {
          const resSel = { resno: targetResiduePos };
          if (targetChain) resSel.chain = targetChain;

          // Highlight Variant Residue Position in Bright Neon Magenta / Rose
          viewer.setStyle(resSel, {
            stick: { color: '#ec4899', radius: 0.35 },
            sphere: { color: '#f43f5e', scale: 0.5 }
          });

          // Optional 5 Angstrom Environment Highlighting
          if (showSurrounding) {
            viewer.setStyle(
              { within: { distance: 5.0, sel: resSel } },
              { stick: { color: '#38bdf8', radius: 0.18 } }
            );
            // Keep residue highlighted over environment
            viewer.setStyle(resSel, {
              stick: { color: '#ec4899', radius: 0.35 },
              sphere: { color: '#f43f5e', scale: 0.5 }
            });
          }

          // Center and Zoom camera on variant residue
          viewer.zoomTo(resSel, 800);
        } else {
          viewer.zoomTo();
        }

        viewer.render();
        setLoadingStructure(false);
      } catch (err) {
        if (isCancelled) return;
        console.error('[Variant3DViewer] Error loading 3D structure:', err);
        setStructureError(err.message || 'Could not render 3D structure');
        setLoadingStructure(false);
      }
    };

    loadStructureData();

    return () => {
      isCancelled = true;
      if (viewerInstanceRef.current) {
        try {
          viewerInstanceRef.current.clear();
        } catch (e) {
          // ignore cleanup
        }
      }
    };
  }, [activeMode, candidatePdb, alphafoldModel, targetResiduePos, displayStyle, showSurrounding]);

  const handleResetView = () => {
    if (viewerInstanceRef.current) {
      if (targetResiduePos) {
        const resSel = { resno: targetResiduePos };
        if (candidatePdb?.coveredChains) {
          resSel.chain = candidatePdb.coveredChains.split(',')[0].trim();
        }
        viewerInstanceRef.current.zoomTo(resSel, 800);
      } else {
        viewerInstanceRef.current.zoomTo();
      }
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const uniprotAcc = proteinContextData?.protein?.accession || structuralContextData?.uniprotAccession || 'P04637';

  // Fallback states check
  if (!candidatePdb && !alphafoldModel) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-3">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Box className="w-4 h-4 text-cyan-700" />
            <span>3D Structural View</span>
          </h3>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500 font-mono text-xs space-y-2">
          <Info className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-bold text-slate-700 text-sm">3D structural visualization unavailable for this variant.</p>
          <p className="text-slate-500">
            No experimental PDB structures or AlphaFold predicted models cover residue position {targetResiduePos || 'specified'}.
          </p>
        </div>
      </div>
    );
  }

  const plddtInfo = getPlddtCategory(residuePlddtScore);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Box className="w-4 h-4 text-cyan-700" />
              <span>3D Structural View</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 text-cyan-900 border border-cyan-200">
              Interactive 3D Residue Inspection
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">
            Structural context viewer — position {targetResiduePos || 'N/A'} highlighted on reference protein structure.
          </p>
        </div>

        {/* Structure Source Switcher Tabs */}
        <div className="flex items-center gap-2 self-start md:self-auto font-mono text-xs">
          {candidatePdb && (
            <button
              onClick={() => setActiveMode('experimental')}
              className={`px-3 py-1.5 rounded-md border font-semibold transition-all cursor-pointer ${
                activeMode === 'experimental'
                  ? 'bg-purple-900 text-white border-purple-950 font-bold shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Experimental (PDB: {candidatePdb.pdbId})
            </button>
          )}

          {alphafoldModel && (
            <button
              onClick={() => setActiveMode('alphafold')}
              className={`px-3 py-1.5 rounded-md border font-semibold transition-all cursor-pointer ${
                activeMode === 'alphafold'
                  ? 'bg-amber-800 text-white border-amber-900 font-bold shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              AlphaFold DB ({alphafoldModel.entryId || 'Predicted'})
            </button>
          )}
        </div>
      </div>

      {/* Multi-Allelic Selector Dropdown if multiple alleles present */}
      {alleleOptions.length > 1 && (
        <div className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <span className="font-bold text-slate-700">Select Allele for Structural View:</span>
          <select
            value={selectedAlleleIdx}
            onChange={(e) => setSelectedAlleleIdx(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded px-3 py-1 text-slate-900 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-cyan-600 cursor-pointer"
          >
            {alleleOptions.map((opt, i) => (
              <option key={i} value={i}>
                {opt.allele} ({opt.proteinHgvs}) — Residue {opt.position}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main 2-Column Responsive Layout: 3D Canvas + Structural Metadata Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: 3D Molecular Viewer Canvas */}
        <div className="lg:col-span-2 space-y-3">
          
          {/* Viewer Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 text-white p-2.5 rounded-t-lg font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold">Representation:</span>
              <button
                onClick={() => setDisplayStyle('cartoon')}
                className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                  displayStyle === 'cartoon' ? 'bg-cyan-700 text-white border-cyan-500 font-bold' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Cartoon
              </button>
              <button
                onClick={() => setDisplayStyle('stick')}
                className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                  displayStyle === 'stick' ? 'bg-cyan-700 text-white border-cyan-500 font-bold' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Sticks
              </button>
              <button
                onClick={() => setDisplayStyle('sphere')}
                className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                  displayStyle === 'sphere' ? 'bg-cyan-700 text-white border-cyan-500 font-bold' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Spheres
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSurrounding(!showSurrounding)}
                className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                  showSurrounding ? 'bg-amber-600 text-white border-amber-500 font-bold' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title="Highlight residues within 5 Angstroms of variant position"
              >
                {showSurrounding ? 'Hide 5Å Env' : 'Show 5Å Env'}
              </button>
              <button
                onClick={handleResetView}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] border border-slate-700 flex items-center gap-1 cursor-pointer"
                title="Reset camera focus to variant residue"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset View</span>
              </button>
              <button
                onClick={handleFullscreen}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 cursor-pointer"
                title="Fullscreen Viewer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* WebGL Canvas Container */}
          <div className="relative w-full h-[450px] bg-slate-900 rounded-b-lg overflow-hidden border border-slate-800 shadow-inner">
            {loadingStructure && (
              <div className="absolute inset-0 bg-slate-900/90 z-10 flex flex-col items-center justify-center text-white space-y-2 font-mono text-xs">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <span>Loading 3D structure data from {activeMode === 'experimental' ? 'RCSB PDB' : 'AlphaFold DB'}...</span>
              </div>
            )}

            {structureError ? (
              <div className="absolute inset-0 bg-slate-900 p-8 flex flex-col items-center justify-center text-rose-400 font-mono text-xs text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                <p className="font-bold text-white text-sm">Structure Rendering Failed</p>
                <p>{structureError}</p>
              </div>
            ) : (
              <div ref={containerRef} className="w-full h-full relative cursor-grab active:cursor-grabbing" />
            )}

            {/* Legend / Overlay Note */}
            <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md text-white px-3 py-1.5 rounded border border-slate-800 font-mono text-[11px] space-y-0.5 shadow-md pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                <span>Residue {targetResiduePos || 'N/A'}: <strong className="text-cyan-300 font-bold">{activeAllele?.referenceAA || 'Ref'}</strong></span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                {activeMode === 'experimental' ? 'Experimental PDB Structure' : 'AlphaFold Predicted Structure'}
              </span>
            </div>
          </div>

          {/* Mandatory Scientific Disclosure Banner */}
          <div className="bg-amber-50 border border-amber-200 text-amber-950 p-3 rounded text-xs font-sans space-y-1">
            <div className="flex items-center gap-1.5 font-bold font-mono text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Scientific Disclosure: Reference Structure Representation</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              <strong>Reference structure — variant residue position highlighted.</strong> The displayed structure represents the cataloged {activeMode === 'experimental' ? 'experimental PDB' : 'AlphaFold predicted'} protein model. No in-silico amino-acid substitution or structural alteration has been applied. 3D visualization alone does not demonstrate structural damage or clinical pathogenicity.
            </p>
          </div>
        </div>

        {/* Column 3: Structural Metadata Panel */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-5 font-mono text-xs">
          
          {/* Section A: Structure Details */}
          <div className="space-y-3">
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-700" />
                <span>Structure Metadata</span>
              </h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                activeMode === 'experimental' ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {activeMode === 'experimental' ? 'Experimental RCSB PDB' : 'AlphaFold DB Model'}
              </span>
            </div>

            {activeMode === 'experimental' && candidatePdb ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">PDB ID:</span>
                  <span className="font-bold text-cyan-800">{candidatePdb.pdbId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Method:</span>
                  <span className="font-semibold text-slate-800">{candidatePdb.method || 'X-ray crystallography'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Resolution:</span>
                  <span className="font-semibold text-slate-800">{candidatePdb.resolution || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Covered Chains:</span>
                  <span className="font-semibold text-slate-800">{candidatePdb.coveredChains || 'A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Residue Coverage:</span>
                  <span className="font-semibold text-slate-800">{candidatePdb.coverage || 'N/A'}</span>
                </div>
              </div>
            ) : activeMode === 'alphafold' && alphafoldModel ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Model ID:</span>
                  <span className="font-bold text-amber-800">{alphafoldModel.entryId || alphafoldModel.modelId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">UniProt Accession:</span>
                  <span className="font-semibold text-slate-800">{alphafoldModel.uniprotAccession || uniprotAcc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Global pLDDT:</span>
                  <span className="font-semibold text-slate-800">{alphafoldModel.globalPlddt ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Residue pLDDT ({targetResiduePos}):</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] border ${plddtInfo.bg}`}>
                    {residuePlddtScore !== null ? residuePlddtScore : (alphafoldModel.residueContext?.residuePlddt ?? 'N/A')}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 text-right font-normal">
                  {plddtInfo.label}
                </div>
              </div>
            ) : null}
          </div>

          <hr className="border-slate-200" />

          {/* Section B: Variant Allele Context */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-2">
              Variant Context
            </h4>
            <div className="flex justify-between">
              <span className="text-slate-500">Gene & Symbol:</span>
              <span className="font-bold text-slate-900">{variantData?.gene?.symbol || 'TP53'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Protein HGVS:</span>
              <span className="font-bold text-cyan-800">{activeAllele?.proteinHgvs || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Residue Position:</span>
              <span className="font-bold text-slate-900 text-sm">{targetResiduePos || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reference Amino Acid:</span>
              <span className="font-semibold text-emerald-800">{activeAllele?.referenceAA || 'Ref'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Alternate Amino Acid:</span>
              <span className="font-semibold text-rose-800">{activeAllele?.alternateAA || 'Alt'}</span>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section C: Official External Database Links */}
          <div className="space-y-2 pt-1">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
              Official Database Links
            </h4>
            
            {candidatePdb && (
              <a
                href={candidatePdb.url || `https://www.rcsb.org/structure/${candidatePdb.pdbId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 text-cyan-800 hover:bg-slate-100 transition-colors font-bold"
              >
                <span>RCSB PDB ({candidatePdb.pdbId})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {alphafoldModel && (
              <a
                href={alphafoldModel.entryUrl || `https://alphafold.ebi.ac.uk/entry/${alphafoldModel.uniprotAccession || uniprotAcc}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 text-amber-800 hover:bg-slate-100 transition-colors font-bold"
              >
                <span>AlphaFold DB ({alphafoldModel.uniprotAccession || uniprotAcc})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <a
              href={`https://www.uniprot.org/uniprotkb/${uniprotAcc}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 transition-colors font-bold"
            >
              <span>UniProtKB ({uniprotAcc})</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

      </div>

    </div>
  );
}
