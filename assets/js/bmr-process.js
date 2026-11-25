(function () {
  var root = document.querySelector('.bmr-track');
  if (!root) return;
  var steps = root.querySelectorAll('.bmr-step');
  if (!('IntersectionObserver' in window)) {
    root.style.setProperty('--line', '1');
    steps.forEach(function (step) { step.classList.add('is-in'); });
    return;
  }
  var seen = 0;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      seen += 1;
      root.style.setProperty('--line', String(Math.min(1, seen / steps.length)));
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.35 });
  steps.forEach(function (step) { observer.observe(step); });

  document.querySelectorAll('.bmr-phase').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      document.querySelectorAll('.bmr-phase').forEach(function (item) { item.classList.remove('is-active'); });
      link.classList.add('is-active');
      document.querySelectorAll('.bmr-step.is-focus').forEach(function (item) { item.classList.remove('is-focus'); });
      var step = target.classList.contains('bmr-step') ? target : target.querySelector('.bmr-step');
      if (step) step.classList.add('is-focus');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
})();
