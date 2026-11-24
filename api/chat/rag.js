'use strict';

const fs = require('fs');
const path = require('path');

const SOURCES = [
  ['docs/bookmyrecords/SERVICE_MAP.md', 'service-map'],
  ['docs/bookmyrecords/USER_FLOW.md', 'user-flow'],
  ['docs/bookmyrecords/CONSULTATION_BOOKING.md', 'consultation'],
  ['docs/bookmyrecords/AI_DATA_PRIVACY.md', 'privacy'],
  ['docs/bookmyrecords/TECHNICAL_FLOW.md', 'technical'],
  ['docs/bookmyrecords/PROJECT_CONTEXT.md', 'project'],
  ['docs/bookmyrecords/CONTENT_STRATEGY.md', 'content'],
  ['README.md', 'general'],
  ['pricing.html', 'pricing'],
  ['faq.html', 'faq'],
  ['about.html', 'about'],
  ['contact.html', 'contact'],
  ['accounting-outsourcing.html', 'accounting'],
  ['business-registration.html', 'registration'],
  ['business-health-checkup.html', 'health-checkup'],
  ['business-health-diagnostic.html', 'health-diagnostic'],
  ['cfo-services.html', 'cfo'],
  ['checkup.html', 'health-checkup'],
  ['hands-on-consulting-growth-support.html', 'consulting'],
  ['ipr-registration.html', 'ipr'],
  ['loan-financing.html', 'loans'],
  ['taxation.html', 'taxation']
];

const STOP = new Set(('a an and are as at be by for from has have how i in is it of on or our the this to we what when where which with you your').split(' '));
const HINDI_MAP = {
  gst:'gst', जीएसटी:'gst', tax:'taxation', टैक्स:'taxation', आयकर:'income tax',
  कंपनी:'company', रजिस्ट्रेशन:'registration', पंजीकरण:'registration',
  लेखा:'accounting', अकाउंटिंग:'accounting', बहीखाता:'bookkeeping',
  लोन:'loan', ऋण:'loan', कर्ज:'loan', ट्रेडमार्क:'trademark', पेटेंट:'patent',
  सलाह:'consultation', फीस:'pricing', कीमत:'pricing', प्राइस:'pricing',
  checkup:'health checkup', जांच:'health checkup', स्वास्थ्य:'health'
};

function normalize(text) {
  let value = String(text || '').toLowerCase();
  for (const [key, replacement] of Object.entries(HINDI_MAP)) {
    value = value.replaceAll(key, replacement);
  }
  return value.replace(/[^a-z0-9\u0900-\u097f]+/gi, ' ').trim();
}

function tokens(text) {
  return normalize(text).split(/\s+/).filter(token => token.length > 1 && !STOP.has(token));
}

function extractText(file, raw) {
  if (file.endsWith('.html')) {
    return raw
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style|svg|noscript|iframe)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
  }
  return raw;
}

function splitChunks(text, max = 950, overlap = 140) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + max, clean.length);
    if (end < clean.length) {
      const boundary = clean.lastIndexOf('. ', end);
      if (boundary > start + max * 0.55) end = boundary + 1;
    }
    const part = clean.slice(start, end).trim();
    if (part.length >= 90) chunks.push(part);
    if (end >= clean.length) break;
    start = Math.max(start + 1, end - overlap);
  }
  return chunks;
}

let cached = null;
function getKnowledgeBase() {
  if (cached) return cached;
  const root = path.resolve(__dirname, '../..');
  const rows = [];
  for (const [relative, tag] of SOURCES) {
    const full = path.join(root, relative);
    if (!fs.existsSync(full)) continue;
    const raw = fs.readFileSync(full, 'utf8');
    const text = extractText(relative, raw);
    splitChunks(text).forEach((content, index) => rows.push({
      id: relative + '#' + index,
      source: relative,
      service: tag,
      title: relative,
      content,
      terms: tokens(content)
    }));
  }
  cached = rows;
  return cached;
}

function retrieveKnowledge(query, limit = 5) {
  const queryTokens = tokens(query);
  if (!queryTokens.length) return [];
  const docs = getKnowledgeBase();
  const documentFrequency = new Map();
  for (const term of new Set(queryTokens)) {
    documentFrequency.set(term, docs.reduce((count, doc) => count + (doc.terms.includes(term) ? 1 : 0), 0));
  }
  const unique = [...new Set(queryTokens)];
  return docs.map(doc => {
    const counts = new Map();
    for (const term of doc.terms) counts.set(term, (counts.get(term) || 0) + 1);
    let score = 0;
    for (const term of unique) {
      const tf = counts.get(term) || 0;
      if (!tf) continue;
      const idf = Math.log(1 + docs.length / (1 + documentFrequency.get(term)));
      score += (1 + Math.log(tf)) * idf;
    }
    const normalized = score / Math.sqrt(Math.max(1, doc.terms.length));
    return { id: doc.id, source: doc.source, service: doc.service, title: doc.title, content: doc.content, score: normalized };
  }).filter(item => item.score > 0.02).sort((a, b) => b.score - a.score).slice(0, limit);
}

module.exports = { getKnowledgeBase, retrieveKnowledge, splitChunks, normalize, tokens };
