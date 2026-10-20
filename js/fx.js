/* Site behaviour: current-nav marker, blog year buttons, reading progress. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;

  function ready(fn) { doc.readyState === 'loading' ? doc.addEventListener('DOMContentLoaded', fn) : fn(); }

  ready(function () {
    /* nav: mark current section */
    var path = location.pathname.replace(/index\.html$/, '');
    doc.querySelectorAll('.site-nav a').forEach(function (a) {
      var h = a.getAttribute('href');
      if (h === path || (h !== '/' && path.indexOf(h) === 0)) a.setAttribute('aria-current', 'page');
    });

    /* blog list: year buttons above the list */
    var yp = doc.getElementById('year-pagination'), pl = doc.getElementById('posts-list');
    if (yp && pl) pl.parentNode.insertBefore(yp, pl);

    /* reading progress */
    var pr = doc.createElement('div'); pr.className = 'prog'; doc.body.appendChild(pr);
    function progress() {
      var h = root.scrollHeight - innerHeight;
      pr.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0) + ')';
    }
    addEventListener('scroll', progress, { passive: true }); progress();
  });
})();
