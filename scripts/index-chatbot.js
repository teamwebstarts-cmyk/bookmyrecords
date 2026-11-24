'use strict';

const { getKnowledgeBase, retrieveKnowledge } = require('../api/chat/rag');
const docs = getKnowledgeBase();
const probes = [
  ['How can I get GST return filing help?', ['taxation']],
  ['I want to register a private limited company', ['registration']],
  ['Can you prepare CMA data for a business loan?', ['loans']],
  ['What is a business health checkup?', ['health-checkup']],
  ['Can you help with bookkeeping and monthly P&L?', ['accounting']],
  ['How do I protect my brand trademark?', ['ipr']]
];
let failed = 0;
for (const [question, expected] of probes) {
  const found = retrieveKnowledge(question, 5);
  const tags = found.map(row => row.service);
  const pass = expected.some(tag => tags.includes(tag));
  console.log((pass ? 'PASS' : 'FAIL') + ' ' + question + ' -> ' + tags.join(', '));
  if (!pass) failed++;
}
console.log('Indexed knowledge chunks: ' + docs.length);
if (!docs.length || failed) process.exitCode = 1;
