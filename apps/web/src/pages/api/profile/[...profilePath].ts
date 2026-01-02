import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

/**
 * Proxy handler for profile endpoints
 * Reads API keys from server-side .env and forwards them to backend
 * Users never see the API keys in their browser
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { profilePath } = req.query;
  
  if (!profilePath || !Array.isArray(profilePath)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request path',
    });
  }

  // Reconstruct the path
  const path = profilePath.join('/');
  const url = `${BACKEND_API_URL}/api/profile/${path}`;

  try {
    // Forward the request to the backend API with authentication
    const headers: any = {
      'User-Agent': req.headers['user-agent'] || 'Vantage-Web',
      'X-Forwarded-For': req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
    };

    // Add API keys from environment (server-side only, never exposed to browser)
    if (process.env.STEAM_API_KEY) {
      headers['X-Steam-Api-Key'] = process.env.STEAM_API_KEY;
    }
    if (process.env.FACEIT_API_KEY) {
      headers['X-Faceit-Api-Key'] = process.env.FACEIT_API_KEY;
    }
    if (process.env.LEETIFY_API_KEY) {
      headers['X-Leetify-Api-Key'] = process.env.LEETIFY_API_KEY;
    }

    // Include recaptcha token if present
    const queryParams = new URLSearchParams();
    if (req.query.recaptcha_token) {
      queryParams.set('recaptcha_token', req.query.recaptcha_token as string);
    }

    const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;

    if (req.method === 'GET') {
      const response = await axios.get(fullUrl, { headers });
      return res.status(response.status).json(response.data);
    } else if (req.method === 'POST') {
      const response = await axios.post(fullUrl, req.body, { headers });
      return res.status(response.status).json(response.data);
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
      });
    }
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
