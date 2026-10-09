/* Site effects: pointer glow, particle constellation, click burst, row spotlight,
   title scramble, reading progress, home masthead. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = matchMedia('(hover: none)').matches;

  function ready(fn) { doc.readyState === 'loading' ? doc.addEventListener('DOMContentLoaded', fn) : fn(); }

  ready(function () {
    var isHome = !!doc.querySelector('article.posts');

    /* home: masthead + year buttons above the list */
    if (isHome) {
      var hdr = doc.querySelector('.posts header');
      if (hdr) {
        var m = doc.createElement('section');
        m.className = 'masthead';
        m.innerHTML = '<p class="eyebrow">dingzhiqiang.com</p><h1>无敌的丁苏</h1>';
        hdr.parentNode.insertBefore(m, hdr.nextSibling);
      }
      var yp = doc.getElementById('year-pagination'), pl = doc.getElementById('posts-list');
      if (yp && pl) pl.parentNode.insertBefore(yp, pl);
    }

    /* staggered entrance */
    if (!reduce) {
      doc.querySelectorAll('.masthead > *, #year-pagination, .post-line, .post-header > *, .post-content > *').forEach(function (el, i) {
        el.classList.add('in'); el.style.setProperty('--i', Math.min(i, 14));
      });
    }

    /* effect layers */
    var cv = doc.createElement('canvas'); cv.id = 'fx';
    var spot = doc.createElement('div'); spot.className = 'spot';
    var dot = doc.createElement('div'); dot.className = 'dot';
    var pr = doc.createElement('div'); pr.className = 'prog';
    doc.body.insertBefore(cv, doc.body.firstChild);
    doc.body.appendChild(spot); doc.body.appendChild(dot); doc.body.appendChild(pr);
    if (!touch && !reduce) doc.body.classList.add('fx'); else dot.style.display = 'none';

    var ctx = cv.getContext('2d'), W, H, dpr = Math.min(devicePixelRatio || 1, 2);
    var ptr = { x: innerWidth / 2, y: 220 }, sx = ptr.x, sy = ptr.y;
    function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); addEventListener('resize', size);

    var N = Math.min(70, Math.floor(innerWidth / 18)), P = [], sparks = [];
    for (var i = 0; i < N; i++) P.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25 });
    function accent() { return getComputedStyle(root).getPropertyValue('--accent').trim(); }
    var C = accent(); setInterval(function () { C = accent(); }, 800);
    function rgba(hex, a) {
      var h = hex.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
      var n = parseInt(h, 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
    }
    function frame() {
      sx += (ptr.x - sx) * .12; sy += (ptr.y - sy) * .12;
      spot.style.transform = 'translate(' + sx + 'px,' + sy + 'px)';
      dot.style.transform = 'translate(' + ptr.x + 'px,' + ptr.y + 'px)';
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < N; i++) {
        var p = P[i]; p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        var dx = p.x - ptr.x, dy = p.y - ptr.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d < 140) { p.x += dx / d * (140 - d) * .02; p.y += dy / d * (140 - d) * .02; }
        ctx.fillStyle = rgba(C, .35); ctx.fillRect(p.x, p.y, 1.6, 1.6);
        for (var j = i + 1; j < N; j++) {
          var q = P[j], ex = p.x - q.x, ey = p.y - q.y, e = ex * ex + ey * ey;
          if (e < 12100) { ctx.strokeStyle = rgba(C, (1 - Math.sqrt(e) / 110) * .14); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
        if (d < 170) { ctx.strokeStyle = rgba(C, (1 - d / 170) * .35); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(ptr.x, ptr.y); ctx.stroke(); }
      }
      for (var k = sparks.length - 1; k >= 0; k--) {
        var s = sparks[k]; s.x += s.vx; s.y += s.vy; s.vy += .05; s.life -= .03;
        if (s.life <= 0) { sparks.splice(k, 1); continue; }
        ctx.fillStyle = rgba(C, s.life); ctx.fillRect(s.x, s.y, 2, 2);
      }
      requestAnimationFrame(frame);
    }
    if (!reduce) requestAnimationFrame(frame);

    addEventListener('pointermove', function (e) {
      ptr.x = e.clientX; ptr.y = e.clientY;
      var t = e.target.closest ? e.target : null;
      var r = t && t.closest('.post-line');
      if (r) { var b = r.getBoundingClientRect(); r.style.setProperty('--mx', e.clientX - b.left + 'px'); r.style.setProperty('--my', e.clientY - b.top + 'px'); }
      dot.classList.toggle('big', !!(t && t.closest('a, button, .post-content img')));
    });
    addEventListener('pointerdown', function (e) {
      if (reduce) return;
      var r = doc.createElement('div'); r.className = 'ring';
      r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; doc.body.appendChild(r);
      setTimeout(function () { r.remove(); }, 750);
      for (var i = 0; i < 14; i++) { var a = Math.random() * 6.283, v = 1.5 + Math.random() * 3; sparks.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: 1 }); }
    });

    function progress() {
      var h = root.scrollHeight - innerHeight;
      pr.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0) + ')';
    }
    addEventListener('scroll', progress, { passive: true }); progress();

    /* title scramble on hover */
    function scramble(el) {
      var txt = el.dataset.t || (el.dataset.t = el.textContent), chars = '01<>/_-+=*#', f = 0;
      clearInterval(el._t);
      el._t = setInterval(function () {
        el.textContent = txt.split('').map(function (c, i) { return c === ' ' || i < f / 2 ? c : chars[Math.random() * chars.length | 0]; }).join('');
        if (++f > txt.length * 2) { clearInterval(el._t); el.textContent = txt; }
      }, 28);
    }
    if (!reduce) {
      doc.querySelectorAll('.post-line').forEach(function (row) {
        var a = row.querySelector('.posts-title a');
        if (a) row.addEventListener('mouseenter', function () { scramble(a); });
      });
      var h1 = doc.querySelector('.post-title');
      if (h1) h1.addEventListener('mouseenter', function () { scramble(h1); });
    }
  });
})();
