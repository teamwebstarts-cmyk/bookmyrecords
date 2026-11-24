
// Global crash prevention for dev/production server stability
process.on('uncaughtException', (err) => {
  console.error('[BookMyRecords Server] Handled Uncaught Exception:', err.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[BookMyRecords Server] Handled Unhandled Rejection:', reason && reason.message ? reason.message : reason);
});

/**
 * BookMyRecords Production & Development API Server
 * Render-ready server providing:
 *   - POST /api/checkup/analyze
 *   - GET  /api/checkup/health
 *   - POST /api/checkup/submit
 *   - POST /api/checkup/booking
 *   - POST /api/checkup/booking-webhook
 *   - GET  /api/checkup/report/:id/pdf
 *   - GET  /api/checkup/report/:id/status
 *   - POST /api/admin/login
 *   - GET  /api/admin/leads
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const analyzeHandler = require('./api/checkup/analyze');
const healthHandler = require('./api/checkup/health');
const submitHandler = require('./api/checkup/submit');
const booking = require('./api/checkup/booking');
const storage = require('./api/checkup/storage');

// Dependency-free .env loader
function loadEnvFile() {
  try {
    const content = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch (_) { /* no .env file — environment variables only */ }
}
loadEnvFile();

const PORT = parseInt(process.env.PORT || '8765', 10);
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv; charset=utf-8'
};

function wrapResponse(res) {
  if (!res.status) {
    res.status = function (code) {
      this.statusCode = code;
      return this;
    };
  }
  if (!res.json) {
    res.json = function (obj) {
      this.setHeader('Content-Type', 'application/json; charset=utf-8');
      this.end(JSON.stringify(obj));
      return this;
    };
  }
  return res;
}

async function readRequestBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (_) {
    return { raw };
  }
}

const server = http.createServer(async (req, res) => {
  wrapResponse(res);

  // Enable Full CORS for Vercel Frontend and Client Deployments
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token, x-cal-signature');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, 'http://localhost');
  const pathname = parsedUrl.pathname;

  // 0. Public BookMyRecords chatbot API (same Node server; public-mode only)
  if (pathname === '/api/chat/message') {
    try {
      const chat = require('./api/chat');
      await chat.handleChat(req, res);
    } catch (err) {
      console.error('[Chatbot] route error:', err.name || 'Error');
      if (!res.writableEnded) res.status(500).json({ error: 'Chat service unavailable. Please try again.' });
    }
    return;
  }

  // 1. Core Checkup Endpoints
  if (pathname === '/api/checkup/analyze') {
    try {
      await analyzeHandler(req, res);
    } catch (err) {
      console.error('API Error /api/checkup/analyze:', err);
      if (!res.writableEnded) {
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
      }
    }
    return;
  }

  if (pathname === '/api/checkup/health') {
    try {
      await healthHandler(req, res);
    } catch (err) {
      console.error('API Error /api/checkup/health:', err);
      if (!res.writableEnded) {
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
      }
    }
    return;
  }

  if (pathname === '/api/checkup/submit') {
    try { await submitHandler(req, res); }
    catch (err) { console.error('API Error /api/checkup/submit:', err); if (!res.writableEnded) res.status(500).json({ error: 'Internal Server Error', message: err.message }); }
    return;
  }

  if (pathname === '/api/checkup/booking') {
    try { await booking.clientHandler(req, res); }
    catch (err) { console.error('API Error /api/checkup/booking:', err); if (!res.writableEnded) res.status(500).json({ error: 'Internal Server Error', message: err.message }); }
    return;
  }

  if (pathname === '/api/checkup/booking-webhook') {
    try { await booking.webhookHandler(req, res); }
    catch (err) { console.error('API Error /api/checkup/booking-webhook:', err); if (!res.writableEnded) res.status(500).json({ error: 'Internal Server Error', message: err.message }); }
    return;
  }

  // 2. Report PDF Serving
  const reportPdfMatch = pathname.match(/^\/api\/checkup\/report\/([A-Za-z0-9_-]+)\/pdf$/);
  if (reportPdfMatch) {
    try {
      const buffer = await storage.getPdfBuffer(reportPdfMatch[1]);
      if (!buffer) { res.statusCode = 404; res.end('PDF not found'); return; }
      res.writeHead(200, { 
        'Content-Type': 'application/pdf', 
        'Content-Length': buffer.length,
        'Content-Disposition': `inline; filename="${reportPdfMatch[1]}.pdf"`
      });
      res.end(buffer);
    } catch (err) {
      console.error('Error fetching PDF:', err.message);
      if (!res.writableEnded) { res.statusCode = 500; res.end('Error retrieving PDF'); }
    }
    return;
  }

  // Safe status endpoint used by the browser poller
  const statusMatch = pathname.match(/^\/api\/checkup\/report\/([A-Za-z0-9_-]+)\/status$/);
  if (statusMatch) {
    try {
      const record = await storage.getRecord(statusMatch[1]);
      if (!record) { res.status(404).json({ error: 'Not Found' }); return; }
      res.status(200).json({
        status: record.status,
        pdfAvailable: !!(record.pdf && record.pdf.stored),
        pdfUrl: record.pdf && record.pdf.stored ? (record.pdf.url || `/api/checkup/report/${statusMatch[1]}/pdf`) : null
      });
    } catch (err) {
      console.error('Error fetching report status:', err.message);
      if (!res.writableEnded) res.status(500).json({ error: 'Internal Server Error' });
    }
    return;
  }

  // 3. Admin Authentication & Dashboard Endpoints
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN || 'admin123';

  if (pathname === '/api/admin/login' && req.method === 'POST') {
    try {
      const body = await readRequestBody(req);
      const password = String(body.password || '').trim();
      if (password === adminPassword) {
        res.status(200).json({ ok: true, token: adminPassword });
      } else {
        res.status(401).json({ ok: false, error: 'Invalid password' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  if (pathname === '/api/admin/leads') {
    const provided = String(req.headers['x-admin-token'] || req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
    if (provided !== adminPassword) {
      res.status(401).json({ error: 'Unauthorized', message: 'Valid admin token or password required.' });
      return;
    }
    try {
      const records = await storage.listRecords();
      res.status(200).json({ ok: true, count: records.length, leads: records });
    } catch (err) {
      console.error('Error fetching admin leads:', err);
      res.status(500).json({ error: 'Failed to load leads', message: err.message });
    }
    return;
  }

  // Single report fetch for admin
  const reportMatch = pathname.match(/^\/api\/checkup\/report\/([A-Za-z0-9_-]+)$/);
  if (reportMatch) {
    const provided = String(req.headers['x-admin-token'] || req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
    if (provided !== adminPassword) {
      res.status(401).json({ error: 'Unauthorized', message: 'Admin password/token required.' });
      return;
    }
    const record = await storage.getRecord(reportMatch[1]);
    if (!record) { res.status(404).json({ error: 'Not Found' }); return; }
    res.status(200).json(record);
    return;
  }

  // 4. Static File Serving
  let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  let safePath = path.normalize(path.join(PUBLIC_DIR, relativePath));
  if (safePath !== PUBLIC_DIR && !safePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (stats && stats.isDirectory()) {
        const indexPath = path.join(safePath, 'index.html');
        if (fs.existsSync(indexPath)) {
          safePath = indexPath;
        } else {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }
      } else {
        res.statusCode = 404;
        res.end('404 Not Found');
        return;
      }
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': fs.statSync(safePath).size
    });

    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
  });
});

const HOST = '0.0.0.0'; // Essential for Render and Docker cloud deployments!
server.listen(PORT, HOST, () => {
  console.log(`[BookMyRecords Server] Listening on http://${HOST}:${PORT}`);
  console.log(`  Storage Driver: ${storage.driver()}`);
  console.log(`  Admin Dashboard: http://localhost:${PORT}/admin.html`);
});
