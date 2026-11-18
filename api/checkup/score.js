/**
 * BookMyRecords Business Health Assessment
 * Deterministic Mathematical Scoring Engine
 * 
 * Evaluates 25 questions across 6 core business pillars to compute a transparent,
 * rule-based health score out of 100 points.
 * 
 * Note: Under BookMyRecords architecture standards, the AI model never invents,
 * estimates, or modifies this official score.
 */

'use strict';

/**
 * The 6 Core Business Pillars and their approved weightings.
 */
const PILLARS = [
  {
    id: 'pillar_1',
    name: 'Financial Health & Statutory Compliance',
    short_name: 'Financial Health',
    question_count: 5,
    weight_percentage: 25,
    max_score: 25,
    points_per_question: 5.0
  },
  {
    id: 'pillar_2',
    name: 'Sales & Revenue Pipeline',
    short_name: 'Sales Pipeline',
    question_count: 4,
    weight_percentage: 20,
    max_score: 20,
    points_per_question: 5.0
  },
  {
    id: 'pillar_3',
    name: 'Marketing & Brand Positioning',
    short_name: 'Marketing & Brand',
    question_count: 4,
    weight_percentage: 15,
    max_score: 15,
    points_per_question: 3.75
  },
  {
    id: 'pillar_4',
    name: 'Operational Efficiency & SOPs',
    short_name: 'Operations & SOPs',
    question_count: 4,
    weight_percentage: 15,
    max_score: 15,
    points_per_question: 3.75
  },
  {
    id: 'pillar_5',
    name: 'IT, Systems & Digital Readiness',
    short_name: 'IT & Digital',
    question_count: 4,
    weight_percentage: 15,
    max_score: 15,
    points_per_question: 3.75
  },
  {
    id: 'pillar_6',
    name: 'Governance, Legal & IPR Protection',
    short_name: 'Governance & IPR',
    question_count: 4,
    weight_percentage: 10,
    max_score: 10,
    points_per_question: 2.5
  }
];

/**
 * Standard Risk Bands based on final score out of 100.
 */
const RISK_BANDS = {
  Strong: {
    label: 'Strong',
    min: 80,
    max: 100,
    color: '#198754',
    description: 'Scalable operations and disciplined compliance, positioned for growth or institutional credit.'
  },
  Moderate: {
    label: 'Moderate',
    min: 60,
    max: 79.9,
    color: '#0d6efd',
    description: 'Solid business fundamentals with distinct operational, margin, or tax efficiency gaps.'
  },
  Vulnerable: {
    label: 'Vulnerable',
    min: 40,
    max: 59.9,
    color: '#fd7e14',
    description: 'Working capital strain, undocumented processes, or compliance exposure requiring structured intervention.'
  },
  Critical: {
    label: 'Critical',
    min: 0,
    max: 39.9,
    color: '#dc3545',
    description: 'Significant operational or statutory risk, urgent financial restructuring and expert guidance required.'
  }
};

/**
 * The 25 Assessment Questions across all 6 Pillars.
 */
const QUESTIONS = [
  // --- Pillar 1: Financial Health & Statutory Compliance (q1 - q5, 5 pts each, max 25) ---
  {
    id: 'q1',
    number: 1,
    pillar_id: 'pillar_1',
    pillar_name: 'Financial Health & Statutory Compliance',
    points: 5.0,
    prompt: 'Timeliness of monthly financial statements (P&L, Balance Sheet, Cash Flow closure)',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Ad-hoc or annual only at tax filing time' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Quarterly closure with 30+ day lag' },
      { rating: 3, label: 'Structured / Good', text: 'Monthly closure within 15-20 days' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Monthly closure within 7 days with automated MIS dashboard' }
    ]
  },
  {
    id: 'q2',
    number: 2,
    pillar_id: 'pillar_1',
    pillar_name: 'Financial Health & Statutory Compliance',
    points: 5.0,
    prompt: 'Working capital management and cash flow forecasting',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'No cash flow projection; frequent liquidity crunches' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Informal or mental tracking of bank balances' },
      { rating: 3, label: 'Structured / Good', text: 'Rolling 30-day cash flow forecast maintained' },
      { rating: 4, label: 'Advanced / Optimized', text: '13-week rolling direct cash forecast with variance tracking' }
    ]
  },
  {
    id: 'q3',
    number: 3,
    pillar_id: 'pillar_1',
    pillar_name: 'Financial Health & Statutory Compliance',
    points: 5.0,
    prompt: 'GST filing, reconciliations (GSTR-2B vs Books) and ITC claim accuracy',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Frequent delayed filings, notices, or unverified ITC claims' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Manual checks before filing; occasional 2B reconciliation' },
      { rating: 3, label: 'Structured / Good', text: 'Monthly automated 2B reconciliation; minimal ITC mismatch' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Rigorous monthly reconciliation with vendor follow-up protocol' }
    ]
  },
  {
    id: 'q4',
    number: 4,
    pillar_id: 'pillar_1',
    pillar_name: 'Financial Health & Statutory Compliance',
    points: 5.0,
    prompt: 'Direct Tax & TDS compliance (timely deduction, deposit, quarterly 24Q/26Q returns)',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Occasional default notices or late deposit penalties' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'External accountant handles without internal tracking' },
      { rating: 3, label: 'Structured / Good', text: 'Timely deduction and quarterly reconciliation with Form 26AS/AIS' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Systematic internal pre-audit, zero default history, proactive advance tax planning' }
    ]
  },
  {
    id: 'q5',
    number: 5,
    pillar_id: 'pillar_1',
    pillar_name: 'Financial Health & Statutory Compliance',
    points: 5.0,
    prompt: 'Debtor aging and collections control (Receivables outstanding >90 days)',
    options: [
      { rating: 1, label: 'Poor / Absent', text: '>30% receivables overdue >90 days; no formal collection cycle' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Periodic manual aging review; ad-hoc client reminders' },
      { rating: 3, label: 'Structured / Good', text: 'Bi-weekly aging review; defined credit period enforcement' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Strict credit limits, automated payment reminders, <5% overdue >90 days' }
    ]
  },

  // --- Pillar 2: Sales & Revenue Pipeline (q6 - q9, 5 pts each, max 20) ---
  {
    id: 'q6',
    number: 6,
    pillar_id: 'pillar_2',
    pillar_name: 'Sales & Revenue Pipeline',
    points: 5.0,
    prompt: 'Customer concentration risk (revenue contribution of top 3 clients)',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Top 3 clients contribute >70% of total company revenue' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Top 3 clients contribute 50-70% of revenue' },
      { rating: 3, label: 'Structured / Good', text: 'Top 3 clients contribute 30-50% of revenue' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Top 3 clients contribute <30% of revenue with healthy sector spread' }
    ]
  },
  {
    id: 'q7',
    number: 7,
    pillar_id: 'pillar_2',
    pillar_name: 'Sales & Revenue Pipeline',
    points: 5.0,
    prompt: 'Sales pipeline visibility and lead tracking system',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Word-of-mouth only; no pipeline or inquiry tracking' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Leads recorded in personal notebooks or disconnected sheets' },
      { rating: 3, label: 'Structured / Good', text: 'Centralized spreadsheet or basic CRM with defined deal stages' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Integrated CRM with lead scoring, pipeline velocity, and conversion analytics' }
    ]
  },
  {
    id: 'q8',
    number: 8,
    pillar_id: 'pillar_2',
    pillar_name: 'Sales & Revenue Pipeline',
    points: 5.0,
    prompt: 'Pricing discipline and gross margin tracking by product/service line',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Unclear unit margins; ad-hoc discounting to win business' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Overall company margin known, but individual product/service margins unverified' },
      { rating: 3, label: 'Structured / Good', text: 'Regular gross margin review per service/product; defined discount limits' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Activity-based unit economics with continuous margin optimization' }
    ]
  },
  {
    id: 'q9',
    number: 9,
    pillar_id: 'pillar_2',
    pillar_name: 'Sales & Revenue Pipeline',
    points: 5.0,
    prompt: 'Customer repeat purchase and contract renewal consistency',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'High churn; mostly one-off transactions without repeat strategy' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Informal customer relationships; irregular repeat orders' },
      { rating: 3, label: 'Structured / Good', text: 'Tracked retention rate; structured follow-up for renewals/re-orders' },
      { rating: 4, label: 'Advanced / Optimized', text: 'High customer lifetime value (LTV), formal account management, >75% recurring/repeat business' }
    ]
  },

  // --- Pillar 3: Marketing & Brand Positioning (q10 - q13, 3.75 pts each, max 15) ---
  {
    id: 'q10',
    number: 10,
    pillar_id: 'pillar_3',
    pillar_name: 'Marketing & Brand Positioning',
    points: 3.75,
    prompt: 'Brand identity, website presence, and digital touchpoints',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'No functional website or outdated profile; inconsistent branding' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Basic informational website; inactive online presence' },
      { rating: 3, label: 'Structured / Good', text: 'Professional responsive website with clear service catalog and active profiles' },
      { rating: 4, label: 'Advanced / Optimized', text: 'High-conversion digital presence, authoritative domain, video assets, and structured thought leadership' }
    ]
  },
  {
    id: 'q11',
    number: 11,
    pillar_id: 'pillar_3',
    pillar_name: 'Marketing & Brand Positioning',
    points: 3.75,
    prompt: 'Customer acquisition cost (CAC) and marketing channel ROI tracking',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Marketing spend untracked; zero visibility into customer acquisition cost' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Total marketing budget known, but channel-specific conversion unknown' },
      { rating: 3, label: 'Structured / Good', text: 'Channel-wise lead cost tracking (online vs offline channels)' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Full attribution model with CAC vs LTV ratio optimization' }
    ]
  },
  {
    id: 'q12',
    number: 12,
    pillar_id: 'pillar_3',
    pillar_name: 'Marketing & Brand Positioning',
    points: 3.75,
    prompt: 'Customer feedback, testimonials, and online reputation management',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'No systematic feedback collection; unaddressed online reviews' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Occasional verbal feedback; few ad-hoc customer quotes' },
      { rating: 3, label: 'Structured / Good', text: 'Systematic post-service feedback collection; proactive Google Reviews' },
      { rating: 4, label: 'Advanced / Optimized', text: 'High Net Promoter Score (NPS), video case studies, robust brand reputation across platforms' }
    ]
  },
  {
    id: 'q13',
    number: 13,
    pillar_id: 'pillar_3',
    pillar_name: 'Marketing & Brand Positioning',
    points: 3.75,
    prompt: 'Marketing collateral and sales enablement materials',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'No formal pitch decks, service brochures, or one-pagers' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Outdated PDF brochures sent upon specific request' },
      { rating: 3, label: 'Structured / Good', text: 'Modern digital brochures, standardized service rate cards, and presentation decks' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Comprehensive sales collateral suite, tailored industry case studies, and interactive proposals' }
    ]
  },

  // --- Pillar 4: Operational Efficiency & SOPs (q14 - q17, 3.75 pts each, max 15) ---
  {
    id: 'q14',
    number: 14,
    pillar_id: 'pillar_4',
    pillar_name: 'Operational Efficiency & SOPs',
    points: 3.75,
    prompt: 'Standard Operating Procedures (SOPs) and workflow documentation',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Operational knowledge resides entirely in founders’ or key employees’ heads' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Informal notes or email instructions; oral handover during hiring' },
      { rating: 3, label: 'Structured / Good', text: 'Documented SOPs for core repetitive service/manufacturing processes' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Comprehensive digital SOP library with training checklists and periodic compliance audits' }
    ]
  },
  {
    id: 'q15',
    number: 15,
    pillar_id: 'pillar_4',
    pillar_name: 'Operational Efficiency & SOPs',
    points: 3.75,
    prompt: 'Key Person Dependency (business continuity without founder/promoter)',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Operations stall completely if founder is absent for more than 7 days' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Founder required for all operational decisions, approvals, and banking transactions' },
      { rating: 3, label: 'Structured / Good', text: 'Department leads manage daily execution; founder handles strategy & major escalations' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Autonomous second-line leadership running operations seamlessly via delegation matrix' }
    ]
  },
  {
    id: 'q16',
    number: 16,
    pillar_id: 'pillar_4',
    pillar_name: 'Operational Efficiency & SOPs',
    points: 3.75,
    prompt: 'Supply chain, vendor management, and procurement efficiency',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Single source for critical supplies; unpredictable pricing and stockouts' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Multiple vendors but no written agreements or competitive price comparison' },
      { rating: 3, label: 'Structured / Good', text: 'Approved vendor list, formal purchase orders, and negotiated payment terms' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Strategic vendor contracts, SLA tracking, volume discounting, and buffer stock optimization' }
    ]
  },
  {
    id: 'q17',
    number: 17,
    pillar_id: 'pillar_4',
    pillar_name: 'Operational Efficiency & SOPs',
    points: 3.75,
    prompt: 'Quality control, defect rates, and error resolution mechanisms',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Client complaints handled ad-hoc; recurring operational defects' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Errors corrected as they arise; basic tracking in spreadsheet' },
      { rating: 3, label: 'Structured / Good', text: 'Formal QA checklist before delivery; root-cause review for escalations' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Rigorous quality standards, error logging, and continuous process re-engineering' }
    ]
  },

  // --- Pillar 5: IT, Systems & Digital Readiness (q18 - q21, 3.75 pts each, max 15) ---
  {
    id: 'q18',
    number: 18,
    pillar_id: 'pillar_5',
    pillar_name: 'IT, Systems & Digital Readiness',
    points: 3.75,
    prompt: 'Core business software (Accounting, ERP, Inventory) integration',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Manual paper registers or disconnected standalone desktop sheets' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Basic accounting software used purely for billing; disconnected inventory' },
      { rating: 3, label: 'Structured / Good', text: 'Integrated accounting & inventory system (e.g. Tally Prime, Zoho Books) with regular backups' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Cloud ERP interconnecting sales, inventory, procurement, and banking with API sync' }
    ]
  },
  {
    id: 'q19',
    number: 19,
    pillar_id: 'pillar_5',
    pillar_name: 'IT, Systems & Digital Readiness',
    points: 3.75,
    prompt: 'Data security, cloud backups, and disaster recovery protocol',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'No automated backups; high vulnerability to hardware failure or ransomware' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Manual external drive backup taken irregularly' },
      { rating: 3, label: 'Structured / Good', text: 'Automated daily cloud backup with access control and antivirus protection' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Encrypted off-site backups, role-based access control (RBAC), multi-factor authentication (MFA), tested disaster recovery' }
    ]
  },
  {
    id: 'q20',
    number: 20,
    pillar_id: 'pillar_5',
    pillar_name: 'IT, Systems & Digital Readiness',
    prompt: 'Team collaboration, task management, and digital communication tools',
    points: 3.75,
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Unstructured communication via personal chat; lost instructions and files' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Email and basic chat without centralized project or task tracking' },
      { rating: 3, label: 'Structured / Good', text: 'Enterprise workspace (Google Workspace / Microsoft 365) with structured cloud storage' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Integrated task management (e.g. ClickUp, Asana) with cross-team accountability tracking' }
    ]
  },
  {
    id: 'q21',
    number: 21,
    pillar_id: 'pillar_5',
    pillar_name: 'IT, Systems & Digital Readiness',
    points: 3.75,
    prompt: 'Cybersecurity awareness, software licensing, and device management',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Unlicensed/pirated software; default passwords; zero security awareness' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Genuine OS but unverified utility tools; basic antivirus' },
      { rating: 3, label: 'Structured / Good', text: 'Licensed enterprise software across team machines; active endpoint firewalls' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Strict endpoint security policy, centralized device administration, and periodic cyber hygiene checks' }
    ]
  },

  // --- Pillar 6: Governance, Legal & IPR Protection (q22 - q25, 2.5 pts each, max 10) ---
  {
    id: 'q22',
    number: 22,
    pillar_id: 'pillar_6',
    pillar_name: 'Governance, Legal & IPR Protection',
    points: 2.5,
    prompt: 'Entity structure, statutory licenses, and regulatory registrations',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Operating with missing or lapsed mandatory licenses (Shop Act, MSME, FSSAI, etc.)' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Basic registrations exist but renewal dates are not tracked systematically' },
      { rating: 3, label: 'Structured / Good', text: 'Appropriate legal structure (Pvt Ltd, LLP, Partnership) with updated registrations' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Flawless regulatory compliance tracker with advance automated renewal calendar' }
    ]
  },
  {
    id: 'q23',
    number: 23,
    pillar_id: 'pillar_6',
    pillar_name: 'Governance, Legal & IPR Protection',
    points: 2.5,
    prompt: 'Intellectual Property Rights (IPR) — Trademark, Copyright, Patents',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Brand name / logo unregistered; risk of trademark infringement notices' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Trademark application filed but objections or examination reports unaddressed' },
      { rating: 3, label: 'Structured / Good', text: 'Registered trademark (TM/R) for primary brand name and logo' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Comprehensive IPR portfolio including brand, copyright, design patents, and non-compete IP assignments' }
    ]
  },
  {
    id: 'q24',
    number: 24,
    pillar_id: 'pillar_6',
    pillar_name: 'Governance, Legal & IPR Protection',
    points: 2.5,
    prompt: 'Contracts, NDAs, and agreements with clients, vendors, and staff',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Verbal agreements or informal chat confirmations for key commercial relationships' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Generic internet templates used without professional legal vetting' },
      { rating: 3, label: 'Structured / Good', text: 'Vetted standard agreements (client contracts, vendor agreements, employee NDAs)' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Robust contract lifecycle management with limitation of liability, indemnity, and jurisdiction terms' }
    ]
  },
  {
    id: 'q25',
    number: 25,
    pillar_id: 'pillar_6',
    pillar_name: 'Governance, Legal & IPR Protection',
    points: 2.5,
    prompt: 'Corporate governance, secretarial compliance, and board records',
    options: [
      { rating: 1, label: 'Poor / Absent', text: 'Minutes, share records, or annual ROC filings delayed or neglected' },
      { rating: 2, label: 'Basic / Ad-hoc', text: 'Annual filings submitted by external CS at year-end with limited board documentation' },
      { rating: 3, label: 'Structured / Good', text: 'Regular board meetings recorded, annual ROC returns filed within statutory timelines' },
      { rating: 4, label: 'Advanced / Optimized', text: 'Exemplary governance, structured minutes book, clean cap table, investor-ready corporate records' }
    ]
  }
];

/**
 * Calculates the deterministic business health score from submitted question answers.
 * 
 * Rating mapping:
 * rating 1 -> 0% earned (0 / 3)
 * rating 2 -> 33.333% earned (1 / 3)
 * rating 3 -> 66.667% earned (2 / 3)
 * rating 4 -> 100% earned (3 / 3)
 * 
 * Points earned for a question:
 *   pointsEarned = ((rating - 1) / 3) * questionPoints
 * 
 * @param {Object} rawAnswers - Map of question IDs (q1..q25 or 1..25) to rating integers (1..4)
 * @returns {Object} Comprehensive scoring result matching BusinessHealthReport schema
 */
function calculateHealthScore(rawAnswers = {}) {
  const validQuestionIds = new Set(QUESTIONS.map(q => q.id));

  // Normalize answer keys to lowercase 'q1'..'q25' (ignoring invalid or extraneous keys)
  const normalizedAnswers = {};
  if (rawAnswers && typeof rawAnswers === 'object') {
    for (const [key, value] of Object.entries(rawAnswers)) {
      const cleanKey = String(key).trim().toLowerCase();
      const standardKey = cleanKey.startsWith('q') ? cleanKey : `q${cleanKey}`;
      
      // Ensure only valid question IDs that exist in the QUESTIONS specification are tracked
      if (validQuestionIds.has(standardKey)) {
        const numVal = Number.isInteger(value) ? value : parseInt(value, 10);
        if (Number.isFinite(numVal) && numVal >= 1 && numVal <= 4) {
          normalizedAnswers[standardKey] = numVal;
        } else {
          // If unrated or invalid rating, defaults to 1 (Poor / 0% earned)
          normalizedAnswers[standardKey] = 1;
        }
      }
    }
  }

  // Question-by-question scoring
  const questionScores = [];
  let totalEarnedPoints = 0;

  for (const q of QUESTIONS) {
    const rating = normalizedAnswers[q.id] || 1;
    const fraction = (rating - 1) / 3.0; // 1->0, 2->1/3, 3->2/3, 4->1
    const earned = fraction * q.points;
    totalEarnedPoints += earned;

    questionScores.push({
      id: q.id,
      number: q.number,
      pillar_id: q.pillar_id,
      prompt: q.prompt,
      rating,
      points_earned: Math.round(earned * 100) / 100,
      max_points: q.points
    });
  }

  // Pillar-by-pillar aggregation
  const pillarScores = PILLARS.map(pillar => {
    const questionsInPillar = questionScores.filter(q => q.pillar_id === pillar.id);
    const earnedScore = questionsInPillar.reduce((sum, q) => sum + q.points_earned, 0);
    const roundedScore = Math.round(earnedScore * 10) / 10;
    const percentage = Math.round((earnedScore / pillar.max_score) * 1000) / 10; // e.g. 73.3

    let status = 'Attention Needed';
    if (percentage >= 80.0) {
      status = 'Good';
    } else if (percentage >= 50.0) {
      status = 'Average';
    } else {
      status = 'Attention Needed';
    }

    return {
      pillar_name: pillar.name,
      score: roundedScore,
      max_score: pillar.max_score,
      status,
      pillar_id: pillar.id,
      short_name: pillar.short_name,
      weight_percentage: pillar.weight_percentage,
      percentage
    };
  });

  // Calculate overall score (0 to 100)
  const roundedOverall = Math.min(100, Math.max(0, Math.round(totalEarnedPoints * 10) / 10));

  // Determine Risk Band
  let riskBand = 'Critical';
  if (roundedOverall >= 80.0) {
    riskBand = 'Strong';
  } else if (roundedOverall >= 60.0) {
    riskBand = 'Moderate';
  } else if (roundedOverall >= 40.0) {
    riskBand = 'Vulnerable';
  } else {
    riskBand = 'Critical';
  }

  return {
    overall_score: roundedOverall,
    risk_band: riskBand,
    risk_band_details: RISK_BANDS[riskBand],
    pillar_scores: pillarScores,
    question_breakdown: questionScores,
    answered_count: Object.keys(normalizedAnswers).length,
    total_questions: QUESTIONS.length
  };
}

module.exports = {
  calculateHealthScore,
  PILLARS,
  QUESTIONS,
  RISK_BANDS
};
