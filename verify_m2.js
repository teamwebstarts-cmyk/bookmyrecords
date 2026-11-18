const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const files = fs.readdirSync(rootDir);
const htmlFiles = files.filter(f => f.endsWith('.html'));

console.log(`Found ${htmlFiles.length} HTML files to inspect:`);
htmlFiles.forEach(f => console.log(`  - ${f}`));

let errors = 0;

// 1. Check for forbidden legacy placeholder strings, residual branding & student reviews
const forbidden = [
  'infoaploxn@gmail.com',
  '+91 656 786 53',
  'Aploxn- Business Consulting HTML Template',
  'aploxn',
  'APLOXN',
  'example123@gmail.com',
  '$170',
  '$270',
  'Tally Prime course',
  'job assurance program',
  'Tally Course Alumni'
];

console.log('\n[CHECK 1] Scanning for forbidden placeholders and residual branding...');
for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  for (const str of forbidden) {
    if (content.toLowerCase().includes(str.toLowerCase())) {
      console.error(`[FAIL] ${file} contains forbidden string: "${str}"`);
      errors++;
    }
  }
}

// 2. Check all <script src="..."> tags for existence on disk (prevent 404 errors)
console.log('\n[CHECK 2] Validating <script src="..."> references on disk...');
const scriptSrcRegex = /<script[^>]+src=["']([^"']+)["']/gi;
for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  let match;
  while ((match = scriptSrcRegex.exec(content)) !== null) {
    const src = match[1].trim();
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
      continue;
    }
    const cleanSrc = src.split('?')[0];
    const resolvedPath = path.resolve(rootDir, cleanSrc);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`[FAIL] ${file} references missing script file: "${src}" (resolved: ${resolvedPath})`);
      errors++;
    }
  }
}

// 3. Check internal href targets
console.log('\n[CHECK 3] Validating internal links and telephone URIs...');
const hrefRegex = /href=["']([^"'#\s]+)(?:#[^"']*)?["']/g;
for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  let match;
  while ((match = hrefRegex.exec(content)) !== null) {
    let rawTarget = match[1].trim();
    if (
      rawTarget.startsWith('http://') ||
      rawTarget.startsWith('https://') ||
      rawTarget.startsWith('mailto:') ||
      rawTarget.startsWith('tel:') ||
      rawTarget.startsWith('javascript:') ||
      rawTarget.startsWith('#') ||
      rawTarget.startsWith('${') ||
      rawTarget === ''
    ) {
      continue;
    }

    // Strip URL query parameters (e.g. ?service=cfo)
    const filePathOnly = rawTarget.split('?')[0];

    const resolved = path.resolve(rootDir, filePathOnly);
    if (!fs.existsSync(resolved)) {
      console.error(`[FAIL] Broken link in ${file}: target "${rawTarget}" (file "${filePathOnly}") does not exist on disk!`);
      errors++;
    }
  }

  // RFC 3966 check: tel URI must not contain unencoded spaces
  if (/href=["']tel:\+91\s+/i.test(content)) {
    console.error(`[FAIL] ${file} contains non-RFC 3966 telephone URI with spaces (e.g. href="tel:+91 96696 93315"). Must be sanitized to tel:+919669693315`);
    errors++;
  }
}

// 4. Verify specific required pages exist
console.log('\n[CHECK 4] Verifying required pages exist...');
const requiredPages = [
  'cfo-services.html',
  'business-registration.html',
  'taxation.html',
  'ipr-registration.html',
  'loan-financing.html',
  'accounting-outsourcing.html',
  'pricing.html',
  'faq.html',
  'terms-conditions.html',
  'contact.html',
  'about.html',
  'index.html'
];

for (const req of requiredPages) {
  if (!fs.existsSync(path.join(rootDir, req))) {
    console.error(`[FAIL] Required page missing: ${req}`);
    errors++;
  }
}

// 5. Verify deliverables exist
console.log('\n[CHECK 5] Verifying persistent documentation deliverables exist...');
const reqDeliverables = [
  'docs/bookmyrecords/CONTENT_STRATEGY.md',
  'docs/bookmyrecords/CONTENT_REVIEW.md',
  'docs/bookmyrecords/WEBSITE_AUDIT.md',
  'docs/bookmyrecords/SERVICE_MAP.md',
  'docs/bookmyrecords/PROJECT_CONTEXT.md'
];

for (const deliv of reqDeliverables) {
  if (!fs.existsSync(path.join(rootDir, deliv))) {
    console.error(`[FAIL] Required deliverable missing: ${deliv}`);
    errors++;
  }
}

// 6. Verify page title standard compliance
console.log('\n[CHECK 6] Checking page title consistency...');
const aboutHtml = fs.readFileSync(path.join(rootDir, 'about.html'), 'utf8');
if (!aboutHtml.includes('<title>Book My Records | About Us</title>')) {
  console.error('[FAIL] about.html does not have standard title "<title>Book My Records | About Us</title>"');
  errors++;
}

// 7. Verify Core Service Triad structure in index.html#our-services
console.log('\n[CHECK 7] Checking Core Service Triad in index.html...');
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const triadChecks = [
  { name: 'Business Health Checkup Card', str: 'Business Health Checkup' },
  { name: 'Checkup Query CTA', str: 'contact.html?service=checkup' },
  { name: 'Business Health Diagnostic Card', str: 'Business Health Diagnostic' },
  { name: 'Diagnostic Query CTA', str: 'contact.html?service=diagnostic' },
  { name: 'Hands-on Consulting Card', str: 'Hands-on Consulting' },
  { name: 'Consulting Query CTA', str: 'contact.html?service=consulting' },
  { name: 'Business Registration in Slider', str: 'business-registration.html' },
  { name: 'Accounting Outsourcing in Slider', str: 'accounting-outsourcing.html' },
  { name: 'Taxation in Slider', str: 'taxation.html' },
  { name: 'IPR in Slider', str: 'ipr-registration.html' },
  { name: 'Loan Financing in Slider', str: 'loan-financing.html' }
];

for (const check of triadChecks) {
  if (!indexHtml.includes(check.str)) {
    console.error(`[FAIL] index.html is missing required Triad/Catalog element: ${check.name} ("${check.str}")`);
    errors++;
  }
}

console.log('\n--- VERIFICATION SUMMARY ---');
if (errors === 0) {
  console.log('ALL CHECKS PASSED: 0 errors detected! Codebase is 100% clean and compliant.');
  process.exit(0);
} else {
  console.error(`VERIFICATION FAILED: ${errors} errors detected.`);
  process.exit(1);
}
