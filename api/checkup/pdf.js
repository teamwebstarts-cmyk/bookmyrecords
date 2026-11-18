/**
 * BookMyRecords — server-side PDF generation for the full Business Health Report.
 * Uses pdf-lib (zero transitive dependencies). Kept out of analyze.js intentionally.
 */

'use strict';

const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const INK = rgb(0.12, 0.16, 0.27);
const BLUE = rgb(0.043, 0.365, 0.839);
const GREY = rgb(0.42, 0.46, 0.52);
const YELLOW = rgb(1, 0.784, 0.31);

function safeText(value) {
  return String(value == null ? '' : value)
    .replace(/\u20B9/g, 'Rs.')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapText(text, font, size, maxWidth) {
  const words = safeText(text).split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function generateReportPdf(report) {
  if (!report || typeof report !== 'object') throw new Error('report is required');

  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const meta = report.meta || {};
  const scores = report.scores || {};
  const reportId = safeText(meta.report_id || (report._meta && report._meta.report_id) || 'BMR-REPORT');

  let page = doc.addPage([595, 842]);
  let y = 800;
  const left = 48;
  const width = 499;

  function newPage() {
    page = doc.addPage([595, 842]);
    y = 800;
  }

  function ensure(space) {
    if (y - space < 56) newPage();
  }

  function rule() {
    ensure(10);
    page.drawRectangle({ x: left, y, width, height: 1, color: YELLOW });
    y -= 14;
  }

  function heading(text, size = 13) {
    ensure(size + 18);
    y -= 4;
    const lines = wrapText(text, bold, size, width);
    for (const line of lines) {
      ensure(size + 6);
      page.drawText(line, { x: left, y, size, font: bold, color: BLUE });
      y -= size + 6;
    }
    rule();
  }

  function paragraph(text, size = 9.5, font = regular, color = INK) {
    const lines = wrapText(text, font, size, width);
    for (const line of lines) {
      ensure(size + 4);
      page.drawText(line, { x: left, y, size, font, color });
      y -= size + 4;
    }
    y -= 5;
  }

  function bullet(text, size = 9.5) {
    const lines = wrapText(text, regular, size, width - 16);
    for (let i = 0; i < lines.length; i++) {
      ensure(size + 4);
      page.drawText(i === 0 ? '-' : ' ', { x: left, y, size, font: bold, color: BLUE });
      page.drawText(lines[i], { x: left + 16, y, size, font: regular, color: INK });
      y -= size + 4;
    }
  }

  function labelled(label, value) {
    ensure(15);
    page.drawText(safeText(label), { x: left, y, size: 9, font: bold, color: GREY });
    page.drawText(safeText(value), { x: left + 120, y, size: 9, font: regular, color: INK });
    y -= 14;
  }

  // Cover block
  page.drawRectangle({ x: 0, y: 760, width: 595, height: 82, color: BLUE });
  page.drawText('BOOK MY RECORDS', { x: left, y: 808, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText('Business Health Report', { x: left, y: 784, size: 11, font: regular, color: rgb(1, 1, 1) });
  page.drawText(reportId, { x: 400, y: 808, size: 9, font: regular, color: rgb(1, 1, 1) });
  y = 742;

  labelled('Company:', meta.company_name || '-');
  labelled('Industry:', meta.industry || '-');
  labelled('Turnover:', meta.turnover_band || '-');
  labelled('Assessed:', meta.assessment_date || (report._meta && report._meta.processed_at) || '-');
  labelled('Report ID:', reportId);
  rule();

  heading('Overall Health Score');
  labelled('Score:', `${scores.overall_score != null ? scores.overall_score : '-'} / 100`);
  labelled('Risk band:', scores.risk_band || '-');
  rule();

  if (Array.isArray(scores.pillar_scores) && scores.pillar_scores.length) {
    heading('Pillar Scores');
    for (const p of scores.pillar_scores) {
      bullet(`${p.pillar_name || 'Pillar'}: ${p.score != null ? p.score : '-'}/${p.max_score != null ? p.max_score : '-'} (${p.status || '-'})`);
    }
  }

  if (report.executive_summary) {
    heading('Executive Summary');
    paragraph(report.executive_summary);
  }

  if (Array.isArray(report.key_strengths) && report.key_strengths.length) {
    heading('Key Strengths');
    for (const item of report.key_strengths) bullet(`${item.title || ''} — ${item.explanation || ''}`);
  }

  if (Array.isArray(report.critical_gaps) && report.critical_gaps.length) {
    heading('Critical Gaps');
    for (const item of report.critical_gaps) {
      bullet(`${item.pillar || ''} [${item.severity || ''}]: ${item.finding || ''} Impact: ${item.impact || ''}`);
    }
  }

  if (Array.isArray(report.key_observations) && report.key_observations.length) {
    heading('Key Observations');
    for (const item of report.key_observations) bullet(item);
  }

  if (Array.isArray(report.risks_and_vulnerabilities) && report.risks_and_vulnerabilities.length) {
    heading('Risks & Vulnerabilities');
    for (const item of report.risks_and_vulnerabilities) {
      bullet(`${item.risk_title || ''} (${item.likelihood || ''}/${item.impact_severity || ''}): ${item.mitigation || ''}`);
    }
  }

  const plan = report.priority_action_plan || {};
  if (Array.isArray(plan.immediate_30_days) && plan.immediate_30_days.length) {
    heading('Immediate — Next 30 Days');
    for (const item of plan.immediate_30_days) bullet(item);
  }
  if (Array.isArray(plan.medium_term_60_days) && plan.medium_term_60_days.length) {
    heading('Medium Term — 60 Days');
    for (const item of plan.medium_term_60_days) bullet(item);
  }
  if (Array.isArray(plan.strategic_90_days) && plan.strategic_90_days.length) {
    heading('Strategic — 90 Days');
    for (const item of plan.strategic_90_days) bullet(item);
  }

  if (Array.isArray(report.missing_or_unverified_info) && report.missing_or_unverified_info.length) {
    heading('Missing or Unverified Information');
    for (const item of report.missing_or_unverified_info) bullet(item);
  }

  if (Array.isArray(report.consultation_agenda) && report.consultation_agenda.length) {
    heading('Consultation Agenda');
    for (const item of report.consultation_agenda) bullet(item);
  }

  const pageCount = doc.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const p = doc.getPage(i);
    p.drawText(`BookMyRecords | ${reportId} | Preliminary - subject to consultant review`, {
      x: left, y: 30, size: 7.5, font: regular, color: GREY
    });
    p.drawText(`Page ${i + 1} of ${pageCount}`, {
      x: 470, y: 30, size: 7.5, font: regular, color: GREY
    });
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

function pdfFilename(reportId) {
  const safe = String(reportId || 'BMR-REPORT').replace(/[^A-Za-z0-9_-]/g, '_');
  return `${safe}.pdf`;
}

module.exports = { generateReportPdf, pdfFilename, safeText };
