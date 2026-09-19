import { getPDBStructures, getAlphaFoldStructure } from './structureService.js';

/**
 * Parses chain coverage string from UniProt PDB cross-references
 * e.g. "A/C=95-292", "A=1-100, B=101-200"
 */
export function parsePdbChainCoverage(chainsStr, residuePos) {
  if (!chainsStr || chainsStr === '-' || typeof residuePos !== 'number' || isNaN(residuePos)) {
    return { isCovered: false, coveredChains: [], ranges: [] };
  }

  const segments = chainsStr.split(',');
  const coveredChains = [];
  const ranges = [];
  let isCovered = false;

  for (const seg of segments) {
    const trimmed = seg.trim();
    const parts = trimmed.split('=');
    if (parts.length === 2) {
      const chains = parts[0].split('/').map(c => c.trim()).filter(Boolean);
      const rangeParts = parts[1].split('-').map(r => parseInt(r.trim(), 10));
      if (rangeParts.length === 2 && !isNaN(rangeParts[0]) && !isNaN(rangeParts[1])) {
        const start = rangeParts[0];
        const end = rangeParts[1];
        ranges.push({ chains, start, end });

        if (residuePos >= start && residuePos <= end) {
          isCovered = true;
          chains.forEach(c => {
            if (!coveredChains.includes(c)) coveredChains.push(c);
          });
        }
      }
    }
  }

  return { isCovered, coveredChains, ranges };
}

/**
 * Fetch residue-specific pLDDT from AlphaFold confidence JSON
 */
export async function getResiduePlddt(plddtDocUrl, residuePos) {
  if (!plddtDocUrl || typeof residuePos !== 'number' || isNaN(residuePos) || residuePos < 1) {
    return { score: null, category: null, status: 'Residue-specific confidence unavailable' };
  }

  try {
    const res = await fetch(plddtDocUrl, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) {
      return { score: null, category: null, status: 'Residue-specific confidence unavailable' };
    }

    const json = await res.json();
    const scores = json.confidenceScore;
    if (Array.isArray(scores) && scores.length >= residuePos) {
      const rawScore = scores[residuePos - 1]; // 1-indexed to 0-indexed
      if (typeof rawScore === 'number' && !isNaN(rawScore)) {
        const score = Math.round(rawScore * 10) / 10;
        let category = 'N/A';
        if (score >= 90) category = 'Very High (pLDDT > 90)';
        else if (score >= 70) category = 'Confident (70 < pLDDT ≤ 90)';
        else if (score >= 50) category = 'Low (50 < pLDDT ≤ 70)';
        else category = 'Very Low / Disordered (pLDDT ≤ 50)';

        return { score, category, status: 'Available' };
      }
    }
  } catch (err) {
    console.warn('[structureContextService Warning] Residue pLDDT fetch failed:', err.message);
  }

  return { score: null, category: null, status: 'Residue-specific confidence unavailable' };
}

/**
 * Build Stage 8 Structural Context for a specific variant
 */
export async function getStructuralContextForVariant(resolvedVariant, proteinContextResult) {
  if (!resolvedVariant || !proteinContextResult) {
    return {
      uniprotAccession: null,
      summary: null,
      alleleStructuralMappings: [],
      coveringPdbStructures: [],
      nonCoveringPdbStructures: [],
      totalPdbCount: 0,
      alphafold: null,
      error: 'Variant or protein context unavailable'
    };
  }

  const uniprotAccession = proteinContextResult.protein?.accession || null;
  const mappings = proteinContextResult.mappings || [];

  if (!uniprotAccession) {
    return {
      uniprotAccession: null,
      summary: null,
      alleleStructuralMappings: [],
      coveringPdbStructures: [],
      nonCoveringPdbStructures: [],
      totalPdbCount: 0,
      alphafold: null,
      error: 'Residue-specific structural mapping unavailable because no protein context is available.'
    };
  }

  console.log(`[structureContextService] Resolving structural context for UniProt: ${uniprotAccession}`);

  // 1. Fetch experimental PDB structures and AlphaFold structure for UniProt accession
  const [pdbRes, afRes] = await Promise.all([
    getPDBStructures(uniprotAccession).catch(() => ({ structures: [], pdbCount: 0 })),
    getAlphaFoldStructure(uniprotAccession).catch(() => ({ alphafold: null }))
  ]);

  const allPdbs = pdbRes.structures || [];
  const afData = afRes.alphafold || null;

  // Extract primary variant residue position
  const primaryPos = mappings.find(m => typeof m.position === 'number')?.position || null;

  if (primaryPos === null) {
    return {
      uniprotAccession,
      summary: {
        totalPdbCount: allPdbs.length,
        coveringPdbCount: 0,
        alphafoldAvailable: !!afData,
        alphafoldResidueCovered: false,
        primaryPosition: null,
        message: 'Residue-specific structural mapping unavailable because no protein-level consequence is available for this representation.'
      },
      alleleStructuralMappings: [],
      coveringPdbStructures: [],
      nonCoveringPdbStructures: allPdbs,
      totalPdbCount: allPdbs.length,
      alphafold: afData,
      error: null
    };
  }

  // 2. Map PDB Coverage for primary residue position
  const coveringPdbStructures = [];
  const nonCoveringPdbStructures = [];

  for (const pdb of allPdbs) {
    const rawCoverageStr = pdb.coverage?.replace(/^Chains\s+/, '') || '';
    const cov = parsePdbChainCoverage(rawCoverageStr, primaryPos);

    if (cov.isCovered) {
      coveringPdbStructures.push({
        ...pdb,
        isCovered: true,
        coveredChains: cov.coveredChains.join(', ') || 'N/A'
      });
    } else {
      nonCoveringPdbStructures.push({
        ...pdb,
        isCovered: false,
        coveredChains: 'None'
      });
    }
  }

  // 3. Map AlphaFold Coverage & Fetch Per-Residue pLDDT
  let afResidueContext = {
    isCovered: false,
    residuePosition: primaryPos,
    residuePlddt: null,
    residueCategory: null,
    status: 'AlphaFold model unavailable'
  };

  if (afData) {
    // Determine if primaryPos is within AlphaFold model coverage
    const coverageMatch = afData.coverage?.match(/(\d+)-(\d+)/);
    let start = 1;
    let end = 10000;
    if (coverageMatch) {
      start = parseInt(coverageMatch[1], 10);
      end = parseInt(coverageMatch[2], 10);
    }

    const isAfCovered = primaryPos >= start && primaryPos <= end;

    let resPlddtObj = { score: null, category: null, status: 'Residue-specific confidence unavailable' };
    if (isAfCovered && afData.entryId) {
      // Construct plddtDocUrl from AlphaFold entryId
      const plddtDocUrl = `https://alphafold.ebi.ac.uk/files/${afData.entryId}-confidence_v6.json`;
      resPlddtObj = await getResiduePlddt(plddtDocUrl, primaryPos);
    }

    afResidueContext = {
      isCovered: isAfCovered,
      residuePosition: primaryPos,
      residuePlddt: resPlddtObj.score,
      residueCategory: resPlddtObj.category,
      status: resPlddtObj.status
    };
  }

  // 4. Multi-Allelic Allele Structural Mappings
  const alleleStructuralMappings = mappings.map(m => {
    const pos = m.position;
    let pdbCoveredCount = 0;
    let isCoveredByPdb = false;

    if (typeof pos === 'number') {
      const posPdbs = allPdbs.filter(p => {
        const rawChains = p.coverage?.replace(/^Chains\s+/, '') || '';
        return parsePdbChainCoverage(rawChains, pos).isCovered;
      });
      pdbCoveredCount = posPdbs.length;
      isCoveredByPdb = pdbCoveredCount > 0;
    }

    return {
      allele: m.allele,
      proteinHgvs: m.proteinHgvs,
      codingHgvs: m.codingHgvs,
      position: pos,
      referenceAA: m.referenceAA1 || m.referenceAA,
      alternateAA: m.alternateAA1 || m.alternateAA,
      consequence: m.consequence,
      pdbCoveredCount,
      totalPdbCount: allPdbs.length,
      isCoveredByPdb,
      isCoveredByAlphaFold: afResidueContext.isCovered,
      residuePlddt: afResidueContext.residuePosition === pos ? afResidueContext.residuePlddt : null,
      residueCategory: afResidueContext.residuePosition === pos ? afResidueContext.residueCategory : null
    };
  });

  return {
    uniprotAccession,
    summary: {
      primaryPosition: primaryPos,
      totalPdbCount: allPdbs.length,
      coveringPdbCount: coveringPdbStructures.length,
      alphafoldAvailable: !!afData,
      alphafoldResidueCovered: afResidueContext.isCovered,
      residuePlddt: afResidueContext.residuePlddt,
      residueCategory: afResidueContext.residueCategory,
      residuePlddtStatus: afResidueContext.status
    },
    alleleStructuralMappings,
    coveringPdbStructures,
    nonCoveringPdbStructures,
    totalPdbCount: allPdbs.length,
    alphafold: afData ? {
      ...afData,
      residueContext: afResidueContext
    } : null,
    error: null
  };
}
