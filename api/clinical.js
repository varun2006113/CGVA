import { getClinVarForVariant } from './services/clinvarService.js';

export default async function handler(req, res) {
  try {
    const identifier = req.query.identifier || 'rs28934578';
    const result = await getClinVarForVariant({ rsid: identifier });

    res.status(200).json({
      identifier,
      records: result.records || [],
      totalCount: result.totalCount || 0,
      error: result.error || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || 'Error fetching ClinVar clinical evidence'
    });
  }
}
