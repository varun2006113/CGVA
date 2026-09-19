import React, { useState } from 'react';
import { Box, ExternalLink, Eye, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export default function StructurePanel({ structureData, consequenceData }) {
  const [activeTab, setActiveTab] = useState('alphafold');
  const [showModal, setShowModal] = useState(false);
  const [selectedPdb, setSelectedPdb] = useState(null);

  const pdbList = structureData?.pdb || [];
  const alphafold = structureData?.alphafold || null;
  const variantPos = consequenceData?.position || 175;
  const uniprotId = alphafold?.uniprotId || 'P04637';

  // Current PDB target for 3D viewer (defaults to first PDB if available, or 1TSR)
  const activePdbId = selectedPdb || (pdbList.length > 0 ? pdbList[0].id : '1TSR');

  // Build official NCBI iCn3D 3D WebGL viewer URL (NCBI official open 3D viewer)
  const icn3dViewerUrl = activeTab === 'alphafold'
    ? `https://www.ncbi.nlm.nih.gov/Structure/icn3d/full.html?afid=${uniprotId}&select=:${variantPos}&showhotspot=1`
    : `https://www.ncbi.nlm.nih.gov/Structure/icn3d/full.html?pdbid=${activePdbId}&select=:${variantPos}&showhotspot=1`;

  const alphafoldEntryUrl = alphafold?.entryUrl || `https://alphafold.ebi.ac.uk/entry/${uniprotId}`;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Box className="w-4 h-4 text-cyan-700" />
          <span>3D Structural Context</span>
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(!showModal)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-cyan-800 transition-colors shadow-xs"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>{showModal ? 'Close 3D Viewer' : 'Open 3D Structure Viewer'}</span>
          </button>
        </div>
      </div>

      {/* Tabs for PDB vs AlphaFold */}
      <div className="flex border-b border-slate-200 mb-4 gap-2">
        <button
          onClick={() => setActiveTab('alphafold')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t border-t border-x ${activeTab === 'alphafold' ? 'bg-white text-cyan-800 border-slate-200 -mb-px font-bold' : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100'}`}
        >
          Predicted Structure (AlphaFold DB)
        </button>
        <button
          onClick={() => setActiveTab('pdb')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t border-t border-x ${activeTab === 'pdb' ? 'bg-white text-cyan-800 border-slate-200 -mb-px font-bold' : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100'}`}
        >
          Experimental Structures (RCSB PDB) ({pdbList.length})
        </button>
      </div>

      {/* AlphaFold Tab */}
      {activeTab === 'alphafold' && (
        <div>
          {alphafold ? (
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-900 block">
                    AlphaFold Model: AF-{uniprotId}-F1
                  </span>
                  <span className="text-xs text-slate-500 font-sans">
                    Average pLDDT Confidence Score: <strong className="text-emerald-700 font-mono">{alphafold.plddtAverage || 88.4}</strong> / 100
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={alphafoldEntryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-cyan-700 bg-white border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-100 transition-colors shadow-2xs"
                  >
                    <span>AlphaFold DB Entry</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Confidence legend */}
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 bg-white p-2.5 rounded border border-slate-200/80">
                <span className="font-semibold text-slate-700">pLDDT Spectrum:</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">Very High (&gt;90)</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-900">Confident (70-90)</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">Low (50-70)</span>
              </div>
            </div>
          ) : (
            <div className="p-4 text-xs text-slate-500 italic bg-slate-50 rounded border border-slate-200">
              AlphaFold predicted structure data unavailable for this accession.
            </div>
          )}
        </div>
      )}

      {/* PDB Tab */}
      {activeTab === 'pdb' && (
        <div>
          {pdbList && pdbList.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">PDB ID</th>
                    <th className="py-2.5 px-3">Structure Title</th>
                    <th className="py-2.5 px-3">Resolution</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">3D Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {pdbList.map((pdb) => (
                    <tr key={pdb.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-cyan-800">{pdb.id}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-800">{pdb.title}</td>
                      <td className="py-2.5 px-3 text-slate-700">{pdb.resolution}</td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] font-sans">{pdb.method}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPdb(pdb.id);
                              setShowModal(true);
                            }}
                            className="px-2 py-0.5 bg-slate-900 text-white font-sans text-[11px] rounded hover:bg-cyan-800"
                          >
                            View 3D
                          </button>
                          <a
                            href={`https://www.rcsb.org/structure/${pdb.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-cyan-700 hover:underline font-sans text-[11px]"
                          >
                            <span>RCSB</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-xs text-slate-500 italic bg-slate-50 rounded border border-slate-200">
              No experimental PDB structures found matching this target.
            </div>
          )}
        </div>
      )}

      {/* 3D Structure Interactive Viewer Container */}
      {showModal && (
        <div className="mt-6 border-2 border-slate-300 rounded-lg bg-slate-900 p-4 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 pb-2 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-cyan-400" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
                Interactive 3D WebGL Protein Structure Viewer (NCBI iCn3D Engine)
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                ★ Residue {variantPos}
              </span>
              <button
                onClick={() => setShowModal(false)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded"
              >
                Close Viewer
              </button>
            </div>
          </div>

          {/* Embedded iCn3D 3D WebGL Canvas Frame */}
          <div className="w-full h-96 bg-slate-950 rounded border border-slate-800 relative overflow-hidden">
            <iframe
              src={icn3dViewerUrl}
              title="Interactive 3D WebGL Structure Viewer"
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 font-mono gap-2">
            <span>Target Model: {activeTab === 'alphafold' ? `AlphaFold AF-${uniprotId}-F1` : `PDB ${activePdbId}`}</span>
            <div className="flex items-center gap-3">
              <a
                href={alphafoldEntryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>AlphaFold Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={`https://www.rcsb.org/structure/${activePdbId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>RCSB PDB {activePdbId} Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
