import { getStructuralContextForVariant } from './services/structureContextService.js';

export default async function handler(req, res) {
  try {
    const identifier = req.query.identifier || 'rs28934578';
    const result = await getStructuralContextForVariant({ rsid: identifier }, null);

    res.status(200).json({
      identifier,
      structuralContext: result,
      error: result.error || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || 'Error fetching 3D structural data'
    });
  }
}
