'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function rewriteHtmlLinks(content) {
  let updated = content;
  updated = updated.replace(
    /href="index\.html(\?[^"#]*)?(#[^"]*)?"/gi,
    (_, query, hash) => `href="/${query || ''}${hash || ''}"`
  );
  updated = updated.replace(
    /href="([a-z0-9-]+)\.html(\?[^"#]*)?(#[^"]*)?"/gi,
    (_, slug, query, hash) => `href="/${slug}${query || ''}${hash || ''}"`
  );
  return updated;
}

const files = fs.readdirSync(root).filter((name) => name.endsWith('.html') && !name.startsWith('_'));
let changed = 0;
for (const file of files) {
  const filePath = path.join(root, file);
  const before = fs.readFileSync(filePath, 'utf8');
  const after = rewriteHtmlLinks(before);
  if (after !== before) {
    fs.writeFileSync(filePath, after, 'utf8');
    changed++;
    console.log('rewrote', file);
  }
}

const howWeWorkBuilder = path.join(root, 'scripts', 'build-how-we-work.js');
if (fs.existsSync(howWeWorkBuilder)) {
  const before = fs.readFileSync(howWeWorkBuilder, 'utf8');
  const after = rewriteHtmlLinks(before);
  if (after !== before) {
    fs.writeFileSync(howWeWorkBuilder, after, 'utf8');
    console.log('rewrote build-how-we-work.js');
  }
}

console.log('done, files changed:', changed);