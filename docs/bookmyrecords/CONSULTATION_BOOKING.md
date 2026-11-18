# BookMyRecords — Consultation Booking Integration Specification
**Selected Platform**: Cal.com  
**Integration Pattern**: Vanilla JavaScript Inline & Modal Embed  
**Date**: November 2026  

## 1. Platform Decision: Why Cal.com Over Calendly

| Feature | Cal.com (Selected) | Calendly (Evaluated) | Business Impact |
|---|---|---|---|
| **Free Tier Capability** | **Unlimited Event Types** | Only 1 single event type | Enables separate 30m Checkup Review and 60m CFO Advisory sessions without paid upgrade |
| **Styling & Theming** | Deep customization via CSS & brand color API | Rigid template widget | Matches BookMyRecords brand blue (`#0B5ED7`) seamlessly |
| **Embedding Flexibility** | Inline embed, floating button, or popup modal | Standard iframe or popup | Fluid layout inside report view |
| **Prefill API** | Native support for pre-filling Name, Email, Phone, and Assessment ID | Prefill supported via URL | Eliminates repetitive typing for users |
| **Calendar Sync** | Real-time 2-way Google Calendar & Outlook sync | Real-time 2-way sync | Eliminates double-booking |
| **Privacy / Sovereignty** | Open-source core, SOC2, HIPAA/GDPR ready | Closed SaaS, US servers | Enhances client trust |

---

## 2. User Journey & Booking Flow
1. **Report Delivery**: Visitor finishes the Business Health Checkup and reviews their preliminary report.
2. **Prominent Consultation CTA**: A sticky banner and final report section highlight:
   *"Discuss Your Report With a Senior Consultant — 30-Minute Free Strategy Call"*.
3. **Pre-Filled Scheduling**: Clicking "Book Consultation" scrolls smoothly to or opens the embedded Cal.com widget.
4. **Auto-Populated Details**: The client's Name, Email, Phone, and unique Report ID are passed directly into the Cal.com embed configuration.
5. **Confirmation**:
   - The user receives an instant Google Calendar / Outlook invite with a Google Meet link.
   - The BookMyRecords consulting team receives an automated calendar notification containing the customer's Report ID.

---

## 3. Implementation Code

### Cal.com Inline Embed Snippet (Vanilla HTML/JS)

```html
<!-- Consultation Booking Container in checkup.html / report section -->
<div id="consultation-booking" class="bmr-booking-section mt-50 mb-80">
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-lg-10">
        <div class="booking-card p-4 p-md-5 rounded-4 shadow-sm bg-white border">
          <div class="text-center mb-4">
            <span class="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-2">
              Step 2: Expert Review
            </span>
            <h3 class="fw-bold text-dark">Book Your 1-on-1 Consultation</h3>
            <p class="text-muted">
              Select an available time slot below to review your Business Health Report with a senior advisor.
            </p>
          </div>

          <!-- Cal.com target container -->
          <div id="cal-inline-embed" style="width:100%; min-height:650px; overflow:hidden;"></div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Cal.com Embed Script -->
<script type="text/javascript">
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

  // Initialize Cal instance
  Cal("init", { origin: "https://app.cal.com" });

  // Function to mount the calendar with customer prefill
  function loadConsultationCalendar(customerData) {
    Cal("inline", {
      elementOrSelector: "#cal-inline-embed",
      calLink: "bookmyrecords/checkup-consultation",
      config: {
        layout: "month_view",
        theme: "light",
        name: customerData.name || "",
        email: customerData.email || "",
        notes: "Assessment ID: " + (customerData.reportId || "BMR-ASSESSMENT")
      }
    });

    // Apply BookMyRecords Brand Theme
    Cal("ui", {
      styles: {
        branding: { brandColor: "#0B5ED7" }
      },
      hideEventTypeDetails: false,
      layout: "month_view"
    });
  }
</script>
```

### Direct Link Fallback
If third-party scripts are blocked by user ad-blockers, an automatic fallback button is rendered:
```html
<noscript>
  <div class="text-center py-4">
    <a href="https://cal.com/bookmyrecords/checkup-consultation" target="_blank" rel="noopener" class="btn btn-primary px-4 py-3">
      Schedule Consultation on Cal.com &rarr;
    </a>
  </div>
</noscript>
```
