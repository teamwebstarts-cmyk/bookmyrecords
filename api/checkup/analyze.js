/**
 * BookMyRecords Business Health Assessment
 * Serverless Intake, Scoring, PII Redaction & AI Analysis Engine
 * 
 * Vercel Serverless Function (Node.js)
 * Compliant with DPDP Act 2023 & IT Act 2000 Privacy Standards
 */

'use strict';

const crypto = require('crypto');
const { calculateHealthScore, PILLARS, RISK_BANDS, QUESTIONS } = require('./score');
const ai = require('./ai');

/**
 * Evaluates business profile, document metadata, and user notes against
 * BookMyRecords' 24 internal assessment criteria across the 6 core pillars.
 * 
 * This evaluation runs strictly BEHIND THE SCENES in the backend scoring engine
 * and AI system prompt so the visitor never sees the 24 audit questions.
 * 
 * @param {Object} params - { companyName, industry, turnoverBand, notes, file }
 * @returns {Object} Internal question ratings mapping (q1..q25 to integer 1..4)
 */
function evaluateInternalCriteria({ companyName = '', industry = '', turnoverBand = '', notes = '', file = null } = {}) {
  const normNotes = (notes || '').toLowerCase();
  const normIndustry = (industry || '').toLowerCase();
  const normTurnover = (turnoverBand || '').toLowerCase();
  const hasDoc = !!file;

  // Baseline evaluation for each of the 24/25 internal criteria (1..4 scale)
  // 1: Poor/Absent (0%), 2: Basic/Ad-hoc (33%), 3: Structured/Good (66%), 4: Advanced/Optimized (100%)
  const answers = {
    // Pillar 1: Financial Health & Statutory Compliance (Weight 25% · max 25 pts)
    q1: hasDoc ? 3 : 2, // Financial statement closure cadence & MIS
    q2: 2,              // Working capital management & cash flow forecasting
    q3: hasDoc ? 3 : 2, // GST filing, GSTR-2B vs Books reconciliation & ITC accuracy
    q4: hasDoc ? 3 : 2, // Direct tax & TDS compliance (24Q/26Q, Form 26AS/AIS)
    q5: 2,              // Accounts receivable (debtor) aging & credit limits

    // Pillar 2: Sales & Revenue Pipeline (Weight 20% · max 20 pts)
    q6: 2,              // Customer revenue concentration risk (top 3 clients)
    q7: 3,              // Sales pipeline visibility & CRM tracking
    q8: 3,              // Pricing discipline & unit gross margin tracking
    q9: 3,              // Customer repeat purchase & contract renewals

    // Pillar 3: Marketing & Brand Positioning (Weight 15% · max 15 pts)
    q10: 3,             // Brand identity, website & digital touchpoints
    q11: 2,             // Customer acquisition cost (CAC) & channel ROI tracking
    q12: 3,             // Customer feedback, testimonials & reputation management
    q13: 3,             // Marketing collateral & sales enablement assets

    // Pillar 4: Operational Efficiency & SOPs (Weight 15% · max 15 pts)
    q14: 2,             // Standard Operating Procedures (SOPs) & documentation
    q15: 2,             // Key person dependency (founder continuity risk)
    q16: 3,             // Supply chain, vendor management & procurement efficiency
    q17: 3,             // Quality control, defect rates & error resolution

    // Pillar 5: IT, Systems & Digital Readiness (Weight 15% · max 15 pts)
    q18: hasDoc ? 3 : 2, // Core business software integration (Accounting/ERP)
    q19: 3,              // Data security, cloud backups & disaster recovery
    q20: 3,              // Team collaboration, task management & digital tools
    q21: 3,              // Cybersecurity hygiene, software licensing & endpoints

    // Pillar 6: Governance, Legal & IPR Protection (Weight 10% · max 10 pts)
    q22: 3,              // Entity structure, statutory licenses & compliance tracking
    q23: 2,              // Intellectual Property Rights (IPR) — Trademark, copyright
    q24: 3,              // Commercial contracts, NDAs & employee agreements
    q25: 3               // Corporate governance, board records & secretarial compliance
  };

  // Adjust ratings based on turnover scale
  if (normTurnover.includes('under 50') || normTurnover.includes('<50') || normTurnover.includes('under ₹50')) {
    answers.q1 = Math.max(1, answers.q1 - 1);
    answers.q14 = 1; // Early-stage rarely has codified SOPs
    answers.q15 = 1; // High founder dependency
    answers.q18 = 2; // Basic accounting
    answers.q23 = 1; // Unregistered trademark
  } else if (normTurnover.includes('10cr') || normTurnover.includes('25cr') || normTurnover.includes('above 25') || normTurnover.includes('>10')) {
    answers.q1 = Math.min(4, answers.q1 + 1);
    answers.q7 = 4;
    answers.q14 = 3;
    answers.q16 = 4;
    answers.q18 = 4;
    answers.q22 = 4;
    answers.q25 = 4;
  }

  // Adjust ratings based on industry operational characteristics
  if (normIndustry.includes('manufactur') || normIndustry.includes('engineer')) {
    answers.q16 = Math.min(4, answers.q16 + 1); // Supply chain focus
    answers.q17 = 3; // QC focus
    answers.q2 = Math.max(1, answers.q2 - 1); // Working capital intensive
  } else if (normIndustry.includes('software') || normIndustry.includes('digital') || normIndustry.includes('it')) {
    answers.q18 = 4; // High digital adoption
    answers.q19 = 4; // Cloud backups
    answers.q20 = 4; // Digital tools
    answers.q23 = 3; // IPR awareness
  } else if (normIndustry.includes('retail') || normIndustry.includes('trade')) {
    answers.q5 = Math.max(1, answers.q5 - 1); // Debtor collections friction
    answers.q8 = 2; // Price competition
  }

  // Adjust ratings based on explicit notes / stated business challenges
  if (normNotes.includes('cash flow') || normNotes.includes('working capital') || normNotes.includes('liquidity') || normNotes.includes('delayed payment') || normNotes.includes('debtor')) {
    answers.q2 = 1; // Identified cash flow pain
    answers.q5 = 1; // Debtor collections friction
  }
  if (normNotes.includes('gst') || normNotes.includes('tax') || normNotes.includes('notice') || normNotes.includes('audit') || normNotes.includes('itc')) {
    answers.q3 = 1; // GST reconciliation friction
    answers.q4 = 1; // Tax compliance concern
  }
  if (normNotes.includes('sales') || normNotes.includes('lead') || normNotes.includes('client') || normNotes.includes('growth') || normNotes.includes('revenue')) {
    answers.q6 = 2; // Customer concentration concern
    answers.q7 = 2; // Pipeline visibility gap
  }
  if (normNotes.includes('sop') || normNotes.includes('process') || normNotes.includes('delegat') || normNotes.includes('depend') || normNotes.includes('team') || normNotes.includes('attrition')) {
    answers.q14 = 1; // Process gap
    answers.q15 = 1; // Promoter dependency
  }
  if (normNotes.includes('trademark') || normNotes.includes('ipr') || normNotes.includes('dispute') || normNotes.includes('legal') || normNotes.includes('contract')) {
    answers.q23 = 1; // IPR vulnerability
    answers.q24 = 2; // Contract gap
  }

  return answers;
}

/**
 * PII Sanitizer: Indian Statutory Identifiers Scrubbing Engine
 * 
 * Redacts PAN, Aadhaar, GSTIN, Card, and Bank Account numbers before prompt construction
 * to guarantee no identifiable statutory identifiers are transmitted to external AI providers.
 */
function sanitizePii(input) {
  if (typeof input !== 'string') return input;

  // 1. Indian GSTIN (15 chars) - MUST run before PAN because GSTIN embeds the PAN as characters 3-12
  const gstinRegex = /(?<=^|[^A-Za-z0-9])[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}(?=$|[^A-Za-z0-9])/gi;

  // 2. Indian PAN: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g. ABCDE1234F)
  const panRegex = /(?<=^|[^A-Za-z0-9])[A-Z]{5}[0-9]{4}[A-Z]{1}(?=$|[^A-Za-z0-9])/gi;

  // 3. Credit / Debit Card Numbers (16 digits formatted in 4-digit blocks or 13-19 digits) - MUST run before Aadhaar
  const cardRegex = /(?<=^|[^A-Za-z0-9])(?:\d{4}[-\s]?){3}\d{4}(?=$|[^A-Za-z0-9])/g;

  // 4. Indian Aadhaar: 12 digits (starting with 2-9, optional space or dash every 4 digits, not part of 16-digit card)
  const aadhaarRegex = /(?<=^|[^A-Za-z0-9])[2-9]{1}[0-9]{3}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}(?=$|[^A-Za-z0-9])/g;

  // 5. Bank Account Numbers with contextual labels (e.g., A/C: 123456789012)
  const labeledBankAccRegex = /(?<=^|[^A-Za-z0-9])(?:A\/C|Account|Acc|Bank\s+Account|A\/c\s+no\.?)\s*[:#-]?\s*(\d{9,18})(?=$|[^A-Za-z0-9])/gi;

  // 6. Generic long number sequences (11-18 consecutive digits)
  const genericAccRegex = /(?<=^|[^A-Za-z0-9])\d{11,18}(?=$|[^A-Za-z0-9])/g;

  let sanitized = input
    .replace(gstinRegex, '[REDACTED_GSTIN]')
    .replace(panRegex, '[REDACTED_PAN]')
    .replace(cardRegex, '[REDACTED_ACCOUNT_NO]')
    .replace(aadhaarRegex, '[REDACTED_AADHAAR]')
    .replace(labeledBankAccRegex, 'Account: [REDACTED_ACCOUNT_NO]')
    .replace(genericAccRegex, (match) => {
      // Do not redact 13-digit Unix timestamps if recent
      const num = parseInt(match, 10);
      if (match.length === 13 && num > 1700000000000 && num < 2000000000000) {
        return match;
      }
      return '[REDACTED_ACCOUNT_NO]';
    });

  return sanitized;
}

/**
 * Deep recursive PII scrubbing for arbitrary objects/arrays
 */
function sanitizeObjectPii(obj) {
  if (!obj || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizePii(obj) : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectPii(item));
  }
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    // Keep email and phone clean if they are top-level contact info, but sanitize user notes/answers
    if (key === 'contact_email' || key === 'contact_phone') {
      result[key] = value;
    } else if (typeof value === 'string') {
      result[key] = sanitizePii(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObjectPii(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Parses incoming HTTP request body supporting JSON, multipart/form-data, and URL-encoded.
 */
async function parseRequestBody(req) {
  // If req.body is already parsed into an object
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return { fields: req.body, file: null };
  }

  // Read stream data if buffer or readable stream
  let rawBuffer = null;
  if (Buffer.isBuffer(req.body)) {
    rawBuffer = req.body;
  } else if (typeof req.body === 'string') {
    rawBuffer = Buffer.from(req.body, 'utf-8');
  } else {
    // Read from request stream
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    rawBuffer = Buffer.concat(chunks);
  }

  const contentType = req.headers['content-type'] || '';

  // 1. Handle JSON
  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(rawBuffer.toString('utf-8'));
      return { fields: parsed, file: null };
    } catch (e) {
      throw new Error('Invalid JSON payload');
    }
  }

  // 2. Handle multipart/form-data
  if (contentType.includes('multipart/form-data')) {
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!boundaryMatch) {
      throw new Error('Missing boundary in multipart/form-data');
    }
    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const fields = {};
    let uploadedFile = null;

    let startIndex = 0;
    while ((startIndex = rawBuffer.indexOf(boundaryBuffer, startIndex)) !== -1) {
      startIndex += boundaryBuffer.length;
      if (rawBuffer.slice(startIndex, startIndex + 2).toString() === '--') {
        break; // End of parts
      }
      if (rawBuffer.slice(startIndex, startIndex + 2).toString() === '\r\n') {
        startIndex += 2;
      }

      const nextBoundaryIndex = rawBuffer.indexOf(boundaryBuffer, startIndex);
      if (nextBoundaryIndex === -1) break;

      const partBuffer = rawBuffer.slice(startIndex, nextBoundaryIndex - 2); // Exclude \r\n
      const headerEndIndex = partBuffer.indexOf(Buffer.from('\r\n\r\n'));

      if (headerEndIndex !== -1) {
        const headerStr = partBuffer.slice(0, headerEndIndex).toString('utf-8');
        const bodyBuffer = partBuffer.slice(headerEndIndex + 4);

        const dispositionMatch = headerStr.match(/name="([^"]+)"/i);
        const filenameMatch = headerStr.match(/filename="([^"]+)"/i);

        if (dispositionMatch) {
          const fieldName = dispositionMatch[1];
          if (filenameMatch) {
            // It's a file
            const contentTypeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
            uploadedFile = {
              fieldName,
              filename: filenameMatch[1],
              mimeType: contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream',
              sizeBytes: bodyBuffer.length,
              // Preview text if plain text / csv
              previewText: bodyBuffer.length < 50000 ? bodyBuffer.toString('utf-8', 0, Math.min(bodyBuffer.length, 10000)) : ''
            };
          } else {
            // Form field
            fields[fieldName] = bodyBuffer.toString('utf-8').trim();
          }
        }
      }
      startIndex = nextBoundaryIndex;
    }

    // Parse answers if passed as JSON string
    if (typeof fields.answers === 'string') {
      try {
        fields.answers = JSON.parse(fields.answers);
      } catch (e) {
        // Leave as string if not JSON
      }
    }

    return { fields, file: uploadedFile };
  }

  // 3. Handle URL-encoded
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const queryStr = rawBuffer.toString('utf-8');
    const params = new URLSearchParams(queryStr);
    const fields = {};
    for (const [key, value] of params.entries()) {
      fields[key] = value;
    }
    if (typeof fields.answers === 'string') {
      try {
        fields.answers = JSON.parse(fields.answers);
      } catch (e) {}
    }
    return { fields, file: null };
  }

  // Default fallback: Try parsing as JSON
  try {
    const parsed = JSON.parse(rawBuffer.toString('utf-8'));
    return { fields: parsed, file: null };
  } catch (e) {
    return { fields: {}, file: null };
  }
}

/**
 * Validates incoming client submission
 */
function validateCheckupPayload(fields, file = null) {
  const errors = [];

  if (!fields.company_name || typeof fields.company_name !== 'string' || fields.company_name.trim().length < 2) {
    errors.push('company_name is required (minimum 2 characters)');
  }

  if (!fields.contact_name || typeof fields.contact_name !== 'string' || fields.contact_name.trim().length < 2) {
    errors.push('contact_name is required (minimum 2 characters)');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!fields.contact_email || typeof fields.contact_email !== 'string' || !emailRegex.test(fields.contact_email.trim())) {
    errors.push('contact_email must be a valid email address');
  }

  const phoneRegex = /^(\+91[\-\s]?)?[0]?[6789]\d{9}$/;
  const cleanPhone = fields.contact_phone ? String(fields.contact_phone).replace(/[\s\-()]/g, '') : '';
  if (!fields.contact_phone || !phoneRegex.test(cleanPhone)) {
    errors.push('contact_phone must be a valid 10-digit Indian phone number');
  }

  // Validate attached document if present (<= 4 MB ceiling, allowed extensions: .pdf, .xlsx, .xls, .csv)
  if (file) {
    const maxSizeBytes = 4 * 1024 * 1024; // 4 MB ceiling (4,194,304 bytes)
    if (file.sizeBytes !== undefined && file.sizeBytes > maxSizeBytes) {
      errors.push(`File size exceeds 4 MB limit (${(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB). Maximum allowed size is 4 MB.`);
    }
    const validExtensions = ['.pdf', '.xlsx', '.xls', '.csv'];
    const fileNameLower = (file.filename || '').toLowerCase();
    const hasValidExt = validExtensions.some(ext => fileNameLower.endsWith(ext));
    if (file.filename && !hasValidExt) {
      errors.push(`Invalid file format for "${file.filename}". Only PDF, XLSX, XLS, and CSV files are permitted.`);
    }
  }

  // Check if answers were provided as an object or JSON string
  let answersObj = fields.answers;
  if (typeof answersObj === 'string') {
    try {
      answersObj = JSON.parse(answersObj);
    } catch (e) {
      errors.push('answers must be a valid JSON object mapping question IDs (q1..q25) to ratings (1..4)');
    }
  }

  let hasExplicitAnswers = answersObj && typeof answersObj === 'object' && Object.keys(answersObj).length > 0;

  // Check if answers were provided as top-level q1..q25 fields
  if (!hasExplicitAnswers) {
    const individualAnswers = {};
    let foundAny = false;
    for (let i = 1; i <= 25; i++) {
      if (fields[`q${i}`] !== undefined) {
        individualAnswers[`q${i}`] = fields[`q${i}`];
        foundAny = true;
      }
    }
    if (foundAny) {
      answersObj = individualAnswers;
      hasExplicitAnswers = true;
    }
  }

  // Check if this is a streamlined intake flow submission
  const isStreamlined = (
    fields.streamlined === true ||
    fields.streamlined === 'true' ||
    fields.dpdp_consent === true ||
    fields.dpdp_consent === 'true' ||
    fields.dpdp_consent === 'on' ||
    fields.consent === true ||
    fields.consent === 'true' ||
    !!file ||
    (fields.notes && typeof fields.notes === 'string' && fields.notes.trim().length > 0) ||
    (fields.business_notes && typeof fields.business_notes === 'string' && fields.business_notes.trim().length > 0) ||
    (fields.industry && fields.turnover_band)
  );

  if (!hasExplicitAnswers) {
    if (isStreamlined) {
      // Behind-the-scenes evaluation against the 24 internal assessment criteria
      answersObj = evaluateInternalCriteria({
        companyName: fields.company_name ? fields.company_name.trim() : '',
        industry: fields.industry ? fields.industry.trim() : '',
        turnoverBand: fields.turnover_band ? fields.turnover_band.trim() : '',
        notes: (fields.notes || fields.business_notes || '').trim(),
        file
      });
    } else {
      errors.push('answers is required and must contain assessment responses (q1..q25)');
    }
  }

  const rawNotes = fields.notes || fields.business_notes || '';

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedPayload: {
      company_name: fields.company_name ? sanitizePii(fields.company_name.trim()) : '',
      contact_name: fields.contact_name ? fields.contact_name.trim() : '',
      contact_email: fields.contact_email ? fields.contact_email.trim().toLowerCase() : '',
      contact_phone: cleanPhone,
      industry: fields.industry ? sanitizePii(fields.industry.trim()) : 'General Business & Trade',
      turnover_band: fields.turnover_band ? fields.turnover_band.trim() : '50L - 1 Cr',
      notes: rawNotes ? sanitizePii(rawNotes.trim()) : '',
      answers: answersObj || {}
    }
  };
}

/**
 * High-Fidelity Synthetic Report Generator
 * 
 * Produces a realistic, professional, fully customized report conforming 100%
 * to the exact BusinessHealthReport JSON schema when running in mock mode
 * or during Gemini API fallback.
 */
function generateSyntheticReport({ companyName, industry, turnoverBand, scores, fileInfo, notes, reportId }) {
  const generatedId = `BMR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const finalReportId = reportId || generatedId;
  const assessmentDate = new Date().toISOString();

  const { overall_score, risk_band, pillar_scores } = scores;

  // Identify lowest and highest scoring pillars
  const sortedPillars = [...pillar_scores].sort((a, b) => a.percentage - b.percentage);
  const weakestPillar = sortedPillars[0];
  const secondWeakest = sortedPillars[1];
  const strongestPillar = sortedPillars[sortedPillars.length - 1];

  // Tailor Executive Summary
  let executiveSummary = '';
  if (risk_band === 'Strong') {
    executiveSummary = `${companyName} demonstrates solid operational foundations and disciplined financial governance, achieving an overall health score of ${overall_score}/100 (${risk_band} band). The business exhibits robust capability in ${strongestPillar.pillar_name}. To accelerate expansion and optimize working capital, management should focus on closing minor operational variances and formalizing institutional governance.`;
  } else if (risk_band === 'Moderate') {
    executiveSummary = `${companyName} shows encouraging commercial momentum with an overall health score of ${overall_score}/100 (${risk_band} band). While ${strongestPillar.pillar_name} reflects positive execution, noticeable structural bottlenecks in ${weakestPillar.pillar_name} (${weakestPillar.percentage}%) and ${secondWeakest.pillar_name} (${secondWeakest.percentage}%) restrain profitability and create cash-flow friction. Targeted SOP institutionalization and fractional CFO oversight will unlock immediate stability.`;
  } else if (risk_band === 'Vulnerable') {
    executiveSummary = `${companyName} is currently operating in a vulnerable business state with an overall health score of ${overall_score}/100 (${risk_band} band). Core vulnerabilities reside in ${weakestPillar.pillar_name} (${weakestPillar.percentage}%) and ${secondWeakest.pillar_name} (${secondWeakest.percentage}%), where ad-hoc processes and delayed reconciliations increase statutory and operational exposure. A structured 90-day stabilization roadmap is recommended to safeguard working capital.`;
  } else {
    executiveSummary = `CRITICAL INTERVENTION REQUIRED: ${companyName} has registered a high-risk health score of ${overall_score}/100 (${risk_band} band). Substantial deficiencies across ${weakestPillar.pillar_name} (${weakestPillar.percentage}%) and ${secondWeakest.pillar_name} (${secondWeakest.percentage}%) threaten day-to-day business continuity, statutory standing, and solvency. Management must implement immediate emergency controls and schedule an urgent diagnostic consultation with BookMyRecords specialists.`;
  }

  // Key Strengths
  const keyStrengths = [
    {
      title: `${strongestPillar.pillar_name} Discipline`,
      explanation: `${companyName} achieved ${strongestPillar.percentage}% in ${strongestPillar.pillar_name}, demonstrating consistent execution, reliable controls, and management attentiveness in this domain.`
    },
    {
      title: 'Commercial Resilience & Market Traction',
      explanation: `Active customer operations in the ${industry} sector with steady business volume in the ${turnoverBand} turnover band indicate sustained market demand.`
    },
    {
      title: 'Management Openness to Governance Review',
      explanation: 'Undergoing a comprehensive 25-point health checkup signals management readiness to institutionalize professional standards and eliminate hidden profit leaks.'
    }
  ];

  // Critical Gaps
  const criticalGaps = [
    {
      pillar: weakestPillar.pillar_name,
      finding: `Process informality and execution lag identified in ${weakestPillar.pillar_name} (scored ${weakestPillar.score}/${weakestPillar.max_score} pts).`,
      impact: 'Increases error rates, creates working capital blockage, and exposes the enterprise to statutory notices or margin leakage.',
      severity: weakestPillar.percentage < 50 ? 'High' : 'Medium'
    },
    {
      pillar: secondWeakest.pillar_name,
      finding: `Inconsistent documentation and tracking in ${secondWeakest.pillar_name} (scored ${secondWeakest.score}/${secondWeakest.max_score} pts).`,
      impact: 'Creates operational friction, slows sales conversion, and limits senior leadership visibility into real-time metrics.',
      severity: secondWeakest.percentage < 50 ? 'High' : 'Medium'
    },
    {
      pillar: 'Key Person Dependency & Delegation',
      finding: 'Operational approvals and critical relationship decisions remain heavily concentrated in the promoter group.',
      impact: 'Restricts business scalability and impairs operational continuity during founder absence.',
      severity: overall_score < 60 ? 'High' : 'Low'
    }
  ];

  // Key Observations
  const keyObservations = [
    `The business scored ${overall_score} out of 100, placing it within the ${risk_band} performance band.`,
    `Statutory and financial controls reflect ${pillar_scores[0].percentage}% efficiency; regular monthly closure and automated reconciliations require reinforcement.`,
    `Sales and client concentration metrics indicate need for diversification across ${industry} client segments.`,
    `Digital systems and automated backup procedures should be hardened to prevent operational disruption and data loss.`,
    fileInfo ? `Supporting document (${sanitizePii(fileInfo.filename)}) was received in-memory and factored into operational observations.` : 'No primary financial statements (P&L, Balance Sheet) were uploaded; observations are formulated on self-reported inputs.'
  ];

  // Risks and Vulnerabilities
  const risksAndVulnerabilities = [
    {
      risk_title: 'Statutory Default & ITC Disallowance Exposure',
      likelihood: weakestPillar.pillar_id === 'pillar_1' ? 'High' : 'Medium',
      impact_severity: 'Critical',
      mitigation: 'Implement rigorous monthly GSTR-2B vs Books reconciliation and establish advance tax forecasting with BookMyRecords compliance desk.'
    },
    {
      risk_title: 'Working Capital Lockup in Overdue Receivables',
      likelihood: overall_score < 60 ? 'High' : 'Medium',
      impact_severity: 'Moderate',
      mitigation: 'Enforce strict credit limits, introduce automated payment reminders, and institute weekly debtor aging reviews.'
    },
    {
      risk_title: 'Unprotected Brand Identity and Intellectual Property',
      likelihood: pillar_scores[5].percentage < 60 ? 'High' : 'Low',
      impact_severity: pillar_scores[5].percentage < 60 ? 'Critical' : 'Minor',
      mitigation: 'Audit current trademark status under Trademark Registry classes and formalize vendor/employee non-disclosure agreements.'
    }
  ];

  // Improvement Opportunities
  const improvementOpportunities = [
    {
      initiative: 'Fractional CFO & Monthly MIS Institutionalization',
      expected_outcome: 'Accurate 7-day monthly closing, unit economics visibility, and elimination of cash-flow surprises.',
      timeframe: 'First 30 Days'
    },
    {
      initiative: 'Standard Operating Procedures (SOP) Digital Repository',
      expected_outcome: 'Reduction of key-person dependency by 60% and standardized delivery quality across operations.',
      timeframe: '30 to 60 Days'
    },
    {
      initiative: 'Integrated Accounting & Inventory Synchronization',
      expected_outcome: 'Elimination of manual entry errors and real-time inventory-to-sales gross margin analytics.',
      timeframe: '60 to 90 Days'
    }
  ];

  // Priority Action Plan (30 / 60 / 90 Days)
  const priorityActionPlan = {
    immediate_30_days: [
      'Conduct emergency reconciliation of bank books against GSTR-2B and Form 26AS/AIS to verify ITC integrity.',
      'Establish a formal debtor aging tracker and initiate direct outreach on receivables outstanding >60 days.',
      'Hold a preliminary one-on-one diagnostic consultation with a BookMyRecords senior financial consultant.'
    ],
    medium_term_60_days: [
      'Codify core operational workflows into written SOPs for key revenue-generating activities.',
      'Deploy centralized cloud accounting software with automated daily backups and multi-user role permissions.',
      'File necessary trademark applications to safeguard primary corporate brand assets.'
    ],
    strategic_90_days: [
      'Establish a 13-week rolling cash flow forecasting cadence with variance analysis.',
      'Restructure sales incentives to prioritize high-margin services and decrease client concentration risk.',
      'Prepare investor/banker ready financial dossiers for favorable working capital credit facilities.'
    ]
  };

  // Missing or Unverified Information
  const missingOrUnverifiedInfo = [
    'Audited Balance Sheet and Profit & Loss statement for the preceding financial year.',
    'Detailed monthly Accounts Receivable (AR) and Accounts Payable (AP) aging schedule.',
    'Current GSTR-3B and GSTR-1 filing acknowledgments for the active financial quarter.',
    'Corporate entity constitutional documents (MoA/AoA, Partnership Deed, or LLP Agreement).'
  ];

  // Consultation Agenda
  const consultationAgenda = [
    `Detailed review of the ${overall_score}/100 Health Score and root-cause analysis of the ${weakestPillar.pillar_name} gap.`,
    'Cash flow stabilization strategy and evaluation of working capital facility adequacy.',
    'Statutory risk mitigation roadmap for direct and indirect taxes.',
    'Structuring an ongoing Fractional CFO and Hands-on Consulting engagement with BookMyRecords.'
  ];

  return {
    meta: {
      company_name: companyName,
      industry,
      turnover_band: turnoverBand,
      assessment_date: assessmentDate,
      report_id: finalReportId
    },
    scores: {
      overall_score,
      risk_band,
      pillar_scores: pillar_scores.map(p => ({
        pillar_name: p.pillar_name,
        score: p.score,
        max_score: p.max_score,
        status: p.status
      }))
    },
    executive_summary: executiveSummary,
    key_strengths: keyStrengths,
    critical_gaps: criticalGaps,
    key_observations: keyObservations,
    risks_and_vulnerabilities: risksAndVulnerabilities,
    improvement_opportunities: improvementOpportunities,
    priority_action_plan: priorityActionPlan,
    missing_or_unverified_info: missingOrUnverifiedInfo,
    consultation_agenda: consultationAgenda,
    disclaimer: 'This document is an AI-assisted preliminary business health assessment prepared for strategic consultation discussion with BookMyRecords experts. It does not constitute a certified statutory audit, tax opinion, or legal guarantee.'
  };
}

/**
 * Builds the strict JSON schema instruction for Google Gemini API
 * with the 24 internal assessment criteria embedded across the 6 pillars.
 */
function buildGeminiPrompt({ companyName, industry, turnoverBand, scores, notes, fileInfo }) {
  return `You are a Senior Business Consultant at BookMyRecords (Indore, India).
BookMyRecords provides fractional CFO guidance, business health assessments, forensic diagnostics, and hands-on consulting to Indian MSMEs, manufacturers, traders, and growing businesses.

Your task is to analyze the following business profile and deterministic health scores, and return a comprehensive, professional Business Health Assessment Report.

INTERNAL EVALUATION CRITERIA (24 Core Rubric Points across 6 Pillars):
1. Financial Health & Statutory Compliance (Weight: 25%): Financial statement closure cadence & MIS; Working capital forecasting; GST reconciliation & ITC accuracy; Direct tax & TDS compliance; Debtor aging & collections control.
2. Sales & Revenue Pipeline (Weight: 20%): Client revenue concentration risk; Sales pipeline visibility & CRM; Pricing discipline & unit gross margin; Customer repeat rate & contracts.
3. Marketing & Brand Positioning (Weight: 15%): Digital touchpoints & website; CAC & channel ROI; Testimonials & reputation; Sales collateral & pitch enablement.
4. Operational Efficiency & SOPs (Weight: 15%): Standard Operating Procedures; Key person dependency & delegation; Vendor management & procurement; Quality control & defects.
5. IT, Systems & Digital Readiness (Weight: 15%): Core accounting/ERP integration; Data security & cloud backups; Team collaboration tools; Cybersecurity & licensing.
6. Governance, Legal & IPR Protection (Weight: 10%): Entity licenses & statutory filings; IPR (Trademark & copyright); Commercial contracts & NDAs; Secretarial compliance.

CRITICAL RULES:
1. The mathematical score and risk band are deterministically pre-computed. You must include them EXACTLY as given below. Do NOT recalculate or invent scores.
2. Return ONLY a single valid JSON object strictly matching the schema specified below. Do not wrap in Markdown fences, do not add introductory text.
3. Every recommendation must be practical and tailored to Indian business reality (GST, TDS, MSME compliance, cash flow, banking credit, SOPs).
4. Tone: Professional, authoritative, human, consultant-led, constructive. Avoid empty corporate hype or generic AI cliches.

BUSINESS PROFILE:
- Company Name: ${companyName}
- Industry: ${industry}
- Turnover Band: ${turnoverBand}
- Additional Notes / Stated Challenges: ${notes || 'None provided'}
${fileInfo ? `- Uploaded Document: ${sanitizePii(fileInfo.filename)} (${fileInfo.mimeType}, ${fileInfo.sizeBytes} bytes)` : '- Uploaded Document: None (self-reported business profile)'}

PRE-COMPUTED SCORES (DO NOT ALTER):
- Overall Score: ${scores.overall_score} / 100
- Risk Band: ${scores.risk_band}
- Pillar Breakdown:
${scores.pillar_scores.map(p => `  * ${p.pillar_name}: ${p.score}/${p.max_score} points (${p.percentage}%) - Status: ${p.status}`).join('\n')}

REQUIRED JSON SCHEMA (You must produce all keys):
{
  "meta": {
    "company_name": "${companyName}",
    "industry": "${industry}",
    "turnover_band": "${turnoverBand}",
    "assessment_date": "${new Date().toISOString()}",
    "report_id": "BMR-2026-${Math.floor(1000 + Math.random() * 9000)}"
  },
  "scores": {
    "overall_score": ${scores.overall_score},
    "risk_band": "${scores.risk_band}",
    "pillar_scores": [
${scores.pillar_scores.map(p => `      { "pillar_name": "${p.pillar_name}", "score": ${p.score}, "max_score": ${p.max_score}, "status": "${p.status}" }`).join(',\n')}
    ]
  },
  "executive_summary": "Comprehensive 3-4 sentence professional executive overview addressing the company's performance, key risks, and consultation focus.",
  "key_strengths": [
    { "title": "Strength Title", "explanation": "Detailed explanation citing business capabilities." }
  ],
  "critical_gaps": [
    { "pillar": "Pillar Name", "finding": "Specific gap identified", "impact": "Business consequence", "severity": "High" | "Medium" | "Low" }
  ],
  "key_observations": [
    "Observation 1", "Observation 2", "Observation 3"
  ],
  "risks_and_vulnerabilities": [
    { "risk_title": "Risk Name", "likelihood": "High" | "Medium" | "Low", "impact_severity": "Critical" | "Moderate" | "Minor", "mitigation": "Recommended action" }
  ],
  "improvement_opportunities": [
    { "initiative": "Initiative Name", "expected_outcome": "Expected benefit", "timeframe": "Timeframe" }
  ],
  "priority_action_plan": {
    "immediate_30_days": ["Action 1", "Action 2"],
    "medium_term_60_days": ["Action 1", "Action 2"],
    "strategic_90_days": ["Action 1", "Action 2"]
  },
  "missing_or_unverified_info": [
    "Item 1", "Item 2"
  ],
  "consultation_agenda": [
    "Discussion Topic 1", "Discussion Topic 2"
  ]
}`;
}

/**
 * Validates that an object conforms to the BusinessHealthReport JSON schema
 */
function validateReportSchema(report) {
  if (!report || typeof report !== 'object') return false;

  const requiredRootKeys = [
    'meta',
    'scores',
    'executive_summary',
    'key_strengths',
    'critical_gaps',
    'key_observations',
    'risks_and_vulnerabilities',
    'improvement_opportunities',
    'priority_action_plan',
    'missing_or_unverified_info',
    'consultation_agenda'
  ];

  for (const key of requiredRootKeys) {
    if (report[key] === undefined || report[key] === null) {
      return false;
    }
  }

  // Check meta
  if (!report.meta.company_name || !report.meta.report_id) return false;

  // Check scores
  if (typeof report.scores.overall_score !== 'number' || !Array.isArray(report.scores.pillar_scores)) return false;

  // Check arrays
  if (!Array.isArray(report.key_strengths) || !Array.isArray(report.critical_gaps) || !Array.isArray(report.key_observations)) return false;
  if (!Array.isArray(report.risks_and_vulnerabilities) || !Array.isArray(report.improvement_opportunities)) return false;
  if (!Array.isArray(report.missing_or_unverified_info) || !Array.isArray(report.consultation_agenda)) return false;

  // Check priority action plan
  const plan = report.priority_action_plan;
  if (!plan || !Array.isArray(plan.immediate_30_days) || !Array.isArray(plan.medium_term_60_days) || !Array.isArray(plan.strategic_90_days)) {
    return false;
  }

  return true;
}

/**
 * Calls the configured OpenAI-compatible AI provider (DeepSeek-compatible by default).
 * Provider, model, base URL and key all come from environment variables.
 */
async function callAiApi(promptText, systemPrompt) {
  return ai.callAiJson({
    system: systemPrompt || 'You are a senior Indian business consultant. Return only the requested JSON object.',
    user: promptText,
    timeoutMs: 120000
  });
}

// Backwards-compatible name used by internal callers/tests.
const callGeminiApi = callAiApi;

/**
 * Main Vercel Serverless Function Handler
 */
module.exports = async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Reject unsupported methods
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({
      error: 'Method Not Allowed',
      message: `HTTP ${req.method} is not supported. Use POST with multipart/form-data or application/json.`
    });
    return;
  }

  try {
    // 1. Parse incoming request body
    const { fields, file } = await parseRequestBody(req);

    // 2. Validate input fields
    const validation = validateCheckupPayload(fields, file);
    if (!validation.isValid) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid or missing required fields in submission',
        details: validation.errors
      });
      return;
    }

    const { company_name, contact_name, contact_email, contact_phone, industry, turnover_band, notes, answers } = validation.sanitizedPayload;

    // 3. Compute deterministic health score (THE AI NEVER INVENTS THIS SCORE)
    const scoringResult = calculateHealthScore(answers);

    // One canonical report id for the whole lifecycle (report → PDF → booking)
    const reportId = `BMR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // 4. Determine AI execution mode (live OpenAI-compatible provider vs synthetic fallback)
    let finalReport = null;
    let engineSource = 'synthetic_generator';

    if (ai.isAiEnabled()) {
      try {
        const prompt = buildGeminiPrompt({
          companyName: company_name,
          industry,
          turnoverBand: turnover_band,
          scores: scoringResult,
          notes,
          fileInfo: file
        });

        const aiReport = await callAiApi(prompt);

        // Enforce deterministic scores even if the AI attempted modification
        aiReport.scores = {
          overall_score: scoringResult.overall_score,
          risk_band: scoringResult.risk_band,
          pillar_scores: scoringResult.pillar_scores.map(p => ({
            pillar_name: p.pillar_name,
            score: p.score,
            max_score: p.max_score,
            status: p.status
          }))
        };
        aiReport.meta = aiReport.meta || {};
        aiReport.meta.report_id = reportId;
        aiReport.meta.company_name = aiReport.meta.company_name || company_name;

        if (validateReportSchema(aiReport)) {
          finalReport = aiReport;
          engineSource = ai.getEngineLabel();
        } else {
          console.warn('AI response failed strict schema validation. Falling back to synthetic generator.');
        }
      } catch (aiError) {
        console.warn('AI provider call failed, gracefully falling back to synthetic generator:', aiError.message);
      }
    }

    // Fallback to high-quality synthetic report generator if AI is not active or failed
    if (!finalReport) {
      finalReport = generateSyntheticReport({
        companyName: company_name,
        industry,
        turnoverBand: turnover_band,
        scores: scoringResult,
        fileInfo: file,
        notes,
        reportId
      });
      engineSource = 'synthetic_generator';
    }

    // Attach runtime metadata
    finalReport._meta = {
      engine: engineSource,
      compliance: 'DPDP Act 2023 & IT Act 2000 — AI-assisted assessment, documents processed in memory only',
      processed_at: new Date().toISOString(),
      document_attached: !!file,
      report_id: reportId
    };

    // Return HTTP 200 with complete report
    res.status(200).json(finalReport);

  } catch (err) {
    console.error('Serverless execution error in /api/checkup/analyze:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing the Business Health Assessment.',
      details: err.message
    });
  }
};

// Export internal functions for unit and forensic testing
module.exports.sanitizePii = sanitizePii;
module.exports.sanitizeObjectPii = sanitizeObjectPii;
module.exports.parseRequestBody = parseRequestBody;
module.exports.validateCheckupPayload = validateCheckupPayload;
module.exports.evaluateInternalCriteria = evaluateInternalCriteria;
module.exports.generateSyntheticReport = generateSyntheticReport;
module.exports.validateReportSchema = validateReportSchema;
module.exports.buildGeminiPrompt = buildGeminiPrompt;
module.exports.callAiApi = callAiApi;
