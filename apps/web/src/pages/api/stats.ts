import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

/**
 * Proxy handler for stats endpoint
 * Keeps API keys server-side and prevents exposure to clients
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const url = `${BACKEND_API_URL}/api/stats`;

  try {
    const headers: any = {
      'User-Agent': req.headers['user-agent'] || 'Vantage-Web',
    };

    // Add API key if configured
    if (INTERNAL_API_KEY) {
      headers['X-API-Key'] = INTERNAL_API_KEY;
    }

    const response = await axios.get(url, { headers });
    return res.status(response.status).json(response.data);
  } catch (error: any) {
    // Forward error responses from backend
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    // Handle network errors
    console.error('Backend API error:', error.message);
    return res.status(503).json({
      success: false,
      error: 'Backend service unavailable',
    });
  }
}
