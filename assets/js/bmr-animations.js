/**
 * Book My Records Analytics — Global Soft Scroll Animation Engine
 * Lightweight IntersectionObserver-based reveal system.
 * Covers: .bmr-reveal variants, .bmr-stagger, .bmr-count-up,
 *         .bmr-section-line, .bmr-line-reveal, .bmr-img-reveal
 */
(function () {
  'use strict';

  // ── Respect prefers-reduced-motion ──────────────────────────────────────
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    // Make everything instantly visible
    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll(
        '.bmr-reveal, .bmr-reveal--left, .bmr-reveal--right, ' +
        '.bmr-reveal--scale, .bmr-reveal--fade, .bmr-stagger, ' +
        '.bmr-section-line, .bmr-line-reveal, .bmr-img-reveal'
      ).forEach(function (el) {
        el.classList.add('is-visible');
      });
    });
    return;
  }

  // ── Utility: create a single IntersectionObserver ───────────────────────
  function makeObserver(selector, threshold, callback) {
    if (!('IntersectionObserver' in window)) {
      // Fallback: show everything
      document.querySelectorAll(selector).forEach(function (el) {
        el.classList.add('is-visible');
      });
      return null;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          callback(entry.target);
          io.unobserve(entry.target); // fire once
        }
      });
    }, { threshold: threshold, rootMargin: '0px 0px -48px 0px' });

    document.querySelectorAll(selector).forEach(function (el) {
      io.observe(el);
    });
    return io;
  }

  // ── 1. Generic reveal elements ───────────────────────────────────────────
  var revealSelector = [
    '.bmr-reveal',
    '.bmr-reveal--left',
    '.bmr-reveal--right',
    '.bmr-reveal--scale',
    '.bmr-reveal--fade',
    '.bmr-section-line',
    '.bmr-line-reveal',
    '.bmr-img-reveal'
  ].join(', ');

  makeObserver(revealSelector, 0.10, function (el) {
    el.classList.add('is-visible');
  });

  // ── 2. Stagger groups ────────────────────────────────────────────────────
  makeObserver('.bmr-stagger', 0.08, function (el) {
    el.classList.add('is-visible');
  });

  // ── 3. Count-up numbers ──────────────────────────────────────────────────
  function animateCount(el) {
    var target = parseFloat(el.dataset.target || el.textContent.replace(/[^0-9.]/g, ''));
    var suffix = el.dataset.suffix || el.textContent.replace(/[0-9.]/g, '').trim();
    var duration = parseInt(el.dataset.duration || '1800', 10);
    var start = null;
    var startVal = 0;
    var isFloat = target % 1 !== 0;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      // Ease out cubic
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = startVal + (target - startVal) * eased;
      el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }

  makeObserver('.bmr-count-up', 0.5, animateCount);

  // ── 4. Add .bmr-reveal to common site sections automatically ─────────────
  // This retrofits existing HTML without touching each file's markup.
  document.addEventListener('DOMContentLoaded', function () {

    // Section titles / sub-titles
    var headingSelectors = [
      '.section-title h2',
      '.section-title h3',
      '.section-title p',
      '.section-title .sub-title',
      '.section-title .title',
      '.section-title1 h2',
      '.section-title1 h3',
      '.section-title1 h4',
      '.section-title1 p',
      '.section-title1 .sub-title',
      '.section-title1 .section-title-sub',
      '.section-top h2',
      '.section-top p',
      '.section-top .sub-title',
      '.area-title h2',
      '.area-title h3',
      '.area-title p'
    ];
    headingSelectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (!el.closest('.bmr-hero') && !el.classList.contains('bmr-reveal')) {
          el.classList.add('bmr-reveal');
        }
      });
    });

    // Service / pillar cards → stagger their parent row
    [
      '.service-area .row',
      '.pillar-area .row',
      '.why-choose-us .row',
      '.features-area .row',
      '.bmr-pillars__grid',
      '.bmr-channels-grid',
      '.bmr-pricing-grid',
      '.blog-area .row',
      '.team-area .row',
      '.counter-area .row',
      '.testimonial-area .row',
      '.bmr-pillars-row',
      '.pricing-area .row',
      '.faq-area .row',
      '.service-area6 .row',
      '.choose-area .row'
    ].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (row) {
        if (!row.classList.contains('bmr-stagger')) {
          row.classList.add('bmr-stagger');
        }
      });
    });

    // Individual cards (non-stagger fallback)
    [
      '.single-service',
      '.single-pricing',
      '.single-counter',
      '.single-blog',
      '.single-team',
      '.single-testimonial',
      '.bmr-pillar-item',
      '.bmr-channel-card',
      '.bmr-trust-pill',
      '.accordion-item',
      '.faq-item'
    ].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (!el.closest('.bmr-stagger') && !el.classList.contains('bmr-reveal')) {
          el.classList.add('bmr-reveal');
        }
      });
    });

    // CTA sections / banners
    [
      '.cta-area',
      '.bmr-cta-section',
      '.bmr-contact-section',
      '.bmr-compact-form-card',
      '.contact-info-wrap',
      '.map-area'
    ].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (!el.classList.contains('bmr-reveal') && !el.classList.contains('bmr-reveal--scale')) {
          el.classList.add('bmr-reveal--scale');
        }
      });
    });

    // Images inside content sections
    document.querySelectorAll('.about-img, .service-img, .hero-img, .team-img').forEach(function (el) {
      if (!el.classList.contains('bmr-reveal--left')) {
        el.classList.add('bmr-reveal--left');
      }
    });

    // Content text blocks beside images
    document.querySelectorAll('.about-content, .service-content').forEach(function (el) {
      if (!el.classList.contains('bmr-reveal--right')) {
        el.classList.add('bmr-reveal--right');
      }
    });

    // Footer columns
    document.querySelectorAll('.footer-widget').forEach(function (el, i) {
      el.classList.add('bmr-reveal');
      el.style.transitionDelay = (i * 0.08) + 's';
    });

    // Now re-observe everything that was just classified
    var allReveal = document.querySelectorAll(
      '.bmr-reveal, .bmr-reveal--left, .bmr-reveal--right, ' +
      '.bmr-reveal--scale, .bmr-reveal--fade, .bmr-stagger'
    );

    if (!('IntersectionObserver' in window)) {
      allReveal.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var globalIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          globalIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    allReveal.forEach(function (el) {
      // Don't re-observe elements that are already visible (above fold)
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('is-visible');
      } else {
        globalIO.observe(el);
      }
    });

    // ── 5. Soft parallax on scroll for section backgrounds ──────────────
    var parallaxEls = document.querySelectorAll('[data-bmr-parallax]');
    if (parallaxEls.length > 0) {
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (!ticking) {
          requestAnimationFrame(function () {
            parallaxEls.forEach(function (el) {
              var speed = parseFloat(el.dataset.bmrParallax || 0.15);
              var rect = el.getBoundingClientRect();
              var offset = (window.innerHeight / 2 - rect.top) * speed;
              el.style.transform = 'translateY(' + offset.toFixed(1) + 'px)';
            });
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }

    // ── 6. Soft CTA button pulse on hover ───────────────────────────────
    document.querySelectorAll('.btn-primary, .bmr-button--primary').forEach(function (btn) {
      if (!btn.classList.contains('bmr-cta-pulse')) {
        btn.classList.add('bmr-cta-pulse');
      }
    });

  }); // end DOMContentLoaded

})();
