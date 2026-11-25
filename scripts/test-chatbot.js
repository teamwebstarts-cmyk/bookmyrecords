'use strict';

const assert = require('assert');
const { splitChunks, normalize, tokens } = require('../api/chat/rag');
const { redactSensitive, _rateAllowed } = require('../api/chat');
const { appendTurn, getSessionHistory, clearSession } = require('../api/chat/memory');

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
assert(tokens('the accounting and tax services').includes('accounting'));

const redacted = redactSensitive('PAN ABCDE1234F and GSTIN 22AAAAA0000A1Z5');
assert(!redacted.includes('22AAAAA0000A1Z5'), 'GSTIN should be redacted');
assert(!redacted.includes('ABCDE1234F'), 'PAN should be redacted');


const session = 'test-session-' + Date.now();
appendTurn(session, 'user', 'first turn');
appendTurn(session, 'assistant', 'first reply');
assert.strictEqual(getSessionHistory(session).length, 2, 'opt-in memory should retain recent turns');
clearSession(session);
assert.strictEqual(getSessionHistory(session).length, 0, 'memory opt-out should clear session');

const redactedContacts = redactSensitive('Email founder@example.com or call +91 98765 43210 / 9876543210');
assert(!redactedContacts.includes('founder@example.com'), 'email addresses should be redacted');
assert(!redactedContacts.includes('98765 43210'), 'Indian phone with country prefix should be redacted');
assert(!redactedContacts.includes('9876543210'), 'Indian phone without country prefix should be redacted');

const ipKey = 'test-' + Date.now();
assert.strictEqual(_rateAllowed(ipKey), true);
console.log('Chatbot unit smoke checks passed.');
