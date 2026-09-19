/**
 * Structure Service
 * Retrieves structural information from RCSB PDB (Experimental) and AlphaFold DB (Predicted)
 * using the resolved UniProt protein accession.
 */

const UNIPROT_BASE = 'https://rest.uniprot.org/uniprotkb';
const ALPHAFOLD_BASE = 'https://alphafold.ebi.ac.uk/api/prediction';

/**
 * Retrieve experimentally determined structures from RCSB PDB associated with the resolved UniProt accession.
 * @param {string} uniprotAccession 
 * @returns {Promise<{ isDemoData: boolean, pdbCount: number, structures: Array, error: string|null }>}
 */
export async function getPDBStructures(uniprotAccession) {
  if (!uniprotAccession || typeof uniprotAccession !== 'string') {
    return {
      isDemoData: false,
      pdbCount: 0,
      structures: [],
      error: 'Invalid or missing UniProt accession'
    };
  }

  const cleanAcc = uniprotAccession.trim().toUpperCase();
  console.log(`[structureService.getPDBStructures] Querying RCSB PDB cross-references for UniProt: ${cleanAcc}`);

  try {
    const url = `${UNIPROT_BASE}/${encodeURIComponent(cleanAcc)}.json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) {
      if (res.status === 404) {
        return { isDemoData: false, pdbCount: 0, structures: [], error: 'UniProt record not found' };
      }
      return { isDemoData: false, pdbCount: 0, structures: [], error: `UniProt API error: ${res.status}` };
    }

    const entry = await res.json();
    const dbXrefs = entry.uniProtKBCrossReferences || [];
    const pdbXrefs = dbXrefs.filter(ref => ref.database === 'PDB');

    const structures = pdbXrefs.map(ref => {
      const pdbId = ref.id;
      const props = ref.properties || [];
      const getProp = (key) => props.find(p => p.key === key)?.value || 'N/A';

      const rawMethod = getProp('Method');
      const rawResolution = getProp('Resolution');
      const rawChains = getProp('Chains');

      // Formatting resolution
      let resolution = 'N/A';
      if (rawResolution && rawResolution !== '-') {
        resolution = rawResolution.endsWith('A') || rawResolution.endsWith('Å')
          ? rawResolution.replace(/A$/, ' Å')
          : `${rawResolution} Å`;
      }

      // Formatting coverage from chains
      let coverage = 'Full / Partial';
      if (rawChains && rawChains !== '-') {
        coverage = `Chains ${rawChains}`;
      }

      return {
        pdbId,
        method: rawMethod !== '-' ? rawMethod : 'Experimental',
        resolution,
        coverage,
        url: `https://www.rcsb.org/structure/${pdbId}`,
        isExperimental: true
      };
    });

    console.log(`[structureService.getPDBStructures] Found ${structures.length} PDB entries for ${cleanAcc}`);

    return {
      isDemoData: false,
      pdbCount: structures.length,
      structures,
      error: null
    };
  } catch (err) {
    console.warn(`[structureService.getPDBStructures Warning] PDB lookup failed for ${cleanAcc}:`, err.message);
    return {
      isDemoData: false,
      pdbCount: 0,
      structures: [],
      error: 'RCSB PDB structural data is temporarily unavailable.'
    };
  }
}

/**
 * Retrieve computationally predicted structure details from AlphaFold DB for the resolved UniProt accession.
 * @param {string} uniprotAccession 
 * @returns {Promise<{ isDemoData: boolean, modelAvailable: boolean, alphafold: Object|null, error: string|null }>}
 */
export async function getAlphaFoldStructure(uniprotAccession) {
  if (!uniprotAccession || typeof uniprotAccession !== 'string') {
    return {
      isDemoData: false,
      modelAvailable: false,
      alphafold: null,
      error: 'Invalid or missing UniProt accession'
    };
  }

  const cleanAcc = uniprotAccession.trim().toUpperCase();
  console.log(`[structureService.getAlphaFoldStructure] Querying AlphaFold DB for UniProt: ${cleanAcc}`);

  try {
    const url = `${ALPHAFOLD_BASE}/${encodeURIComponent(cleanAcc)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CGVE-GeneExplorer/1.0'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (res.status === 404) {
      console.log(`[structureService.getAlphaFoldStructure] No AlphaFold model for ${cleanAcc}`);
      return {
        isDemoData: false,
        modelAvailable: false,
        alphafold: null,
        error: null
      };
    }

    if (!res.ok) {
      return {
        isDemoData: false,
        modelAvailable: false,
        alphafold: null,
        error: `AlphaFold API status ${res.status}`
      };
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return {
        isDemoData: false,
        modelAvailable: false,
        alphafold: null,
        error: null
      };
    }

    const model = data[0];
    const globalPlddt = typeof model.globalMetricValue === 'number' ? Math.round(model.globalMetricValue * 10) / 10 : null;

    let confidenceCategory = 'N/A';
    if (globalPlddt !== null) {
      if (globalPlddt >= 90) confidenceCategory = 'Very High (pLDDT > 90)';
      else if (globalPlddt >= 70) confidenceCategory = 'Confident (70 < pLDDT ≤ 90)';
      else if (globalPlddt >= 50) confidenceCategory = 'Low (50 < pLDDT ≤ 70)';
      else confidenceCategory = 'Very Low (pLDDT ≤ 50)';
    }

    const start = model.uniprotStart || 1;
    const end = model.uniprotEnd || 'end';
    const coverage = `Residues ${start}-${end}`;

    const alphafoldData = {
      modelAvailable: true,
      entryId: model.entryId || `AF-${cleanAcc}-F1`,
      uniprotAccession: cleanAcc,
      globalPlddt,
      confidenceCategory,
      coverage,
      cifUrl: model.cifUrl || null,
      pdbUrl: model.pdbUrl || null,
      bcifUrl: model.bcifUrl || null,
      entryUrl: `https://alphafold.ebi.ac.uk/entry/${cleanAcc}`,
      isPredicted: true
    };

    console.log(`[structureService.getAlphaFoldStructure] Retrieved AlphaFold model ${alphafoldData.entryId} for ${cleanAcc}`);

    return {
      isDemoData: false,
      modelAvailable: true,
      alphafold: alphafoldData,
      error: null
    };
  } catch (err) {
    console.warn(`[structureService.getAlphaFoldStructure Warning] AlphaFold lookup failed for ${cleanAcc}:`, err.message);
    return {
      isDemoData: false,
      modelAvailable: false,
      alphafold: null,
      error: 'AlphaFold structural data is temporarily unavailable.'
    };
  }
}
