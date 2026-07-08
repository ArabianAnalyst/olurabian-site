// Purse page. Scroll reveal, CSP-safe, no inline anything.
(function () {
  var root = document.documentElement;
  root.classList.add('js');

  var els = document.querySelectorAll('.rv');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window) || reduced) {
    for (var i = 0; i < els.length; i++) els[i].classList.add('in');
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    for (var j = 0; j < entries.length; j++) {
      if (entries[j].isIntersecting) {
        entries[j].target.classList.add('in');
        io.unobserve(entries[j].target);
      }
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

  for (var k = 0; k < els.length; k++) io.observe(els[k]);
})();
