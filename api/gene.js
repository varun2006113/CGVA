import { getGeneInfo } from './services/ncbiService.js';
import { getClinVarVariantsForGene } from './services/clinvarService.js';
import { getProteinForGene } from './services/uniprotService.js';
import { getPDBStructures, getAlphaFoldStructure } from './services/structureService.js';

export default async function handler(req, res) {
  try {
    const symbol = req.query.symbol || req.query.query;
    if (!symbol) {
      return res.status(400).json({
        error: 'Missing gene symbol parameter'
      });
    }

    // 1. Fetch NCBI Gene Information
    const result = await getGeneInfo(symbol);

    if (!result || result.error || !result.data) {
      return res.status(404).json({
        query: symbol,
        isDemoData: false,
        gene: null,
        clinvar: null,
        protein: null,
        structures: null,
        error: result?.error || 'NCBI gene data temporarily unavailable'
      });
    }

    // 2. Fetch ClinVar Variants for the Gene (Decoupled so ClinVar errors don't break gene info)
    let clinvarResult = null;
    try {
      clinvarResult = await getClinVarVariantsForGene(symbol, 25);
    } catch (cErr) {
      console.warn(`[api/gene.js] ClinVar lookup warning for "${symbol}":`, cErr.message);
      clinvarResult = {
        isDemoData: false,
        totalCount: 0,
        returnedCount: 0,
        variants: [],
        error: 'ClinVar data is temporarily unavailable.'
      };
    }

    // 3. Fetch UniProt Protein Information for the Gene (Decoupled so UniProt errors don't break gene/ClinVar info)
    let proteinResult = null;
    try {
      proteinResult = await getProteinForGene(symbol);
    } catch (pErr) {
      console.warn(`[api/gene.js] UniProt lookup warning for "${symbol}":`, pErr.message);
      proteinResult = {
        isDemoData: false,
        protein: null,
        error: 'UniProt protein data is temporarily unavailable.'
      };
    }

    // 4. Fetch Structural Information (PDB & AlphaFold) using resolved UniProt accession (Decoupled)
    let structuresResult = {
      pdb: { isDemoData: false, pdbCount: 0, structures: [], error: 'UniProt accession not resolved' },
      alphafold: { isDemoData: false, modelAvailable: false, alphafold: null, error: 'UniProt accession not resolved' }
    };

    const resolvedAccession = proteinResult?.protein?.accession;
    if (resolvedAccession) {
      try {
        const [pdbRes, afRes] = await Promise.all([
          getPDBStructures(resolvedAccession),
          getAlphaFoldStructure(resolvedAccession)
        ]);
        structuresResult = {
          pdb: pdbRes,
          alphafold: afRes
        };
      } catch (sErr) {
        console.warn(`[api/gene.js] Structural data lookup warning for accession "${resolvedAccession}":`, sErr.message);
        structuresResult = {
          pdb: { isDemoData: false, pdbCount: 0, structures: [], error: 'RCSB PDB structural data is temporarily unavailable.' },
          alphafold: { isDemoData: false, modelAvailable: false, alphafold: null, error: 'AlphaFold structural data is temporarily unavailable.' }
        };
      }
    }

    return res.status(200).json({
      query: symbol,
      isDemoData: false,
      gene: result.data,
      clinvar: clinvarResult,
      protein: proteinResult?.protein || null,
      proteinError: proteinResult?.error || null,
      structures: structuresResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'NCBI gene data temporarily unavailable'
    });
  }
}



