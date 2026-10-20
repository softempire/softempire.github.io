/* Home hero: draggable wireframe of a twisted tower. */
(function () {
  var cv = document.getElementById('cv'), view = document.getElementById('view'), ctx = cv.getContext('2d');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = 36, TWIST = 2.1 * Math.PI / 180, FH = 0.34, S = 1;       // floors, twist per floor, floor height, half-width
  var yaw = 0.7, pitch = 0.42, drag = null, W, H, dpr;
  function tok(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = view.clientWidth; H = view.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }
  function floor(i) {
    var a = i * TWIST, s = S * (1 - 0.18 * Math.sin(i / (N - 1) * Math.PI)) , y = i * FH, p = [];
    var k = [[-1,-1],[1,-1],[1,1],[-1,1]];
    for (var j = 0; j < 4; j++) { var x = k[j][0] * s, z = k[j][1] * s; p.push([x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a)]); }
    return p;
  }
  function proj(p, sc, cx, cy) {
    var cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    var x = p[0] * cyw - p[2] * syw, z = p[0] * syw + p[2] * cyw, y = p[1] - N * FH / 2;
    var y2 = y * cp - z * sp, z2 = y * sp + z * cp, f = 1 / (1 - z2 * 0.045);
    return [cx + x * sc * f, cy - y2 * sc * f, z2];
  }
  function draw() {
    if (!W) return;
    var ink = tok('--fg'), pen = tok('--accent'), mut = tok('--faint');
    ctx.clearRect(0, 0, W, H);
    var sc = Math.min(W, H) / 15, cx = W * 0.5, cy = H * 0.5;
    var fl = []; for (var i = 0; i < N; i++) fl.push(floor(i).map(function (p) { return proj(p, sc, cx, cy); }));
    // ground plan
    ctx.lineWidth = 1; ctx.strokeStyle = mut; ctx.globalAlpha = .45;
    for (var g = -4; g <= 4; g++) {
      var a = proj([g * .8, 0, -3.2], sc, cx, cy), b = proj([g * .8, 0, 3.2], sc, cx, cy);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      a = proj([-3.2, 0, g * .8], sc, cx, cy); b = proj([3.2, 0, g * .8], sc, cx, cy);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    // columns
    ctx.globalAlpha = 1;
    for (var j = 0; j < 4; j++) {
      ctx.beginPath(); ctx.strokeStyle = ink; ctx.lineWidth = 1;
      for (i = 0; i < N; i++) { var q = fl[i][j]; i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }
      ctx.stroke();
    }
    // slabs: nearer floors drawn darker
    for (i = 0; i < N; i++) {
      var f = fl[i], zc = (f[0][2] + f[1][2] + f[2][2] + f[3][2]) / 4;
      ctx.beginPath(); ctx.moveTo(f[0][0], f[0][1]); for (j = 1; j < 4; j++) ctx.lineTo(f[j][0], f[j][1]); ctx.closePath();
      ctx.strokeStyle = (i === N - 1 || i === 0) ? pen : ink; ctx.lineWidth = (i === N - 1 || i === 0) ? 1.6 : 1;
      ctx.globalAlpha = i % 3 === 0 || i === N - 1 ? 1 : .5; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // dimension line
    var d0 = proj([2.1, 0, 2.1], sc, cx, cy), d1 = proj([2.1, N * FH, 2.1], sc, cx, cy);
    ctx.strokeStyle = pen; ctx.fillStyle = pen; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(d0[0], d0[1]); ctx.lineTo(d1[0], d1[1]);
    [d0, d1].forEach(function (p) { ctx.moveTo(p[0] - 6, p[1]); ctx.lineTo(p[0] + 6, p[1]); }); ctx.stroke();
    ctx.font = '500 11px "IBM Plex Mono", monospace'; ctx.textAlign = 'left';
    ctx.fillText('148.0', d1[0] + 8, (d0[1] + d1[1]) / 2);
  }
  addEventListener('resize', size); size();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { setTimeout(draw, 0); });
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  view.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, yaw: yaw, pitch: pitch }; view.setPointerCapture(e.pointerId); });
  view.addEventListener('pointermove', function (e) {
    if (!drag) return;
    yaw = drag.yaw + (e.clientX - drag.x) * .01; pitch = Math.max(.05, Math.min(1.2, drag.pitch + (e.clientY - drag.y) * .006)); draw();
  });
  ['pointerup', 'pointercancel'].forEach(function (t) { view.addEventListener(t, function () { drag = null; }); });
  if (!reduce) (function spin() { if (!drag) { yaw += .003; draw(); } requestAnimationFrame(spin); })();
})();
