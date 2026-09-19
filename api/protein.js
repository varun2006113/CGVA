import { getProteinForGene } from './services/uniprotService.js';

export default async function handler(req, res) {
  try {
    const symbol = req.query.symbol || req.query.identifier || 'TP53';
    const result = await getProteinForGene(symbol);

    res.status(200).json({
      query: symbol,
      protein: result.protein || null,
      error: result.error || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || 'Error fetching UniProt protein context'
    });
  }
}
