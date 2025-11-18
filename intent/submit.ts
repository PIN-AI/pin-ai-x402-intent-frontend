/**
 * Vercel Serverless Function: /api/intent/submit
 * Proxies requests to HTTP backend to solve Mixed Content issue
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND_URL = 'http://3.17.208.238:3000';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Payment-Signature'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const url = `${BACKEND_URL}/intent/submit`;
    console.log(`[Vercel Proxy] ${req.method} ${url}`);

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward important headers
    const forwardHeaders = [
      'authorization',
      'x-payment-signature',
      'x-api-version',
    ];

    forwardHeaders.forEach((headerName) => {
      const headerValue = req.headers[headerName];
      if (headerValue) {
        headers[headerName] = Array.isArray(headerValue) ? headerValue[0] : headerValue;
      }
    });

    // Make request to backend
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    console.log(`[Vercel Proxy] Backend response: ${response.status}`);

    // Forward response headers
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Handle 402 Payment Required (critical for x402 protocol)
    if (response.status === 402) {
      const body = await response.text();
      console.log('[Vercel Proxy] 402 Payment Required');
      return res.status(402).send(body);
    }

    // Forward response
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error: any) {
    console.error('[Vercel Proxy] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Proxy request failed',
    });
  }
}
