'use strict';

const assert = require('assert');
const { splitChunks, normalize, tokens } = require('../api/chat/rag');
const { redactSensitive, _rateAllowed } = require('../api/chat');

const samples = [
  'Book My Records provides accounting outsourcing and bookkeeping.',
  'Taxation support includes GST and Income Tax filing coordination.',
  'Trademark registration protects brand names and logos.',
  'Business Health Checkup helps identify finance and compliance gaps.'
];

for (const sample of samples) {
  const chunks = splitChunks(sample.repeat(10), 160, 20);
  assert(chunks.length > 1, 'chunker should split longer text');
  assert(chunks.every(chunk => chunk.length >= 90), 'chunks should be useful in size');
}

assert(normalize('मुझे GST registration और टैक्स help चाहिए').includes('gst'));
assert(normalize('मुझे GST return file करना है').includes('gst'));
assert(redacted.length < 100);
assert(tokens('the accounting and tax services').includes('accounting'));

const redacted = redactSensitive('PAN ABCDE1234F and GSTIN 22AAAAA0000A1Z5');
assert(!redacted.includes('ABCDE1234F'), 'PAN should be redacted');
assert(!redacted.includes('22AAAAA0000A1Z5'), 'GSTIN should be redacted');

const ipKey = 'test-' + Date.now();
assert.strictEqual(_rateAllowed(ipKey), true);
console.log('Chatbot unit smoke checks passed.');
