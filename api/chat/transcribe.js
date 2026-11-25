'use strict';

const { Blob } = require('buffer');

const MAX_AUDIO_BYTES = 2.5 * 1024 * 1024;
const MAX_BODY_BYTES = 3.5 * 1024 * 1024;
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 12;
const ipBuckets = new Map();

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function rateAllowed(key) {
  const now = Date.now();
  const bucket = ipBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    if (ipBuckets.size > 3000) {
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

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('Audio upload is too large.'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch (_) {
    throw Object.assign(new Error('Send a valid JSON request.'), { status: 400 });
  }
}

function groqSpeechConfig() {
  const baseUrl = String(process.env.GROQ_BASE_URL || process.env.CHATBOT_AI_BASE_URL || 'https://api.groq.com/openai/v1')
    .trim()
    .replace(/\/+$/, '');
  const apiKey = String(process.env.GROQ_API_KEY || process.env.CHATBOT_AI_API_KEY || '').trim();
  const model = String(process.env.WHISPER_MODEL || 'whisper-large-v3-turbo').trim();
  const mock = /^(1|true|yes)$/i.test(String(process.env.AI_MOCK_MODE || ''));
  return { baseUrl, apiKey, model, mock, enabled: !mock && !!baseUrl && !!apiKey && !/^(replace|your-)/i.test(apiKey) };
}

async function transcribeWithGroq(buffer, mime, lang) {
  const cfg = groqSpeechConfig();
  if (!cfg.enabled) {
    const err = new Error('Voice transcription is not available right now. Please type your message.');
    err.status = 503;
    throw err;
  }

  const ext = mime.includes('mp4') ? 'm4a' : mime.includes('wav') ? 'wav' : 'webm';
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mime }), 'speech.' + ext);
  form.append('model', cfg.model);
  form.append('language', lang === 'hi' ? 'hi' : 'en');
  form.append('response_format', 'json');
  form.append('temperature', '0');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(cfg.baseUrl + '/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + cfg.apiKey },
      body: form,
      signal: controller.signal
    });
    if (!response.ok) {
      throw Object.assign(
        new Error(response.status === 429 ? 'Voice service is busy. Wait a moment and try again.' : 'Could not transcribe audio. Please type your message.'),
        { status: response.status === 429 ? 429 : 502 }
      );
    }
    const data = await response.json();
    const text = data && typeof data.text === 'string' ? data.text.trim() : '';
    if (!text) throw Object.assign(new Error('No speech was detected. Try speaking closer to the mic.'), { status: 422 });
    return text;
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw Object.assign(new Error('Transcription timed out. Try a shorter message or type instead.'), { status: 504 });
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function handleTranscribe(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || String(req.socket && req.socket.remoteAddress || 'unknown').trim();
  if (!rateAllowed(ip)) return sendJson(res, 429, { error: 'Too many voice requests. Please wait a minute.' });

  try {
    const body = await readJson(req);
    const mime = String(body.mime || 'audio/webm').trim().toLowerCase();
    if (!/^audio\/(webm|mp4|mpeg|wav|x-wav|ogg)$/.test(mime)) {
      return sendJson(res, 400, { error: 'Unsupported audio format.' });
    }
    const raw = String(body.audioBase64 || '').trim();
    if (!raw) return sendJson(res, 400, { error: 'No audio was received.' });
    let buffer;
    try {
      buffer = Buffer.from(raw, 'base64');
    } catch (_) {
      return sendJson(res, 400, { error: 'Audio data was invalid.' });
    }
    if (!buffer.length || buffer.length > MAX_AUDIO_BYTES) {
      return sendJson(res, 400, { error: 'Recording is empty or too long. Try up to about one minute.' });
    }
    if (buffer.length < 800) {
      return sendJson(res, 422, { error: 'Recording was too short. Hold the mic and speak clearly.' });
    }

    const lang = String(body.lang || 'en').slice(0, 8);
    const text = await transcribeWithGroq(buffer, mime, lang);
    return sendJson(res, 200, { ok: true, text });
  } catch (err) {
    const status = Number.isInteger(err.status) && err.status >= 400 && err.status <= 599 ? err.status : 500;
    if (status >= 500) console.error('[Chatbot] transcribe failed:', err.name || 'Error', status);
    return sendJson(res, status, { error: err.message || 'Voice transcription failed.' });
  }
}

module.exports = { handleTranscribe, groqSpeechConfig };