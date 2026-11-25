'use strict';

const { retrieveKnowledge } = require('./rag');
const { getSessionHistory, appendTurn, clearSession } = require('./memory');
const crypto = require('crypto');

const MAX_MESSAGE = 2000;
const MAX_BODY_BYTES = 24 * 1024;
const MAX_PAGE_CONTEXT = 160;
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;
const ipBuckets = new Map();

function cleanText(value, max = MAX_MESSAGE) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function redactSensitive(text) {
  return String(text)
    .replace(/\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/gi, '[REDACTED_GSTIN]')
    .replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/gi, '[REDACTED_PAN]')
    .replace(/\b[2-9][0-9]{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/g, '[REDACTED_ID]')
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[REDACTED_NUMBER]')
    .replace(/\b(?:account|a\/c|bank account)\s*(?:no\.?|number|#)?\s*[:=-]?\s*\d{9,18}\b/gi, 'Account: [REDACTED]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]')
    .replace(/\+91[\s-]?[6-9]\d{4}[\s-]?\d{5}\b/g, '[REDACTED_PHONE]')
    .replace(/\b[6-9]\d{4}[\s-]?\d{5}\b/g, '[REDACTED_PHONE]');
}

function rateAllowed(key) {
  const now = Date.now();
  const bucket = ipBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    if (ipBuckets.size > 5000) {
      for (const [ip, entry] of ipBuckets.entries()) {
        if (now - entry.startedAt >= WINDOW_MS) ipBuckets.delete(ip);
      }
    }
    ipBuckets.set(key, { startedAt: now, count: 1 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= MAX_REQUESTS_PER_WINDOW;
}

function publicSessionToken(supplied) {
  const candidate = cleanText(supplied, 80);
  if (/^[a-zA-Z0-9_-]{16,80}$/.test(candidate)) return candidate;
  return crypto.randomBytes(18).toString('hex');
}

function sessionStorageKey(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('Request body is too large.'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch (_) {
    throw Object.assign(new Error('Send a valid JSON request.'), { status: 400 });
  }
}

function outsideBookMyRecords(message) {
  const text = String(message || '');
  const asksToBuild = /\b(generate|write|build|create|code|program)\b/i.test(text)
    && /\b(python|javascript|typescript|php|java|sql|html|css|website|web site|landing page|script|program|app)\b/i.test(text);
  const jailbreak = /\b(ignore (all |your |previous )?instructions|reveal (the |your )?system prompt|jailbreak)\b/i.test(text);
  return asksToBuild || jailbreak;
}

const OUTSIDE_REPLY = 'I can only help with Book My Records. We cover business health checkup, diagnostic, CFO consulting, accounting, tax, registration, IPR and loan paperwork. I can’t write code or build a website. Tell me which of those you need.';

function toPlainChat(text) {
  return String(text || '')
    .replace(/\*\*|__|~~|`+/g, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 1600);
}

const SERVICE_FACTS = [
  '- Business Health Checkup: a finance and operations review of a company, with a score and a first report. It is not a medical test.',
  '- Business Health Diagnostic: a deeper review when that checkup shows a real problem.',
  '- CFO and hands-on consulting: ongoing financial guidance, MIS and cash-flow support.',
  '- Accounting outsourcing: bookkeeping, reconciliations and monthly accounts.',
  '- Taxation and compliance: GST, income tax, TDS and returns, including NRI tax.',
  '- Business registration: company, LLP, partnership and the related licences.',
  '- IPR: trademark and brand protection.',
  '- Loan paperwork: CMA and bank documents. We do not sanction or guarantee a loan.'
].join('\n');

function buildSystemPrompt(context, pageContext) {
  const sources = context.map((item, index) =>
    '[SOURCE ' + (index + 1) + ' | ' + item.service + ']\n' + String(item.content || '').slice(0, 380)
  ).join('\n\n');
  return [
    'You are a person on the Book My Records team, chatting one to one. Say "we", never "they". Sound natural and specific. Stay inside Book My Records business services. Never discuss medical tests, and never write code, websites or anything outside this firm.',
    'Reply in the visitor\'s language: English, Hindi, or natural Hinglish.',
    'Answer the question they actually asked. Use the service facts below for what we offer. Use the source excerpts only for extra detail. Never invent prices, timelines, eligibility or guarantees.',
    'Shape every reply the same way, including greetings. First, one short sentence. Then 3 to 6 lines that each start with a dash. Each dash is one short point a person can scan. End with one short question. Do not write a paragraph, and do not put several ideas in one sentence.',
    'When they ask what we do, use one dash for each relevant service. For the full list, include every service fact, still as separate dash lines.',
    'When they ask about one service, use points for what it is, who it helps, and the next step.',
    'If the message is vague or just a greeting, offer the main services as points and ask which one they need. Do not say you are unsure what they mean.',
    'If they also ask for something we do not do, such as writing code or building a website, say that in one sentence and still answer the Book My Records part.',
    'Plain text only. No asterisks, no bold, no headings. A list line starts with a dash.',
    'We are a consultancy, not a bank, NBFC, law firm or government office. Close with one useful next step or one short question. Phone +91 96696 93315, email info@bookmyrecords.com. Never ask for PAN, Aadhaar, OTP or passwords.',
    'Current page: ' + (pageContext || 'Book My Records website'),
    'SERVICE FACTS:\n' + SERVICE_FACTS,
    'SOURCE EXCERPTS:\n' + (sources || 'No extra excerpts.')
  ].join('\n\n');
}

async function callModel({ message, history, context, pageContext }) {
  const baseUrl = String(process.env.CHATBOT_AI_BASE_URL || process.env.GROQ_BASE_URL || process.env.AI_BASE_URL || '').trim().replace(/\/+$/, '');
  const apiKey = String(process.env.CHATBOT_AI_API_KEY || process.env.GROQ_API_KEY || process.env.AI_API_KEY || '').trim();
  const model = String(process.env.CHATBOT_AI_MODEL || process.env.GROQ_MODEL || process.env.AI_MODEL || '').trim();
  if (!baseUrl || !apiKey || !model || /^(replace|your-|optional)/i.test(apiKey)) {
    const err = new Error('Chat assistant is not configured yet. Please contact our team at +91 96696 93315 or info@bookmyrecords.com.');
    err.status = 503;
    throw err;
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt(context, pageContext) },
    ...history.slice(-4).map(turn => ({ role: turn.role, content: turn.content })),
    { role: 'user', content: redactSensitive(message) }
  ];

  let response;
  for (let attempt = 0; attempt < 2; attempt++) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 70000);
  try {
    response = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 600, stream: false }),
      signal: controller.signal
    });
    if (!response.ok) {
      // Do not return upstream provider response bodies or infrastructure details to public visitors.
      throw Object.assign(
        new Error(response.status === 429 ? 'The assistant is busy right now. Please try again in a moment.' : 'The assistant service is temporarily unavailable. Please try again later.'),
        { status: response.status === 429 ? 429 : 502 }
      );
    }
    const data = await response.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (typeof reply !== 'string' || !reply.trim()) throw Object.assign(new Error('AI provider returned an empty answer.'), { status: 502 });
    return toPlainChat(reply);
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw Object.assign(new Error('The assistant is taking longer than usual. Please try again.'), { status: 504 });
    }
    if (attempt === 0 && (err.status === 429 || err.status === 502)) continue;
    throw err;
  } finally {
    clearTimeout(timer);
  }
  }
}

async function handleChat(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }
  // The deployment proxy may hide visitor IPs; this per-process limiter is a basic guard, not a distributed production quota.
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || String(req.socket && req.socket.remoteAddress || 'unknown').trim();
  if (!rateAllowed(ip)) return sendJson(res, 429, { error: 'Too many messages. Please wait a minute and try again.' });

  try {
    const body = await readJson(req);
    const message = cleanText(body.message);
    if (!message) return sendJson(res, 400, { error: 'Please enter a message.' });
    if (message.length < 2) return sendJson(res, 400, { error: 'Please enter a little more detail.' });
    if (outsideBookMyRecords(message)) {
      return sendJson(res, 200, {
        ok: true,
        sessionId: publicSessionToken(body.sessionId),
        reply: OUTSIDE_REPLY,
        sources: [],
        mode: 'website',
        memory: 'not_retained',
        guardrail: 'bmr_scope'
      });
    }

    const sessionToken = publicSessionToken(body.sessionId);
    const sessionKey = sessionStorageKey(sessionToken);
    const pageContext = cleanText(body.pageContext, MAX_PAGE_CONTEXT);
    const memoryConsent = body.memoryConsent === true;
    const history = memoryConsent ? getSessionHistory(sessionKey) : [];
    const context = retrieveKnowledge(message, 3);
    const reply = await callModel({ message, history, context, pageContext });
    if (memoryConsent) {
      appendTurn(sessionKey, 'user', redactSensitive(message));
      appendTurn(sessionKey, 'assistant', reply);
    } else {
      clearSession(sessionKey);
    }
    return sendJson(res, 200, {
      ok: true,
      sessionId: sessionToken,
      reply,
      sources: context.slice(0, 3).map(item => ({ title: item.title, service: item.service, path: item.source })),
      mode: 'website',
      memory: 'transient_session_only_30m'
    });
  } catch (err) {
    const status = Number.isInteger(err.status) && err.status >= 400 && err.status <= 599 ? err.status : 500;
    if (status >= 500) console.error('[Chatbot] request failed:', err.name || 'Error', status);
    const publicMessage = status === 504
      ? err.message
      : status >= 500
      ? 'The assistant could not respond right now. Please try again or contact our team.'
      : err.message;
    return sendJson(res, status, { error: publicMessage });
  }
}


async function clearSessionHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }
  try {
    const body = await readJson(req);
    const supplied = cleanText(body.sessionId, 80);
    if (!/^[a-zA-Z0-9_-]{16,80}$/.test(supplied)) {
      return sendJson(res, 400, { error: 'A valid session identifier is required.' });
    }
    clearSession(sessionStorageKey(supplied));
    return sendJson(res, 200, { ok: true, memory: 'cleared' });
  } catch (err) {
    const status = Number.isInteger(err.status) ? err.status : 400;
    return sendJson(res, status, { error: err.message || 'Unable to clear chat memory.' });
  }
}

module.exports = { handleChat, clearSessionHandler, redactSensitive, retrieveKnowledge, _rateAllowed: rateAllowed };
