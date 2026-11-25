const fs = require('fs');
const about = fs.readFileSync('about.html', 'utf8');
const headEnd = about.indexOf('<body');
let head = about.slice(0, headEnd);
head = head.replace('Book My Records | About Us', 'Book My Records | How We Work, Step by Step');
head = head.replace(
  '<link rel="stylesheet" href="assets/css/bmr-animations.css">',
  '<link rel="stylesheet" href="assets/css/bmr-process.css">\n<link rel="stylesheet" href="assets/css/bmr-animations.css">'
);
const headerStart = about.indexOf('<!-- Start header section -->');
const headerEnd = about.indexOf('<!-- End header section -->') + '<!-- End header section -->'.length;
let header = about.slice(headerStart, headerEnd);
header = header.replace('class="active"', '');
const footerStart = about.indexOf('<!-- Start Footer Section -->');
const footer = about.slice(footerStart);
const body = `
<body id="body" class="tt-smooth-scroll tt-magic-cursor bmr-how-page">
    <div id="magic-cursor"><div id="ball"></div></div>
    <div class="circle-container">
        <svg class="circle-progress svg-content" width="100%" height="100%" viewBox="-1 -1 102 102">
          <path d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98"/>
        </svg>
    </div>
${header}

    <div class="breadcrumb-section" style="background: linear-gradient(135deg, #091a32 0%, #102a4e 55%, #0b5ed7 100%);">
        <div class="container-fluid one pl--95 pr--95">
            <div class="row">
                <div class="col-lg-12">
                    <div class="banner-content">
                        <h1>How your business moves, step by step</h1>
                        <ul class="breadcrumb-list">
                            <li><a href="/">Home</a></li>
                            <li>How we work</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="bmr-journey">
      <div class="container-fluid one pl--95 pr--95">
        <div class="bmr-journey__intro">
          <span class="section-title1"><span>The full path</span></span>
          <h2>From a free score to a team that actually runs the work.</h2>
          <p>The home page only names the three stages. This page is the working sequence: what you share, how the one-on-one goes, and which Book My Records service takes over after that.</p>
        </div>
        <div class="bmr-phases">
          <a class="bmr-phase" href="#phase-checkup"><em>Phase 01</em><strong>Free health checkup</strong><span>A score out of 100 across six pillars. No login.</span></a>
          <a class="bmr-phase" href="#phase-meet"><em>Phase 02</em><strong>One-on-one advisory</strong><span>We learn the business, then teach what the numbers mean.</span></a>
          <a class="bmr-phase" href="#phase-execute"><em>Phase 03</em><strong>Execute with a team</strong><span>CFO support, accounts, tax, registration, or loan paperwork.</span></a>
        </div>

        <div class="bmr-track" id="phase-checkup">
          <article class="bmr-step">
            <div class="bmr-step__mark">01</div>
            <div class="bmr-step__card">
              <h3>Start the free Business Health Checkup</h3>
              <p>This is a finance and operations review, not a medical test. You can begin without creating an account.</p>
              <ul class="bmr-points">
                <li>Share a recent P&amp;L, a GST return, or answer a short set of business questions.</li>
                <li>The score is calculated from six pillars: financial health and compliance, sales pipeline, marketing and brand, operations and SOPs, IT and digital readiness, and governance and IPR.</li>
                <li>You get a score out of 100, a first view of strengths and gaps, and the areas worth looking at first.</li>
                <li>Nothing is promised as a legal outcome or a guaranteed growth number.</li>
              </ul>
              <div class="bmr-step__links"><a class="bmr-chip" href="/checkup">Start the free checkup</a><a class="bmr-chip" href="/business-health-checkup">What the checkup covers</a></div>
            </div>
          </article>

          <article class="bmr-step" id="phase-meet">
            <div class="bmr-step__mark">02</div>
            <div class="bmr-step__card">
              <h3>Sit one-on-one with a senior advisor</h3>
              <p>The report is the starting point. The session is where we learn how your business actually runs.</p>
              <ul class="bmr-points">
                <li>Book a complimentary strategy session. It can be virtual.</li>
                <li>We ask how you sell, who pays late, where cash sits, and what the team does every month.</li>
                <li>The advisor walks the report with you, line by line, and explains the score in plain language.</li>
                <li>Together you mark the first cash and compliance fixes, and whether a deeper diagnostic is needed.</li>
              </ul>
              <div class="bmr-step__links"><a class="bmr-chip" href="/contact">Book the one-on-one</a></div>
            </div>
          </article>

          <article class="bmr-step">
            <div class="bmr-step__mark">03</div>
            <div class="bmr-step__card">
              <h3>Go deeper only when the checkup flags a real issue</h3>
              <p>A diagnostic is not automatic. It is the next step when the first review shows a problem that a short call cannot close.</p>
              <ul class="bmr-points">
                <li>A consultant looks at ledgers, ageing, margins, and how work actually moves.</li>
                <li>You receive a gap view and a practical order of work: what to fix now, in 30 days, and in 90 days.</li>
                <li>The point is a clear cause, not another generic report.</li>
              </ul>
              <div class="bmr-step__links"><a class="bmr-chip" href="/business-health-diagnostic">Business Health Diagnostic</a></div>
            </div>
          </article>

          <article class="bmr-step" id="phase-execute">
            <div class="bmr-step__mark">04</div>
            <div class="bmr-step__card">
              <h3>Choose how the work gets done</h3>
              <p>After the conversation, you pick the support that matches the business. You do not have to buy everything.</p>
              <div class="bmr-paths">
                <article>
                  <h4>Hands-on CFO support</h4>
                  <p>Ongoing guidance, cash-flow view, monthly MIS, SOPs, and time spent teaching your team how to run the numbers.</p>
                </article>
                <article>
                  <h4>Accounts and tax</h4>
                  <p>Bookkeeping, reconciliations, GST, income tax, and TDS, so filings and books stay current.</p>
                </article>
                <article>
                  <h4>Setup and paperwork</h4>
                  <p>Company or LLP registration, trademark work, and bank-ready loan documents. We prepare papers. We do not sanction loans.</p>
                </article>
              </div>
              <div class="bmr-step__links">
                <a class="bmr-chip" href="/cfo-services">CFO services</a>
                <a class="bmr-chip" href="/hands-on-consulting-growth-support">Hands-on consulting</a>
                <a class="bmr-chip" href="/accounting-outsourcing">Accounting</a>
                <a class="bmr-chip" href="/taxation">Taxation</a>
                <a class="bmr-chip" href="/business-registration">Registration</a>
                <a class="bmr-chip" href="/ipr-registration">IPR</a>
                <a class="bmr-chip" href="/loan-financing">Loan paperwork</a>
              </div>
            </div>
          </article>

          <article class="bmr-step">
            <div class="bmr-step__mark">05</div>
            <div class="bmr-step__card">
              <h3>Keep a rhythm, not a one-time file</h3>
              <p>Once a path is chosen, the work becomes a calendar your team can follow.</p>
              <ul class="bmr-points">
                <li>Books close on a set day. Tax dates are tracked before they become notices.</li>
                <li>You review cash, margins, and open items with us, instead of discovering them at year end.</li>
                <li>Where it helps, we sit with your people and show them the routine, so the system does not depend on one person.</li>
                <li>If the business changes, the plan changes with it. The checkup can be run again as a fresh baseline.</li>
              </ul>
            </div>
          </article>
        </div>

        <div class="bmr-close">
          <div>
            <h2>Start at step one, or talk to us first.</h2>
            <p>The checkup is free. The one-on-one is how we decide what should happen next.</p>
          </div>
          <a class="primary-btn1 btn-hover" href="/checkup">
            Start free checkup
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M10.1865 1.06237L0 11.2484L0.751627 12L10.9376 1.81347V8.85645H12V0H3.14355V1.06237H10.1865Z"></path>
            </svg>
            <span></span>
          </a>
        </div>
      </div>
    </div>

${footer.replace('</body>', '<script src="assets/js/bmr-process.js" defer></script>\n</body>')}
`;
fs.writeFileSync('how-we-work.html', head + body);
console.log('wrote how-we-work.html', (head + body).length);
