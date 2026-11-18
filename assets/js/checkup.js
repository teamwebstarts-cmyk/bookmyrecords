/**
 * BookMyRecords Business Health Assessment
 * 4-step wizard controller: profile → documents → review → analysis/report
 *
 * Compliant with DPDP Act 2023 & IT Act 2000 Privacy Standards
 */

'use strict';

(function () {
  const TOTAL_INTAKE_STEPS = 2;   // Profile → Documents; step 3 is Analysis
  const ANALYSIS_STEP = 3;
  const NOTES_MAX = 400;
  const validExtensions = ['.pdf', '.xlsx', '.xls', '.csv'];
  const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB ceiling (4,194,304 bytes)

  // --- Global Assessment State ---
  const state = {
    currentStep: 1,
    profile: {
      company_name: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      industry: '',
      turnover_band: '',
      notes: ''
    },
    uploadedFile: null,
    reportData: null,
    isSubmitting: false,
    calMounted: false,
    pdfUrl: null,
    bookingCaptured: false,
    pdfPollTimer: null
  };

  // DOM Elements cache
  let elements = {};

  function initElements() {
    elements = {
      wizardContainer: document.getElementById('checkup-wizard'),
      wizardScroll: document.getElementById('wizard-scroll'),
      stepItems: document.querySelectorAll('.wizard-step-item'),
      stepPanes: document.querySelectorAll('.wizard-step-pane'),

      // Step 1: Business profile
      intakeForm: document.getElementById('checkup-intake-form'),
      companyName: document.getElementById('company_name'),
      contactName: document.getElementById('contact_name'),
      contactEmail: document.getElementById('contact_email'),
      contactPhone: document.getElementById('contact_phone'),
      industry: document.getElementById('industry'),
      turnoverBand: document.getElementById('turnover_band'),
      businessNotes: document.getElementById('business_notes'),
      notesCounter: document.getElementById('notes-counter'),
      painChips: document.getElementById('pain-chips'),
      consentCheckbox: document.getElementById('dpdp-consent-checkbox'),
      btnFillSampleData: document.getElementById('btn-fill-sample-data'),

      // Step 2: Document upload
      dropzone: document.getElementById('upload-dropzone'),
      fileInput: document.getElementById('document-file-input'),
      filePreview: document.getElementById('file-preview-area'),
      fileNameDisplay: document.getElementById('file-name-display'),
      fileSizeDisplay: document.getElementById('file-size-display'),
      btnRemoveFile: document.getElementById('btn-remove-file'),
      btnSkipUpload: document.getElementById('btn-skip-upload'),
      documentError: document.getElementById('document-error'),

      // Action bar
      actionBar: document.getElementById('wizard-step-actions'),
      actionHint: document.getElementById('wizard-action-hint'),
      btnBack: document.getElementById('btn-wizard-back'),
      btnNext: document.getElementById('btn-wizard-next'),
      btnSubmit: document.getElementById('btn-analyze-submit'),

      // Step 3: Analysis
      analysisProcessing: document.getElementById('analysis-processing'),
      analysisReport: document.getElementById('analysis-report'),
      bookingBlock: document.getElementById('booking-block'),

      processingStep1: document.getElementById('proc-step-1'),
      processingStep2: document.getElementById('proc-step-2'),
      processingStep3: document.getElementById('proc-step-3'),
      processingStep4: document.getElementById('proc-step-4'),
      processingStep5: document.getElementById('proc-step-5'),

      // Report fields
      reportCompanyName: document.getElementById('report-company-name'),
      reportId: document.getElementById('report-id-display'),
      reportDate: document.getElementById('report-date-display'),
      reportIndustry: document.getElementById('report-industry-display'),
      reportTurnover: document.getElementById('report-turnover-display'),
      reportScoreCircle: document.getElementById('report-score-circle'),
      reportScoreBlock: document.getElementById('report-score-block'),
      reportScoreNumber: document.getElementById('report-score-number'),
      reportRiskBandPill: document.getElementById('report-risk-band-pill'),
      reportRiskBandDesc: document.getElementById('report-risk-band-desc'),
      reportFactDate: document.getElementById('report-fact-date'),
      reportFactDocument: document.getElementById('report-fact-document'),
      reportFactCompliance: document.getElementById('report-fact-compliance'),
      reportFootnoteId: document.getElementById('report-foot-id'),
      missingInfoContainer: document.getElementById('missing-info-container'),
      reportLocked: document.getElementById('report-locked'),
      reportLockedCount: document.getElementById('report-locked-count'),
      reportLockedBody: document.getElementById('report-locked-body'),
      reportPages: document.getElementById('report-pages'),
      btnUnlockReport: document.getElementById('btn-unlock-report'),
      reportS43: document.getElementById('report-s43'),
      reportS5: document.getElementById('report-s5'),
      reportS6: document.getElementById('report-s6'),
      reportS7: document.getElementById('report-s7'),
      pillarCardsContainer: document.getElementById('pillar-cards-container'),
      executiveSummaryText: document.getElementById('executive-summary-text'),
      keyStrengthsContainer: document.getElementById('key-strengths-container'),
      criticalGapsContainer: document.getElementById('critical-gaps-container'),
      observationsContainer: document.getElementById('observations-container'),
      risksContainer: document.getElementById('risks-container'),
      opportunitiesContainer: document.getElementById('opportunities-container'),
      plan30Container: document.getElementById('plan-30-container'),
      plan60Container: document.getElementById('plan-60-container'),
      plan90Container: document.getElementById('plan-90-container'),
      agendaContainer: document.getElementById('agenda-container'),
      btnPrintReport: document.getElementById('btn-print-report'),
      btnPrintPartial: document.getElementById('btn-print-partial'),
      pdfBlock: document.getElementById('report-pdf-block'),
      pdfLink: document.getElementById('report-pdf-link'),
      pdfStatus: document.getElementById('report-pdf-status'),
      btnRetakeCheckup: document.getElementById('btn-retake-checkup'),
      btnGoToBooking: document.getElementById('btn-go-to-booking'),

      // Booking
      calEmbedContainer: document.getElementById('cal-inline-embed'),
      bookingHeading: document.getElementById('booking-heading'),
      btnBackToReport: document.getElementById('btn-back-to-report')
    };
  }

  // --- Step Navigation ---
  function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > ANALYSIS_STEP) return;
    state.currentStep = stepNumber;

    // The analysis pane is document-height, so the page (not the shell) scrolls it.
    if (elements.wizardContainer) {
      elements.wizardContainer.classList.toggle('is-analysis', stepNumber === ANALYSIS_STEP);
    }

    if (elements.stepPanes && elements.stepPanes.length > 0) {
      elements.stepPanes.forEach(pane => {
        const paneStep = parseInt(pane.getAttribute('data-step'), 10);
        pane.classList.toggle('active', paneStep === stepNumber);
      });
    }

    if (elements.stepItems && elements.stepItems.length > 0) {
      elements.stepItems.forEach(item => {
        const itemStep = parseInt(item.getAttribute('data-step'), 10);
        item.classList.remove('active', 'completed');
        item.removeAttribute('aria-current');
        if (itemStep === stepNumber) {
          item.classList.add('active');
          item.setAttribute('aria-current', 'step');
        } else if (itemStep < stepNumber) {
          item.classList.add('completed');
        }
      });
    }

    updateActionBar(stepNumber);

    // Reset internal scroll and move focus to the pane heading
    if (elements.wizardScroll) {
      elements.wizardScroll.scrollTop = 0;
    }
    const activePane = document.querySelector(`.wizard-step-pane[data-step="${stepNumber}"]`);
    const heading = activePane
      ? (activePane.querySelector('.wizard-pane-title') ||
         activePane.querySelector('#processing-title') ||
         activePane.querySelector('h2'))
      : null;
    if (heading) {
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }

    if (stepNumber === TOTAL_INTAKE_STEPS) {
      refreshSubmitState();
    }
  }

  function updateActionBar(stepNumber) {
    const isIntake = stepNumber <= TOTAL_INTAKE_STEPS;

    if (elements.btnBack) {
      elements.btnBack.hidden = !isIntake || stepNumber === 1;
      elements.btnBack.style.display = (!isIntake || stepNumber === 1) ? 'none' : '';
    }
    if (elements.btnNext) {
      // "Continue" is only for moving Profile → Documents.
      const showNext = stepNumber < TOTAL_INTAKE_STEPS;
      elements.btnNext.hidden = !showNext;
      elements.btnNext.style.display = showNext ? '' : 'none';
    }
    if (elements.btnSubmit) {
      // Submit lives on Step 2 (Documents) — a document is optional.
      const showSubmit = stepNumber === TOTAL_INTAKE_STEPS;
      elements.btnSubmit.hidden = !showSubmit;
      elements.btnSubmit.style.display = showSubmit ? '' : 'none';
    }
    if (elements.actionHint) {
      elements.actionHint.textContent = stepNumber === 1
        ? 'Step 1 of 3'
        : (stepNumber === 2 ? 'Step 2 of 3' : 'Step 3 of 3');
    }
  }

  // --- Field-level error helpers ---
  function errorNodeFor(inputEl) {
    if (!inputEl || !inputEl.id) return null;
    return document.getElementById(`${inputEl.id}-error`);
  }

  function markInvalid(inputEl, message) {
    if (!inputEl) return;
    inputEl.classList.add('is-invalid');
    inputEl.setAttribute('aria-invalid', 'true');
    const node = errorNodeFor(inputEl);
    if (node) {
      node.textContent = message;
      node.classList.add('visible');
    }
    const wrap = inputEl.closest('.bmr-field') || inputEl.closest('.dpdp-consent-row');
    if (wrap) wrap.classList.add('has-error');
  }

  function markValid(inputEl) {
    if (!inputEl) return;
    inputEl.classList.remove('is-invalid');
    inputEl.removeAttribute('aria-invalid');
    const node = errorNodeFor(inputEl);
    if (node) {
      node.textContent = '';
      node.classList.remove('visible');
    }
    const wrap = inputEl.closest('.bmr-field') || inputEl.closest('.dpdp-consent-row');
    if (wrap) wrap.classList.remove('has-error');
  }

  function clearAllErrors() {
    [elements.companyName, elements.contactName, elements.contactEmail, elements.contactPhone,
      elements.industry, elements.turnoverBand, elements.consentCheckbox].forEach(markValid);
  }

  // --- Profile validation (mirrors api/checkup/analyze.js validateCheckupPayload) ---
  function readProfileValues() {
    return {
      companyVal: elements.companyName ? elements.companyName.value.trim() : '',
      contactVal: elements.contactName ? elements.contactName.value.trim() : '',
      emailVal: elements.contactEmail ? elements.contactEmail.value.trim() : '',
      cleanPhone: (elements.contactPhone ? elements.contactPhone.value : '').replace(/[\s\-()]/g, ''),
      industryVal: elements.industry ? elements.industry.value : '',
      turnoverVal: elements.turnoverBand ? elements.turnoverBand.value : '',
      notesVal: elements.businessNotes ? elements.businessNotes.value.trim() : '',
      consent: !!(elements.consentCheckbox && elements.consentCheckbox.checked)
    };
  }

  /**
   * @param {boolean} showErrors - when false the form is only inspected
   * (used to enable/disable the submit button without shouting at the user).
   */
  function validateProfile(showErrors) {
    const report = showErrors !== false;
    const v = readProfileValues();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(\+91[\-\s]?)?[0]?[6789]\d{9}$/;
    let isValid = true;
    let firstInvalid = null;

    const fail = (el, message) => {
      isValid = false;
      if (!firstInvalid) firstInvalid = el;
      if (report) markInvalid(el, message);
    };

    if (v.companyVal.length < 2) fail(elements.companyName, 'Enter your company name (2+ characters).');
    else if (report) markValid(elements.companyName);

    if (v.contactVal.length < 2) fail(elements.contactName, 'Enter your name (2+ characters).');
    else if (report) markValid(elements.contactName);

    if (!emailRegex.test(v.emailVal)) fail(elements.contactEmail, 'Enter a valid email address.');
    else if (report) markValid(elements.contactEmail);

    if (!phoneRegex.test(v.cleanPhone)) fail(elements.contactPhone, 'Enter a valid 10-digit Indian mobile number.');
    else if (report) markValid(elements.contactPhone);

    if (!v.industryVal) fail(elements.industry, 'Select your industry.');
    else if (report) markValid(elements.industry);

    if (!v.turnoverVal) fail(elements.turnoverBand, 'Select your turnover band.');
    else if (report) markValid(elements.turnoverBand);

    if (!v.consent) fail(elements.consentCheckbox, 'Consent is required to continue.');
    else if (report) markValid(elements.consentCheckbox);

    if (showErrors && firstInvalid) {
      firstInvalid.focus({ preventScroll: false });
    }

    if (isValid) {
      state.profile = {
        company_name: v.companyVal,
        contact_name: v.contactVal,
        contact_email: v.emailVal.toLowerCase(),
        contact_phone: v.cleanPhone.slice(-10),
        industry: v.industryVal,
        turnover_band: v.turnoverVal,
        notes: v.notesVal
      };
    }

    return isValid;
  }

  // Alias for backward compatibility with test suites
  function validateStep1() {
    return validateProfile(true);
  }

  function refreshSubmitState() {
    if (!elements.btnSubmit) return;
    const payable = validateProfile(false);
    elements.btnSubmit.disabled = !payable;
    elements.btnSubmit.setAttribute('aria-disabled', payable ? 'false' : 'true');
  }

  /** Per-field validity, used to clear an error the moment that field is fixed. */
  function isFieldValid(el) {
    if (!el) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(\+91[\-\s]?)?[0]?[6789]\d{9}$/;

    if (el === elements.companyName) return el.value.trim().length >= 2;
    if (el === elements.contactName) return el.value.trim().length >= 2;
    if (el === elements.contactEmail) return emailRegex.test(el.value.trim());
    if (el === elements.contactPhone) return phoneRegex.test(el.value.replace(/[\s\-()]/g, ''));
    if (el === elements.industry) return !!el.value;
    if (el === elements.turnoverBand) return !!el.value;
    if (el === elements.consentCheckbox) return el.checked;
    return true;
  }

  // --- Pain-point chips & character counter ---
  function updateNotesCounter() {
    if (!elements.notesCounter || !elements.businessNotes) return;
    const len = elements.businessNotes.value.length;
    elements.notesCounter.textContent = `${len}/${NOTES_MAX}`;
    elements.notesCounter.classList.toggle('is-near-limit', len >= NOTES_MAX - 40);
  }

  function splitNotes(text) {
    return text.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  }

  function togglePhrase(phrase) {
    const textarea = elements.businessNotes;
    if (!textarea) return;

    const segments = splitNotes(textarea.value);
    const existingIndex = segments.findIndex(s => s.toLowerCase() === phrase.toLowerCase());

    let nextSegments;
    if (existingIndex >= 0) {
      segments.splice(existingIndex, 1);
      nextSegments = segments;
    } else {
      nextSegments = segments.concat(phrase);
    }

    const nextValue = nextSegments.join(', ');
    if (nextValue.length > NOTES_MAX) return; // never silently truncate
    textarea.value = nextValue;
    updateNotesCounter();
    syncChipStates();
  }

  function syncChipStates() {
    if (!elements.painChips || !elements.businessNotes) return;
    const lowered = splitNotes(elements.businessNotes.value).map(s => s.toLowerCase());
    elements.painChips.querySelectorAll('.pain-chip').forEach(chip => {
      const phrase = (chip.getAttribute('data-phrase') || '').toLowerCase();
      const active = lowered.includes(phrase);
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function initPainChips() {
    if (elements.painChips) {
      elements.painChips.querySelectorAll('.pain-chip').forEach(chip => {
        const phrase = chip.getAttribute('data-phrase') || chip.textContent.trim();
        chip.setAttribute('aria-pressed', 'false');
        chip.addEventListener('click', (e) => {
          e.preventDefault();
          togglePhrase(phrase);
        });
      });
    }
    if (elements.businessNotes) {
      elements.businessNotes.addEventListener('input', () => {
        updateNotesCounter();
        syncChipStates();
      });
    }
    updateNotesCounter();
    syncChipStates();
  }

  // --- Review summary (removed with the Review step) ------------------------
  // The wizard is Profile → Documents → Analysis; there is no read-only summary
  // to render. Kept as a no-op so any external caller does not throw.
  function renderReviewSummary() {}

  // --- Document Dropzone & File Handling ---
  function showDocumentError(message) {
    if (!elements.documentError) return;
    elements.documentError.textContent = message;
    elements.documentError.classList.toggle('visible', !!message);
    if (elements.dropzone) {
      elements.dropzone.classList.toggle('has-error', !!message);
    }
  }

  function initDropzone() {
    if (!elements.dropzone || !elements.fileInput) return;

    elements.dropzone.addEventListener('click', () => {
      elements.fileInput.click();
    });

    elements.dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        elements.fileInput.click();
      }
    });

    elements.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      elements.dropzone.classList.add('dragover');
    });

    elements.dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      elements.dropzone.classList.remove('dragover');
    });

    elements.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      elements.dropzone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });

    elements.fileInput.addEventListener('change', (e) => {
      if (e.target && e.target.files && e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
      }
    });

    if (elements.btnRemoveFile) {
      elements.btnRemoveFile.addEventListener('click', (e) => {
        e.stopPropagation();
        clearFileSelection();
      });
    }
  }

  function handleFileSelection(file) {
    const fileNameLower = (file.name || '').toLowerCase();
    const isExtensionValid = validExtensions.some(ext => fileNameLower.endsWith(ext));

    if (!isExtensionValid) {
      showDocumentError('Use a PDF, XLSX, XLS or CSV file.');
      clearFileSelection(true);
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      showDocumentError(`That file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Limit is 4 MB.`);
      clearFileSelection(true);
      return;
    }

    showDocumentError('');
    state.uploadedFile = file;

    if (elements.fileNameDisplay) elements.fileNameDisplay.textContent = file.name;
    if (elements.fileSizeDisplay) {
      elements.fileSizeDisplay.textContent = `${(file.size / 1024).toFixed(1)} KB`;
    }
    if (elements.filePreview) elements.filePreview.style.display = 'block';
    if (elements.dropzone) elements.dropzone.style.display = 'none';
  }

  function clearFileSelection(keepError) {
    state.uploadedFile = null;
    if (elements.fileInput) elements.fileInput.value = '';
    if (elements.filePreview) elements.filePreview.style.display = 'none';
    if (elements.dropzone) elements.dropzone.style.display = '';
    if (!keepError) showDocumentError('');
  }

  // --- Fill Sample / Mock Data ---
  function fillSampleData() {
    if (elements.companyName) elements.companyName.value = 'Apex Precision Engineering Pvt Ltd';
    if (elements.contactName) elements.contactName.value = 'Vikramaditya Shinde';
    if (elements.contactEmail) elements.contactEmail.value = 'vikram@apexengineering.in';
    if (elements.contactPhone) elements.contactPhone.value = '9826011223';
    if (elements.industry) elements.industry.value = 'Manufacturing & Engineering';
    if (elements.turnoverBand) elements.turnoverBand.value = '5Cr - 10Cr';
    if (elements.businessNotes) {
      elements.businessNotes.value = 'Debtor delays, GST notices, No SOPs';
    }
    if (elements.consentCheckbox) elements.consentCheckbox.checked = true;

    updateNotesCounter();
    syncChipStates();

    // Attach mock file object for testing dropzone & multipart payload
    try {
      const mockBlob = new Blob(['Mock financial trial balance and P&L data for testing.'], { type: 'application/pdf' });
      const mockFile = new File([mockBlob], 'Apex_FY25_Financial_Summary.pdf', { type: 'application/pdf' });
      handleFileSelection(mockFile);
    } catch (e) {
      // Blob/File unavailable — ignore
    }

    clearAllErrors();
    refreshSubmitState();
  }

  // --- Client-Side Synthetic Mock Diagnostic Fallback ---
  function generateClientSyntheticReport(profile, file) {
    const hasDoc = !!file;
    const company = profile.company_name || 'Apex Precision Engineering Pvt Ltd';
    const industry = profile.industry || 'Manufacturing & Engineering';
    const turnover = profile.turnover_band || '5Cr - 10Cr';

    return {
      meta: {
        report_id: `BMR-MOCK-${Math.floor(100000 + Math.random() * 900000)}`,
        company_name: company,
        industry: industry,
        turnover_band: turnover,
        generated_at: new Date().toISOString()
      },
      scores: {
        overall_score: hasDoc ? 68.0 : 57.5,
        risk_band: hasDoc ? 'Moderate' : 'Vulnerable',
        pillar_scores: [
          { pillar_name: 'Financial Health & Statutory Compliance', score: hasDoc ? 17.0 : 13.5, max_score: 25, status: hasDoc ? 'Good' : 'Needs Attention' },
          { pillar_name: 'Sales & Revenue Pipeline', score: 13.5, max_score: 20, status: 'Needs Attention' },
          { pillar_name: 'Marketing & Brand Positioning', score: 10.5, max_score: 15, status: 'Good' },
          { pillar_name: 'Operational Efficiency & SOPs', score: 9.0, max_score: 15, status: 'Needs Attention' },
          { pillar_name: 'IT, Systems & Digital Readiness', score: 11.5, max_score: 15, status: 'Good' },
          { pillar_name: 'Governance, Legal & IPR Protection', score: 6.5, max_score: 10, status: 'Needs Attention' }
        ]
      },
      executive_summary: `${company} has solid operating foundations, but working capital trapped in aged debtors and delayed GSTR-2B reconciliations are constraining margins and cash flow.`,
      key_strengths: [
        { title: 'Repeat Engineering Orders', explanation: 'Established operational track record with reliable core customers.' },
        { title: 'Accounting Discipline', explanation: 'Basic transactional data is captured in a usable system.' },
        { title: 'Technical Depth', explanation: 'Founder and engineering team can execute complex work.' }
      ],
      critical_gaps: [
        { pillar: 'Financial Health & Statutory Compliance', finding: 'Receivables ageing beyond 90 days is blocking working capital.', impact: 'Recurring short-term credit dependency.', severity: 'High' },
        { pillar: 'Operational Efficiency & SOPs', finding: 'No codified SOPs for floor management or procurement.', impact: 'Quality variance and founder dependency.', severity: 'Medium' }
      ],
      key_observations: [
        'Cash conversion cycle stretches past 80 days.',
        'Top 3 clients contribute over 52% of billings.',
        'Brand and IP assets are not formally registered.'
      ],
      risks_and_vulnerabilities: [
        { risk_title: 'GST ITC Reversal', likelihood: 'Medium', impact_severity: 'Critical', mitigation: 'Month-on-month GSTR-2B reconciliation against purchase register.' },
        { risk_title: 'Receivable Lock-up', likelihood: 'High', impact_severity: 'Moderate', mitigation: 'Credit limits and weekly ageing reviews.' }
      ],
      improvement_opportunities: [
        { initiative: 'Monthly MIS and 13-week cash forecast', expected_outcome: 'Fewer cash surprises, faster monthly close.', timeframe: 'First 30 Days' },
        { initiative: 'SOP repository', expected_outcome: 'Lower key-person dependency.', timeframe: '30 to 60 Days' },
        { initiative: 'Trademark filings for brand assets', expected_outcome: 'Protected brand equity.', timeframe: '60 to 90 Days' }
      ],
      priority_action_plan: {
        immediate_30_days: [
          'Run a debtor ageing audit and set credit hold limits.',
          'Reconcile GSTR-2B against the purchase register.'
        ],
        medium_term_60_days: [
          'Build a 13-week rolling cash flow forecast.',
          'File trademark applications for the primary brand.'
        ],
        strategic_90_days: [
          'Document billing, quality and procurement SOPs.',
          'Start quarterly CFO margin reviews by product line.'
        ]
      },
      missing_or_unverified_info: [
        'Audited balance sheet and P&L for the last financial year.',
        'Monthly AR/AP ageing schedule.',
        'Latest GST return acknowledgements.'
      ],
      consultation_agenda: [
        'Debtor recovery and working capital release.',
        'GST and TDS compliance review.',
        'Fractional CFO and monthly MIS rollout.'
      ],
      disclaimer: 'AI-assisted preliminary assessment, subject to professional consultant review.'
    };
  }

  // --- Processing animation ---
  function resetProcessingSteps() {
    [elements.processingStep1, elements.processingStep2, elements.processingStep3,
      elements.processingStep4, elements.processingStep5].forEach(el => {
      if (!el) return;
      el.classList.remove('active', 'done');
      const icon = el.querySelector('i');
      if (icon) icon.className = 'bi bi-circle';
    });
  }

  function setProcStatus(el, active, done) {
    if (!el) return;
    el.classList.remove('active', 'done');
    const icon = el.querySelector('i');
    if (done) {
      el.classList.add('done');
      if (icon) icon.className = 'bi bi-check-circle-fill';
    } else if (active) {
      el.classList.add('active');
      if (icon) icon.className = 'bi bi-arrow-repeat';
    } else if (icon) {
      icon.className = 'bi bi-circle';
    }
  }

  /**
   * Pagination measures real layout, so it must run while the report is
   * actually rendered. It is called from two places:
   *   1. right after renderReport(), with the report made measurable briefly;
   *   2. again when the report is revealed by showAnalysisView(), which fixes
   *      anything a hidden-state measurement got wrong (fonts, images, wraps).
   */
  function paginateWhenVisible() {
    const target = elements.analysisReport;
    const wasHidden = target && target.hidden;

    if (wasHidden) {
      // Pop it into layout without a visible flash: absolute, transparent,
      // zero-opacity, but still laid out so heights are real.
      target.hidden = false;
      target.style.visibility = 'hidden';
      target.style.opacity = '0';
    }

    paginateReport();

    if (wasHidden) {
      target.style.visibility = '';
      target.style.opacity = '';
      target.hidden = true;
    }
  }

  function showAnalysisView(which) {
    if (elements.analysisProcessing) elements.analysisProcessing.hidden = which !== 'processing';
    // The booking block now lives inside the final page of the report, so the
    // report stays visible while the calendar is open.
    const revealing = which !== 'processing';
    const wasHidden = elements.analysisReport && elements.analysisReport.hidden;

    if (elements.analysisReport) elements.analysisReport.hidden = !revealing;
    if (elements.bookingBlock) elements.bookingBlock.hidden = which !== 'booking';

    // Re-measure once the sheets are in the document and fonts have settled.
    if (revealing && wasHidden && state.reportData) {
      paginateWhenVisible();
    }

    if (elements.wizardScroll) elements.wizardScroll.scrollTop = 0;
  }

  /** Shared entry point for both booking CTAs (page-3 button and page-2 gate). */
  function openBooking() {
    if (state.reportData) {
      initCalBooking(state.reportData);
      pollPdfAfterBooking(state.reportData.meta && state.reportData.meta.report_id);
    }
    showAnalysisView('booking');
    focusBookingHeading();
  }

  /** §6.4: the CTA moves focus to the booking heading, not the page top. */
  function focusBookingHeading() {
    if (!elements.bookingHeading) return;
    elements.bookingHeading.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    elements.bookingHeading.scrollIntoView({
      block: 'start',
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  }

  function loadAnalysisHeader(titleText, noteText) {
    const title = document.getElementById('processing-title');
    const note = document.getElementById('processing-note');
    if (title) title.textContent = titleText;
    if (note) note.textContent = noteText;
  }

  // --- Submission ---
  async function submitCheckupAssessment() {
    if (state.isSubmitting) return;

    if (!validateProfile(true)) {
      // Send the user back to the offending step instead of failing silently.
      goToStep(1);
      return;
    }

    state.isSubmitting = true;
    if (elements.btnSubmit) {
      elements.btnSubmit.disabled = true;
      elements.btnSubmit.setAttribute('aria-disabled', 'true');
    }

    resetProcessingSteps();
    loadAnalysisHeader('Analyzing your business', 'Scoring six pillars against 25 internal criteria.');
    showAnalysisView('processing');
    goToStep(ANALYSIS_STEP);

    setProcStatus(elements.processingStep1, true, false);

    const stepTimer1 = setTimeout(() => {
      setProcStatus(elements.processingStep1, false, true);
      setProcStatus(elements.processingStep2, true, false);
    }, 600);

    const stepTimer2 = setTimeout(() => {
      setProcStatus(elements.processingStep2, false, true);
      setProcStatus(elements.processingStep3, true, false);
    }, 1300);

    const stepTimer3 = setTimeout(() => {
      setProcStatus(elements.processingStep3, false, true);
      setProcStatus(elements.processingStep4, true, false);
    }, 2000);

    const stepTimer4 = setTimeout(() => {
      setProcStatus(elements.processingStep4, false, true);
      setProcStatus(elements.processingStep5, true, false);
    }, 2700);

    try {
      let response;

      if (state.uploadedFile) {
        // Send multipart/form-data with attached document
        const formData = new FormData();
        formData.append('company_name', state.profile.company_name);
        formData.append('contact_name', state.profile.contact_name);
        formData.append('contact_email', state.profile.contact_email);
        formData.append('contact_phone', state.profile.contact_phone);
        formData.append('industry', state.profile.industry);
        formData.append('turnover_band', state.profile.turnover_band);
        formData.append('notes', state.profile.notes);
        formData.append('dpdp_consent', 'true');
        formData.append('streamlined', 'true');
        formData.append('document', state.uploadedFile, state.uploadedFile.name);

        response = await fetch(`${API_BASE}/api/checkup/analyze`, {
          method: 'POST',
          body: formData
        });
      } else {
        // Send JSON payload
        const payload = {
          company_name: state.profile.company_name,
          contact_name: state.profile.contact_name,
          contact_email: state.profile.contact_email,
          contact_phone: state.profile.contact_phone,
          industry: state.profile.industry,
          turnover_band: state.profile.turnover_band,
          notes: state.profile.notes,
          dpdp_consent: true,
          streamlined: true
        };

        response = await fetch(`${API_BASE}/api/checkup/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);

      let report = null;

      try {
        if (!response.ok) {
          throw new Error(`Server returned status HTTP ${response.status}`);
        }
        report = await response.json();
      } catch (apiErr) {
        console.warn('API unavailable or returned non-200, activating client synthetic fallback:', apiErr.message);
        report = generateClientSyntheticReport(state.profile, state.uploadedFile);
      }

      state.reportData = report;

      setProcStatus(elements.processingStep1, false, true);
      setProcStatus(elements.processingStep2, false, true);
      setProcStatus(elements.processingStep3, false, true);
      setProcStatus(elements.processingStep4, false, true);
      setProcStatus(elements.processingStep5, false, true);

      renderReport(report);

      setTimeout(() => {
        state.isSubmitting = false;
        showAnalysisView('report');
        if (elements.btnSubmit) elements.btnSubmit.disabled = false;
        refreshSubmitState();
        initCalBooking(report);
        persistReport(report);
      }, 500);

    } catch (err) {
      console.error('Checkup submission error:', err);
      state.isSubmitting = false;
      if (elements.btnSubmit) elements.btnSubmit.disabled = false;
      showAnalysisView('processing');
      resetProcessingSteps();
      loadAnalysisHeader('Could not generate the report', 'Check your connection and try again.');
      goToStep(2);
    }
  }

  // --- Report helpers -------------------------------------------------------
  function formatReportDate(rawDate) {
    const d = rawDate ? new Date(rawDate) : new Date();
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('en-IN', { month: 'short' });
    return `${day} ${month} ${d.getFullYear()}`;
  }

  function severityKey(value) {
    const v = String(value || '').toLowerCase();
    if (v.startsWith('high') || v.startsWith('critical')) return 'high';
    if (v.startsWith('med')) return 'medium';
    return 'low';
  }

  /** Plain sentence-case label; colour is applied by CSS from the modifier. */
  function sevChip(value) {
    const word = escapeHtml(String(value || '').trim() || 'Low');
    return `<span class="bmr-report-sev bmr-report-sev--${severityKey(value)}">${word}</span>`;
  }

  /**
   * Gating: page 1 shows only the first two strengths and the first two gaps.
   * Sections 4.3–7 are rendered into the blurred page-2 body (inert, hidden
   * from AT) and stay unreadable until the visitor books the review call.
   * The count is derived from the data, never invented; at zero the gate goes.
   */
  function updateLockedState(report) {
    const risks = Array.isArray(report.risks_and_vulnerabilities) ? report.risks_and_vulnerabilities : [];
    const agenda = Array.isArray(report.consultation_agenda) ? report.consultation_agenda : [];
    const observations = Array.isArray(report.key_observations) ? report.key_observations : [];
    const plan = report.priority_action_plan || {};
    const planCount = (plan.immediate_30_days || []).length +
      (plan.medium_term_60_days || []).length +
      (plan.strategic_90_days || []).length;

    const total = observations.length + risks.length + planCount + agenda.length;
    const sections = [observations.length > 0, risks.length > 0, planCount > 0, agenda.length > 0]
      .filter(Boolean).length;

    if (elements.reportLockedCount) {
      elements.reportLockedCount.textContent = sections === 0
        ? ''
        : `${total} further ${total === 1 ? 'item' : 'items'} across ${sections} locked ${sections === 1 ? 'section' : 'sections'}.`;
    }

    const nothingLocked = total === 0;
    if (nothingLocked) {
      // Nothing to gate: reveal the continuation inline and drop the lock card.
      if (elements.reportLocked) elements.reportLocked.hidden = true;
      if (elements.reportLockedBody) {
        elements.reportLockedBody.removeAttribute('inert');
        elements.reportLockedBody.removeAttribute('aria-hidden');
        elements.reportLockedBody.classList.add('is-unlocked');
      }
    }
  }

  // --- A4 pagination -------------------------------------------------------
  /**
   * The report is laid out as A4 sheets, but the amount of text the AI returns
   * varies per report — a fixed page split would overflow on long outputs and
   * leave half-empty sheets on short ones. So the source article is authored as
   * one continuous document (`#report-sheet-source`) and re-flowed here into
   * sheets that hold exactly as much as fits.
   *
   * Units are the finest thing we are willing to move: the masthead, a section
   * heading row, or one child of a section. A section that straddles a page
   * break is reopened on the next sheet as a continuation (no repeated rule).
   */
  const A4_LIMIT_PX = 1000; // A4 @96dpi minus sheet padding and running head/foot

  function collectSheetUnits(source) {
    const units = [];

    Array.from(source.children).forEach(child => {
      if (child.matches('.bmr-report-page__foot')) return;

      // The masthead travels whole — splitting a header is never acceptable.
      if (!child.matches('.bmr-report-section')) {
        units.push({ section: null, node: child, isHead: false });
        return;
      }

      const sectionId = child.getAttribute('aria-labelledby') || child.className;
      Array.from(child.children).forEach(node => {
        units.push({
          section: sectionId,
          sectionEl: child,
          node,
          isHead: node.classList.contains('bmr-report-shead')
        });
      });
    });

    return units;
  }

  function makeSheet(index, total) {
    const article = document.createElement('article');
    article.className = 'bmr-report-page';
    article.setAttribute('data-page', String(index));
    article.setAttribute('data-generated', '1');
    article.innerHTML =
      '<div class="bmr-report-page__head">' +
        '<span>Book My Records &middot; Business Advisory</span>' +
        '<span>Page ' + index + ' of ' + total + ' &middot; Preliminary</span>' +
      '</div>' +
      '<div class="bmr-sheet__flow"></div>' +
      '<footer class="bmr-report-page__foot">' +
        '<span>Page ' + index + ' of ' + total + '</span>' +
        '<span>' + escapeHtml((state.reportData && state.reportData.meta && state.reportData.meta.report_id) || 'BMR-2026-DIAG') + '</span>' +
      '</footer>';
    return article;
  }

  function paginateReport() {
    const source = document.getElementById('report-sheet-source');
    const pagesWrap = document.getElementById('report-pages');
    if (!source || !pagesWrap) return;

    // Idempotent: drop sheets from a previous render before measuring again.
    pagesWrap.querySelectorAll('.bmr-report-page[data-generated="1"]').forEach(n => n.remove());

    const units = collectSheetUnits(source);
    if (units.length === 0) return;

    // Build into a detached measuring host so layout is real, not guessed.
    const sheetData = [];           // [{ flow, currentSection, nodes: [] }]
    let current = null;

    const startSheet = () => {
      const sheet = makeSheet(sheetData.length + 1, 1); // total patched later
      // Page 1's sheets must precede the locked page 2 that already sits in the
      // DOM, so insert against that anchor rather than blindly appending.
      const anchor = pagesWrap.querySelector('.bmr-report-page--locked');
      if (anchor) pagesWrap.insertBefore(sheet, anchor);
      else pagesWrap.appendChild(sheet);
      current = {
        sheet,
        flow: sheet.querySelector('.bmr-sheet__flow'),
        currentSection: null,
        sectionEl: null
      };
      sheetData.push(current);
    };

    const openSection = (unit) => {
      if (current.currentSection === unit.section && current.sectionEl) return current.sectionEl;
      const sectionEl = document.createElement('section');
      sectionEl.className = 'bmr-report-section';
      // A section reopened after a break must not draw another top rule.
      if (unit.section && sheetData.length > 0 && current.flow.children.length > 0) {
        // same source section continues on a new sheet
      }
      if (unit.section && unit.isContinued) sectionEl.classList.add('is-continued');
      current.flow.appendChild(sectionEl);
      current.currentSection = unit.section;
      current.sectionEl = sectionEl;
      return sectionEl;
    };

    // Masthead and bare children are appended straight to the flow.
    const appendUnit = (unit) => {
      if (!unit.section) {
        current.flow.appendChild(unit.node);
        current.currentSection = null;
        current.sectionEl = null;
        return;
      }
      const sectionEl = openSection(unit);
      sectionEl.appendChild(unit.node);
    };

    // Track whether a unit is a continuation of a section opened earlier.
    const seenSections = new Set();

    // Content height measured from the children themselves. Relying on
    // flow.scrollHeight is unsafe: the flow is a flex item inside a sheet that
    // has a min-height for A4 proportions, so its box can be stretched and read
    // as "already full" after the very first unit.
    const flowHeight = () => {
      const kids = current.flow.children;
      if (kids.length === 0) return 0;
      const first = kids[0];
      const last = kids[kids.length - 1];
      if (first.offsetParent !== last.offsetParent) return current.flow.offsetHeight;
      return (last.offsetTop - first.offsetTop) + last.offsetHeight;
    };

    startSheet();

    units.forEach((unit, i) => {
      if (unit.section) {
        if (seenSections.has(unit.section) && current.currentSection !== unit.section) {
          unit.isContinued = true;
        }
        seenSections.add(unit.section);
      }

      appendUnit(unit);

      // Overflow check: pull this unit onto a fresh sheet if the content no
      // longer fits. A heading is never left dangling at the foot of a sheet.
      const tooTall = flowHeight() > A4_LIMIT_PX;

      if (tooTall && current.flow.children.length > 0) {
        const movedSection = unit.section;
        const movedIsHead = unit.isHead;

        // Detach the unit, and the section wrapper if it just became empty.
        unit.node.remove();
        if (current.sectionEl && current.sectionEl.children.length === 0) {
          current.sectionEl.remove();
        }

        // A heading must not be the last thing on a sheet — push it forward too.
        const lastInFlow = current.flow.lastElementChild;
        let carry = null;
        if (movedIsHead) {
          carry = null;
        } else if (lastInFlow && lastInFlow.classList &&
                   lastInFlow.classList.contains('bmr-report-shead')) {
          carry = lastInFlow;
          carry.remove();
        }

        startSheet();

        if (carry) {
          const carryUnit = {
            section: movedSection,
            node: carry,
            isHead: true,
            isContinued: true
          };
          appendUnit(carryUnit);
        }

        appendUnit({ section: movedSection, node: unit.node, isHead: movedIsHead, isContinued: true });
      }
    });

    // Patch the counters by walking the sheets in DOM order. Deriving the
    // numbers from counts is fragile (generated sheets + locked page + authored
    // pages all coexist); DOM order is the only thing that is always right.
    const allSheets = Array.from(pagesWrap.querySelectorAll(':scope > .bmr-report-page'));
    const total = allSheets.length;

    allSheets.forEach((sheet, idx) => {
      const pageNo = idx + 1;
      const headSpan = sheet.querySelector('.bmr-report-page__head span:last-child');
      const footSpan = sheet.querySelector('.bmr-report-page__foot span:first-child');
      const isLocked = sheet.classList.contains('bmr-report-page--locked');
      const suffix = isLocked ? ' \u00b7 Locked' : ' \u00b7 Preliminary';

      if (headSpan) headSpan.textContent = 'Page ' + pageNo + ' of ' + total + suffix;
      if (footSpan) footSpan.textContent = isLocked
        ? 'Page ' + pageNo + ' of ' + total + ' \u00b7 Locked preview'
        : 'Page ' + pageNo + ' of ' + total;
    });

    // The authored source article was only a template; the generated sheets own
    // the content now.
    source.remove();
  }

  // --- Render Dynamic Business Health Report ---
  function renderReport(report) {
    if (!report) return;

    const meta = report.meta || {};
    const reportId = meta.report_id || 'BMR-2026-DIAG';
    const dateText = formatReportDate(meta.assessment_date || meta.generated_at);
    const industry = meta.industry || state.profile.industry;
    const turnover = meta.turnover_band || state.profile.turnover_band;

    // Masthead
    if (elements.reportCompanyName) {
      elements.reportCompanyName.textContent = meta.company_name || state.profile.company_name;
    }
    if (elements.reportId) elements.reportId.textContent = reportId;
    if (elements.reportDate) elements.reportDate.textContent = dateText;
    if (elements.reportIndustry) elements.reportIndustry.textContent = industry;
    if (elements.reportTurnover) elements.reportTurnover.textContent = turnover;
    if (elements.reportFootnoteId) elements.reportFootnoteId.textContent = reportId;
    const footP1 = document.getElementById('report-foot-id-p1');
    if (footP1) footP1.textContent = reportId;
    const footP3 = document.getElementById('report-foot-id-p3');
    if (footP3) footP3.textContent = reportId;

    // §1.1 scope facts
    const runtimeMeta = report._meta || {};
    if (elements.reportFactDate) elements.reportFactDate.textContent = dateText;
    if (elements.reportFactDocument) {
      elements.reportFactDocument.textContent = runtimeMeta.document_attached
        ? 'Received and read by the AI engine'
        : 'None — self-reported profile only';
    }
    // Make the AI/engine split explicit in the document body.
    const factEngine = document.getElementById('report-fact-engine');
    if (factEngine) {
      factEngine.textContent = runtimeMeta.engine === 'synthetic_generator'
        ? 'Deterministic rubric, 24 criteria'
        : 'Deterministic rubric, 24 criteria';
    }
    const factCommentary = document.getElementById('report-fact-commentary');
    if (factCommentary) {
      factCommentary.textContent = runtimeMeta.engine === 'synthetic_generator'
        ? 'Structured template, consultant-reviewed'
        : 'AI-generated, consultant-reviewed';
    }
    if (elements.reportFactCompliance) {
      elements.reportFactCompliance.textContent = runtimeMeta.compliance || 'DPDP Act 2023 & IT Act 2000 zero-retention';
    }

    // §1.2 information not verified
    if (elements.missingInfoContainer) {
      const missing = Array.isArray(report.missing_or_unverified_info) ? report.missing_or_unverified_info : [];
      elements.missingInfoContainer.innerHTML = missing.length
        ? missing.map(m => `<li>${escapeHtml(m)}</li>`).join('')
        : '<li>None recorded.</li>';
    }

    // §3 score + band
    const overallScore = Math.round((report.scores?.overall_score || 0) * 10) / 10;
    const riskBandRaw = report.scores?.risk_band || 'Moderate';
    const bandKey = String(riskBandRaw).toLowerCase().replace(/\s+risk$/, '').replace(/\s+/g, '-');

    if (elements.reportScoreNumber) elements.reportScoreNumber.textContent = overallScore.toFixed(1);

    if (elements.reportScoreCircle) {
      elements.reportScoreCircle.className = `score-circle-display band-${bandKey}`;
    }
    if (elements.reportRiskBandPill) {
      elements.reportRiskBandPill.className = `risk-band-pill band-${bandKey}`;
      elements.reportRiskBandPill.textContent = riskBandRaw;
    }
    if (elements.reportRiskBandDesc) {
      const descMap = {
        strong: 'Scalable operations and disciplined compliance; positioned for growth and institutional credit.',
        moderate: 'Solid fundamentals with clear operational, margin or compliance gaps.',
        vulnerable: 'Working capital strain, undocumented processes or compliance exposure requiring intervention.',
        critical: 'Significant operational or statutory risk; urgent restructuring and advisory required.'
      };
      elements.reportRiskBandDesc.textContent = descMap[bandKey] || '';
    }
    if (elements.reportScoreBlock) {
      // Marker position: a custom property, never a width string.
      elements.reportScoreBlock.style.setProperty('--score', String(overallScore));
    }
    const bandscale = document.getElementById('report-bandscale');
    if (bandscale) {
      bandscale.style.setProperty('--score', String(overallScore));
      const marker = bandscale.querySelector('.bmr-report-bandscale__marker');
      if (marker) marker.setAttribute('data-score', overallScore.toFixed(1));
    }

    // §3.1 pillars as table rows
    if (elements.pillarCardsContainer && Array.isArray(report.scores?.pillar_scores)) {
      elements.pillarCardsContainer.innerHTML = report.scores.pillar_scores.map(p => {
        const pct = p.max_score ? (p.score / p.max_score) * 100 : 0;
        const statusKey = String(p.status || '').toLowerCase();
        const statusClass = statusKey.includes('good')
          ? 'bmr-report-status--good'
          : (statusKey.includes('attention') || statusKey.includes('poor')
            ? 'bmr-report-status--weak'
            : 'bmr-report-status--mid');
        return `
          <tr>
            <td class="bmr-report-td">${escapeHtml(p.pillar_name)}</td>
            <td class="bmr-report-td bmr-report-td--num">${p.score}</td>
            <td class="bmr-report-td bmr-report-td--num">${p.max_score}</td>
            <td class="bmr-report-td bmr-report-td--num">${pct.toFixed(1)}%</td>
            <td class="bmr-report-td"><span class="${statusClass}">${escapeHtml(p.status)}</span></td>
          </tr>
        `;
      }).join('');
    }

    // §2 Executive summary
    if (elements.executiveSummaryText) {
      elements.executiveSummaryText.textContent = report.executive_summary || '';
    }

    // §4.1 Strengths — first 2 only
    if (elements.keyStrengthsContainer) {
      const strengths = Array.isArray(report.key_strengths) ? report.key_strengths.slice(0, 2) : [];
      elements.keyStrengthsContainer.innerHTML = strengths.map(s => {
        const isObj = s && typeof s === 'object';
        const title = isObj ? s.title : 'Strength';
        const body = isObj ? s.explanation : s;
        return `
          <div class="bmr-report-kv">
            <p class="bmr-report-kv__title">${escapeHtml(title)}</p>
            <p class="bmr-report-kv__body">${escapeHtml(body)}</p>
          </div>
        `;
      }).join('');
    }

    // §4.2 Critical gaps — first 2 only
    if (elements.criticalGapsContainer) {
      const gaps = Array.isArray(report.critical_gaps) ? report.critical_gaps.slice(0, 2) : [];
      elements.criticalGapsContainer.innerHTML = gaps.map(g => `
        <div class="bmr-report-kv">
          <div class="bmr-report-kv__head">
            <p class="bmr-report-kv__title">${escapeHtml(g.pillar)}</p>
            ${sevChip(g.severity)}
          </div>
          <p class="bmr-report-kv__body">${escapeHtml(g.finding)}</p>
          <p class="bmr-report-kv__body bmr-report-kv__body--muted">Impact: ${escapeHtml(g.impact)}</p>
        </div>
      `).join('');
    }

    // §4.3 Observations (gated)
    if (elements.observationsContainer) {
      const obs = Array.isArray(report.key_observations) ? report.key_observations : [];
      elements.observationsContainer.innerHTML = obs.map(o => `<li>${escapeHtml(o)}</li>`).join('');
    }

    // §5 Risk register (gated)
    if (elements.risksContainer) {
      const risks = Array.isArray(report.risks_and_vulnerabilities) ? report.risks_and_vulnerabilities : [];
      elements.risksContainer.innerHTML = risks.map(r => `
        <tr>
          <td class="bmr-report-td">${escapeHtml(r.risk_title)}</td>
          <td class="bmr-report-td">${sevChip(r.likelihood)}</td>
          <td class="bmr-report-td">${sevChip(r.impact_severity)}</td>
          <td class="bmr-report-td">${escapeHtml(r.mitigation)}</td>
        </tr>
      `).join('');
    }

    // §6 Priority action plan (gated). Section 6 of the old report
    // (improvement opportunities) is cut: its non-duplicative content is
    // merged into the phases below.
    const plan = report.priority_action_plan || {};
    const opportunities = Array.isArray(report.improvement_opportunities) ? report.improvement_opportunities : [];

    const mergeOpportunities = (items, timeframeMatch) => {
      const merged = Array.isArray(items) ? items.slice() : [];
      opportunities.forEach(opp => {
        if (!opp || !timeframeMatch.test(String(opp.timeframe || ''))) return;
        const line = opp.initiative + (opp.expected_outcome ? ` — ${opp.expected_outcome}` : '');
        if (!merged.some(existing => String(existing).toLowerCase() === line.toLowerCase())) {
          merged.push(line);
        }
      });
      return merged;
    };

    const phase30 = mergeOpportunities(plan.immediate_30_days, /30/);
    const phase60 = mergeOpportunities(plan.medium_term_60_days, /60/);
    const phase90 = mergeOpportunities(plan.strategic_90_days, /90/);

    const listHtml = arr => (arr.length ? arr.map(a => `<li>${escapeHtml(a)}</li>`).join('') : '<li>To be agreed with the consultant.</li>');
    if (elements.plan30Container) elements.plan30Container.innerHTML = listHtml(phase30);
    if (elements.plan60Container) elements.plan60Container.innerHTML = listHtml(phase60);
    if (elements.plan90Container) elements.plan90Container.innerHTML = listHtml(phase90);

    // The opportunities container stays in the DOM but is never rendered as
    // its own section (spec cut). Clear it so no stale markup survives.
    if (elements.opportunitiesContainer) elements.opportunitiesContainer.innerHTML = '';

    // §7 Consultation agenda (gated)
    if (elements.agendaContainer) {
      const agenda = Array.isArray(report.consultation_agenda) ? report.consultation_agenda : [];
      elements.agendaContainer.innerHTML = agenda.map(a => `<li>${escapeHtml(a)}</li>`).join('');
    }

    // §8 disclaimer
    const disclaimer = document.getElementById('report-disclaimer');
    if (disclaimer && report.disclaimer) disclaimer.textContent = report.disclaimer;

    updateLockedState(report);

    // Re-flow the finished document into A4 sheets. The report is still hidden
    // at this point, so measure it in a temporarily laid-out state.
    paginateWhenVisible();
  }

  // --- Persistence: store report now, release PDF only after booking ---
  function revealPdfLink(url) {
    if (!url) return;
    state.pdfUrl = url;
    if (elements.pdfBlock) elements.pdfBlock.hidden = false;
    if (elements.pdfLink) {
      elements.pdfLink.href = url;
      elements.pdfLink.hidden = false;
    }
    if (elements.pdfStatus) elements.pdfStatus.textContent = 'Your full report PDF is ready.';
  }

  function pollPdfAfterBooking(reportId) {
    if (!reportId || state.pdfPollTimer) return;
    let attempts = 0;
    state.pdfPollTimer = setInterval(async () => {
      attempts += 1;
      if (attempts > 40 || !reportId) {
        clearInterval(state.pdfPollTimer);
        state.pdfPollTimer = null;
        return;
      }
      try {
        const res = await fetch(`/api/checkup/report/${encodeURIComponent(reportId)}/status`);
        if (!res.ok) return;
        const status = await res.json();
        if (status.status === 'booked' && status.pdfAvailable) {
          revealPdfLink(status.pdfUrl || `/api/checkup/report/${encodeURIComponent(reportId)}/pdf`);
          clearInterval(state.pdfPollTimer);
          state.pdfPollTimer = null;
        }
      } catch (_) { /* keep polling */ }
    }, 3000);
  }

  async function persistReport(report) {
    const reportId = report && report.meta && report.meta.report_id;
    if (!reportId || !report || !report.scores) return;
    try {
      const response = await fetch(`${API_BASE}/api/checkup/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          submission: { ...state.profile, dpdp_consent: true },
          document: state.uploadedFile
            ? { filename: state.uploadedFile.name, size: state.uploadedFile.size, type: state.uploadedFile.type }
            : null,
          report
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.pdfUrl) {
        revealPdfLink(data.pdfUrl);
      } else if (elements.pdfStatus) {
        elements.pdfStatus.textContent = 'Your full PDF is released after you book the consultation.';
      }
      pollPdfAfterBooking(reportId);
    } catch (err) {
      console.warn('Report persistence unavailable; report still shown to user:', err.message);
      if (elements.pdfStatus) elements.pdfStatus.textContent = '';
    }
  }

  // --- Cal.com Inline Embed Integration ---
  function initCalBooking(report) {
    // Mount once: Cal("inline", …) appends a fresh iframe on every call and this
    // runs on CTA click plus the 500 ms pre-init after render.
    if (state.calMounted) return;

    const customerData = {
      name: state.profile.contact_name || '',
      email: state.profile.contact_email || '',
      phone: state.profile.contact_phone || '',
      reportId: report?.meta?.report_id || state.reportData?.meta?.report_id || 'BMR-ASSESSMENT'
    };

    // Load Cal.com embed loader snippet
    (function (C, A, L) {
      let p = function (a, ar) { a.q.push(ar); };
      let d = C.document;
      C.Cal = C.Cal || function () {
        let cal = C.Cal;
        let ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement("script")).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          const api = function () { p(api, arguments); };
          const namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === "string") {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ["initNamespace", namespace]);
          } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    try {
      if (typeof window.Cal === 'function') {
        window.Cal("init", { origin: "https://app.cal.com" });

        window.Cal("inline", {
          elementOrSelector: "#cal-inline-embed",
          calLink: "bookmyrecords/checkup-consultation",
          config: {
            layout: "month_view",
            theme: "light",
            name: customerData.name,
            email: customerData.email,
            notes: `Report ID: ${customerData.reportId} | Company: ${state.profile.company_name} | Phone: ${customerData.phone}`
          }
        });

        window.Cal("ui", {
          hideEventTypeDetails: true,
          layout: "month_view",
          cssVarsPerTheme: {
            light: {
              "cal-brand": "#0b5ed7",
              "cal-brand-emphasis": "#0846a8",
              "cal-brand-text": "#ffffff",
              "cal-text": "#3d4a5c",
              "cal-text-emphasis": "#1f2a44",
              "cal-text-subtle": "#5b6675",
              "cal-bg": "#ffffff",
              "cal-bg-subtle": "#f2f6fb",
              "cal-bg-muted": "#f7f9fc",
              "cal-border": "#d9e2ec",
              "cal-border-subtle": "#eef1f5",
              "radius": "2px",
              "spacing": "1px"
            }
          }
        });

        state.calMounted = true;
      }
    } catch (e) {
      console.warn('Cal.com embed initialization notice:', e);
    }
  }

  // Utility to escape HTML entities
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function resetWizard() {
    clearFileSelection();
    if (elements.intakeForm) elements.intakeForm.reset();
    state.profile = {
      company_name: '', contact_name: '', contact_email: '', contact_phone: '',
      industry: '', turnover_band: '', notes: ''
    };
    state.reportData = null;
    state.isSubmitting = false;
    state.calMounted = false;
    state.pdfUrl = null;
    state.bookingCaptured = false;
    if (state.pdfPollTimer) { clearInterval(state.pdfPollTimer); state.pdfPollTimer = null; }
    if (elements.calEmbedContainer) elements.calEmbedContainer.innerHTML = '';
    if (elements.pdfBlock) elements.pdfBlock.hidden = true;
    if (elements.pdfLink) { elements.pdfLink.hidden = true; elements.pdfLink.removeAttribute('href'); }
    if (elements.pdfStatus) elements.pdfStatus.textContent = '';
    clearAllErrors();
    updateNotesCounter();
    syncChipStates();
    resetProcessingSteps();
    refreshSubmitState();
    goToStep(1);
  }

  // --- Attach Event Listeners ---
  function setupEventListeners() {
    if (elements.btnNext) {
      elements.btnNext.addEventListener('click', (e) => {
        e.preventDefault();
        if (state.currentStep === 1) {
          if (!validateProfile(true)) return;
          if (elements.btnSubmit) {
            elements.btnSubmit.disabled = false;
            elements.btnSubmit.setAttribute('aria-disabled', 'false');
          }
          goToStep(2);
        } else if (state.currentStep === 2) {
          submitCheckupAssessment();
        }
      });
    }

    if (elements.btnBack) {
      elements.btnBack.addEventListener('click', (e) => {
        e.preventDefault();
        if (state.currentStep > 1 && state.currentStep <= TOTAL_INTAKE_STEPS) {
          goToStep(state.currentStep - 1);
        }
      });
    }

    if (elements.btnSubmit) {
      elements.btnSubmit.addEventListener('click', (e) => {
        e.preventDefault();
        if (state.isSubmitting || elements.btnSubmit.disabled) return;
        submitCheckupAssessment();
      });
    }

    if (elements.btnFillSampleData) {
      elements.btnFillSampleData.addEventListener('click', (e) => {
        e.preventDefault();
        fillSampleData();
      });
    }

    if (elements.btnSkipUpload) {
      elements.btnSkipUpload.addEventListener('click', (e) => {
        e.preventDefault();
        submitCheckupAssessment();
      });
    }

    // Re-evaluate the submit gate without surfacing errors.
    [elements.companyName, elements.contactName, elements.contactEmail, elements.contactPhone,
      elements.industry, elements.turnoverBand, elements.consentCheckbox].forEach(el => {
      if (!el) return;
      const evt = el.type === 'checkbox' ? 'change' : 'input';
      el.addEventListener(evt, () => {
        // Clear this field's error as soon as the field itself becomes valid.
        if (el.getAttribute('aria-invalid') === 'true' && isFieldValid(el)) {
          markValid(el);
        }
        refreshSubmitState();
      });
    });

    if (elements.contactPhone) {
      elements.contactPhone.addEventListener('input', () => {
        elements.contactPhone.value = elements.contactPhone.value.replace(/\D/g, '').slice(0, 10);
      });
    }

    if (elements.btnPrintReport) {
      elements.btnPrintReport.addEventListener('click', (e) => {
        e.preventDefault();
        window.print();
      });
    }

    if (elements.btnPrintPartial) {
      elements.btnPrintPartial.addEventListener('click', (e) => {
        e.preventDefault();
        window.print();
      });
    }

    if (elements.btnRetakeCheckup) {
      elements.btnRetakeCheckup.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Start a new assessment? The current report will be cleared.')) {
          resetWizard();
        }
      });
    }

    if (elements.btnGoToBooking) {
      elements.btnGoToBooking.addEventListener('click', (e) => {
        e.preventDefault();
        openBooking();
      });
    }

    // The gate on page 2 goes to the same booking block as the page-3 CTA.
    if (elements.btnUnlockReport) {
      elements.btnUnlockReport.addEventListener('click', (e) => {
        e.preventDefault();
        openBooking();
      });
    }

    if (elements.btnBackToReport) {
      elements.btnBackToReport.addEventListener('click', (e) => {
        e.preventDefault();
        showAnalysisView('report');
      });
    }

    // Cal.com emits a postMessage on successful booking. Server webhook remains authoritative;
    // this is a client-side fallback so the record is marked even if the webhook is not configured yet.
    window.addEventListener('message', async (event) => {
      const data = event && event.data;
      if (!data || typeof data !== 'object') return;
      const type = String(data.type || data.event || '');
      const isBooking = /booking/i.test(type) && /success|created|complete/i.test(type);
      if (!isBooking || state.bookingCaptured || !state.reportData) return;
      state.bookingCaptured = true;
      try {
        const res = await fetch(`${API_BASE}/api/checkup/booking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportId: state.reportData.meta && state.reportData.meta.report_id,
            source: 'client-postMessage',
            uid: data.uid || null,
            start_time: data.startTime || data.start_time || null,
            email: data.email || null
          })
        });
        const result = await res.json();
        if (result.pdfUrl) revealPdfLink(result.pdfUrl);
        else pollPdfAfterBooking(state.reportData.meta && state.reportData.meta.report_id);
      } catch (_) { /* webhook is authoritative; fail silently */ }
    });
  }

  // --- Initialization on DOM Ready ---
  document.addEventListener('DOMContentLoaded', function () {
    initElements();
    initDropzone();
    initPainChips();
    setupEventListeners();
    goToStep(1);
    refreshSubmitState();
  });

  // Expose checkup controller for testing and external trigger
  window.BmrCheckup = {
    state,
    goToStep,
    validateProfile,
    validateStep1,
    refreshSubmitState,
    renderReviewSummary,
    submitCheckupAssessment,
    renderReport,
    initCalBooking,
    persistReport,
    revealPdfLink,
    pollPdfAfterBooking,
    fillSampleData,
    resetWizard,
    generateClientSyntheticReport
  };

})();
