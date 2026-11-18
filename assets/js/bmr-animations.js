/**
 * Book My Records Analytics — Artisan Soft Motion & Interaction Engine
 * Ultra-lightweight, 60fps, GPU-composited scroll & tactile micro-interactions.
 * Non-intrusive: "Invisible when done well, alive and tactile."
 */
(function () {
  'use strict';

  // ── 1. Create & Manage Scroll-Driven Progress Bar ──────────────────────────
  function initProgressBar() {
    var bar = document.querySelector('.bmr-scroll-progress');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'bmr-scroll-progress';
      bar.setAttribute('aria-hidden', 'true');
      document.body.prepend(bar);
    }

    var ticking = false;
    function updateProgress() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
      var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = Math.min(Math.max(progress, 0), 100).toFixed(2) + '%';
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });

    updateProgress();
  }

  // ── 2. Counter Animation for Metrics ──────────────────────────────────────
  function animateNumber(el) {
    var raw = el.dataset.bmrTarget || el.textContent.trim();
    var numMatch = raw.match(/([0-9.,]+)/);
    if (!numMatch) return;

    var targetNum = parseFloat(numMatch[1].replace(/,/g, ''));
    var prefix = raw.slice(0, raw.indexOf(numMatch[1]));
    var suffix = raw.slice(raw.indexOf(numMatch[1]) + numMatch[1].length);
    var duration = 1400; // Snappy 1.4s
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // Smooth ease-out exponential
      var ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      var current = targetNum * ease;
      el.textContent = prefix + (targetNum % 1 !== 0 ? current.toFixed(1) : Math.round(current)) + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = raw;
      }
    }
    window.requestAnimationFrame(step);
  }

  // ── 3. DOM Classification for Site-Wide Soft Reveals ──────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    initProgressBar();

    // A. Section Titles & Subtitles (Glide up 14px)
    var headingSelectors = [
      '.section-title',
      '.section-title1',
      '.section-top',
      '.area-title',
      '.who-we-help-header',
      '.business-challenges-header',
      '.client-testimonials-header'
    ];
    headingSelectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (!el.closest('.bmr-hero') && !el.classList.contains('bmr-reveal')) {
          el.classList.add('bmr-reveal');
        }
      });
    });

    // B. Card Grids & Lists (Stagger children in cascade)
    var staggerContainers = [
      '.bmr-pillars-row',
      '.who-we-help-cards',
      '.sevices-wrap',
      '.business-challenges-cards',
      '.our-process-steps',
      '.service-area .row',
      '.service-area6 .row',
      '.services-wrapper .row',
      '.pricing-area .row',
      '.pricing-section .row',
      '.testimonial-section .row',
      '.testimonial-area .row',
      '.team-area .row',
      '.counter-area .row',
      '.blog-area .row',
      '.accordion',
      '.faq-wrap'
    ];
    staggerContainers.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (row) {
        if (!row.classList.contains('bmr-stagger')) {
          row.classList.add('bmr-stagger');
        }
      });
    });

    // C. Content side-by-side blocks (Left image, Right content)
    document.querySelectorAll('.about-img, .project-walkthrough-video, .video-wrapper').forEach(function (el) {
      if (!el.classList.contains('bmr-reveal--left')) {
        el.classList.add('bmr-reveal--left');
      }
    });

    document.querySelectorAll('.about-content, .contact-info-wrap').forEach(function (el) {
      if (!el.classList.contains('bmr-reveal--right')) {
        el.classList.add('bmr-reveal--right');
      }
    });

    // D. CTA Sections & Big Cards (Soft scale reveal)
    document.querySelectorAll('.bmr-cta-section, .bmr-contact-section, .cta-area').forEach(function (el) {
      if (!el.classList.contains('bmr-reveal--scale')) {
        el.classList.add('bmr-reveal--scale');
      }
    });

    // E. Footer Columns (Staggered fade in)
    document.querySelectorAll('.footer-area .footer-widget, footer .footer-widget').forEach(function (el, i) {
      el.classList.add('bmr-reveal');
      el.style.transitionDelay = (i * 0.06) + 's';
    });

    // ── 4. Unified IntersectionObserver for Reveal Execution ─────────────────
    var revealElements = document.querySelectorAll(
      '.bmr-reveal, .bmr-reveal--left, .bmr-reveal--right, ' +
      '.bmr-reveal--scale, .bmr-reveal--fade, .bmr-stagger'
    );

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, io) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');

          // Trigger counter animation if inside visible container
          entry.target.querySelectorAll('.bmr-counter-val, .single-counter h2, .count').forEach(function (counterEl) {
            if (!counterEl.dataset.counted) {
              counterEl.dataset.counted = 'true';
              animateNumber(counterEl);
            }
          });

          io.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -36px 0px' // Reveals slightly before bottom of screen
    });

    revealElements.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      // If element is already in the viewport upon initial load, reveal immediately
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('is-visible');
      } else {
        observer.observe(el);
      }
    });

    // ── 5. Magnetic Back-to-Top Button ───────────────────────────────────────
    var backToTop = document.querySelector('.scroll-top, .back-to-top, .scroll-up');
    if (backToTop) {
      backToTop.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

  }); // end DOMContentLoaded
})();
