/**
 * Book My Records Analytics — Hero Section Motion Controller
 * - IntersectionObserver based staggered reveal
 * - 3D Cursor parallax on floating glass cards
 * - Respects prefers-reduced-motion
 */
(function () {
  'use strict';

  function initHeroMotion() {
    const hero = document.getElementById('bmr-hero');
    if (!hero) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const visualCards = Array.from(hero.querySelectorAll('[data-parallax]'));

    // Enable motion class
    document.documentElement.classList.add('js-motion');

    const revealHero = function () {
      hero.classList.add('is-visible');
    };

    if ('IntersectionObserver' in window && !reduceMotion) {
      const observer = new IntersectionObserver(function (entries) {
        for (let i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            revealHero();
            observer.disconnect();
            break;
          }
        }
      }, { threshold: 0.1 });
      observer.observe(hero);
    } else {
      revealHero();
    }

    // Interactive 3D Cursor Parallax (Desktop mouse / trackpad)
    if (!reduceMotion && window.matchMedia('(pointer: fine)').matches && visualCards.length > 0) {
      let rafId = null;
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;

      function renderLoop() {
        // Smooth interpolation for frictionless physics
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;

        for (let i = 0; i < visualCards.length; i++) {
          const card = visualCards[i];
          const strength = parseFloat(card.getAttribute('data-parallax') || '1');
          const shiftX = (currentX * 12 * strength).toFixed(2);
          const shiftY = (currentY * 8 * strength).toFixed(2);
          card.style.setProperty('--shift-x', shiftX + 'px');
          card.style.setProperty('--shift-y', shiftY + 'px');
        }

        // Keep loop running if still settling
        if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
          rafId = requestAnimationFrame(renderLoop);
        } else {
          rafId = null;
        }
      }

      function onMouseMove(event) {
        const rect = hero.getBoundingClientRect();
        targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        if (!rafId) {
          rafId = requestAnimationFrame(renderLoop);
        }
      }

      function onMouseLeave() {
        targetX = 0;
        targetY = 0;
        if (!rafId) {
          rafId = requestAnimationFrame(renderLoop);
        }
      }

      hero.addEventListener('mousemove', onMouseMove, { passive: true });
      hero.addEventListener('mouseleave', onMouseLeave, { passive: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroMotion);
  } else {
    initHeroMotion();
  }
})();
