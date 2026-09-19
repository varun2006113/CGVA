import { getGeneAnalytics } from './services/analyticsService.js';

export default async function handler(req, res) {
  try {
    const rawSymbol = req.query.symbol || req.query.query;
    if (!rawSymbol) {
      return res.status(400).json({ error: 'Missing gene symbol query parameter' });
    }

    const symbol = String(rawSymbol).toUpperCase().trim();
    const limit = parseInt(req.query.limit, 10) || 50;

    console.log(`[API /api/gene/:symbol/analytics] Fetching live analytics for symbol: "${symbol}" (limit: ${limit})`);

    const analytics = await getGeneAnalytics(symbol, limit);

    return res.status(200).json({
      ...analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[API /api/gene/analytics Error]:`, error);
    res.status(500).json({
      error: error.message || 'Error generating gene analytics'
    });
  }
}

