/**
 * BookMyRecords Business Health Assessment API
 * Health Check & Liveness Endpoint
 * 
 * Vercel Serverless Function (Node.js)
 */

'use strict';

const ai = require('./ai');

module.exports = function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle GET request
  if (req.method === 'GET' || req.method === 'HEAD') {
    const enabled = ai.isAiEnabled();

    res.status(200).json({
      status: 'ok',
      service: 'BookMyRecords Business Health API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      engine: 'Node.js Serverless Runtime',
      ai_mode: enabled ? 'live_ai' : 'synthetic_mock',
      provider: enabled ? ai.getEngineLabel() : 'synthetic_generator',
      environment: process.env.NODE_ENV || 'production'
    });
    return;
  }

  // Reject unsupported methods
  res.setHeader('Allow', 'GET, OPTIONS');
  res.status(405).json({
    error: 'Method Not Allowed',
    message: `HTTP ${req.method} is not supported on this endpoint. Use GET.`
  });
};
