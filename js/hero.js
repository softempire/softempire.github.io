/* Home hero: draggable wireframe that cycles through engineering subjects
   (architecture, silicon, mechanical, hydraulics, civil road). The subject depends on the clock. */
(function () {
  'use strict';
  var cv = document.getElementById('cv'), view = document.getElementById('view');
  if (!cv || !view) return;
  var ctx = cv.getContext('2d');
  var nameEl = document.getElementById('scene-name'), subEl = document.getElementById('scene-sub'), dotsEl = document.getElementById('scene-dots');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TAU = Math.PI * 2, DUR = 8000, FADE = 900;
  var yaw = 0.7, pitch = 0.42, drag = null, W, H, dpr;

  /* ---------- geometry helpers: a line is {p: [[x,y,z]...], c: 0 ink | 1 pen | 2 faint, a: alpha} ---------- */
  function L(p, c, a) { return { p: p, c: c || 0, a: a == null ? 1 : a }; }
  function ring(cx, y, cz, r, n) {
    var p = [];
    for (var i = 0; i <= n; i++) { var t = i / n * TAU; p.push([cx + r * Math.cos(t), y, cz + r * Math.sin(t)]); }
    return p;
  }
  function box(x0, y0, z0, x1, y1, z1, c, a) {
    var b = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y0, z0]];
    var t = b.map(function (q) { return [q[0], y1, q[2]]; });
    var out = [L(b, c, a), L(t, c, a)];
    for (var i = 0; i < 4; i++) out.push(L([b[i], t[i]], c, a));
    return out;
  }
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

  /* ---------- scenes ---------- */
  function building() {
    var N = 36, TW = 2.1 * Math.PI / 180, FH = 0.34, Y0 = -N * FH / 2, lines = [], fl = [], i, j;
    var k = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (i = 0; i < N; i++) {
      var a = i * TW, s = 1 - 0.18 * Math.sin(i / (N - 1) * Math.PI), y = Y0 + i * FH, p = [];
      for (j = 0; j < 4; j++) { var x = k[j][0] * s, z = k[j][1] * s; p.push([x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a)]); }
      fl.push(p);
    }
    for (j = 0; j < 4; j++) lines.push(L(fl.map(function (f) { return f[j]; })));
    fl.forEach(function (f, n) {
      var edge = n === 0 || n === N - 1;
      lines.push(L(f.concat([f[0]]), edge ? 1 : 0, edge || n % 3 === 0 ? 1 : 0.5));
    });
    return { name: 'Architecture', sub: 'twisted tower, 36 floors', ext: 6.6, ground: { y: Y0, r: 3.2 }, lines: lines,
      dim: { a: [2.1, Y0, 2.1], b: [2.1, -Y0, 2.1], text: '148.0 m' } };
  }

  function chip() {
    var lines = box(-4, -0.3, -4, 4, 0.3, 4, 0), i, side;
    lines = lines.concat(box(-2, 0.3, -2, 2, 0.55, 2, 1));
    for (i = -1; i <= 1; i += 0.5) {                       // die grid
      lines.push(L([[i * 2, 0.56, -2], [i * 2, 0.56, 2]], 1, 0.45));
      lines.push(L([[-2, 0.56, i * 2], [2, 0.56, i * 2]], 1, 0.45));
    }
    var r = rng(7);
    for (side = 0; side < 4; side++) {
      var ca = Math.cos(side * Math.PI / 2), sa = Math.sin(side * Math.PI / 2);
      var rot = function (x, y, z) { return [x * ca - z * sa, y, x * sa + z * ca]; };
      for (i = 0; i < 16; i++) {
        var p = -3.75 + i * 0.5, mid = 2.2 + r() * 1.3;
        lines.push(L([rot(4, 0, p), rot(4.65, 0, p), rot(4.8, -0.3, p)]));                       // lead
        lines.push(L([rot(2, 0.31, p * 0.5), rot(mid, 0.31, p * 0.5), rot(mid, 0.31, p), rot(4, 0.31, p)], 0, 0.4)); // trace
      }
    }
    return { name: 'Silicon', sub: 'QFP-64, 0.5 mm pitch', ext: 5.4, ground: null, lines: lines,
      dim: { a: [-4, 0.3, -5.3], b: [4, 0.3, -5.3], text: '20 mm' } };
  }

  function gearOutline(cx, cz, n, rRoot, rTip, rot, y) {
    var a = TAU / n, pts = [], tips = [];
    for (var i = 0; i < n; i++) {
      var t0 = rot + i * a;
      [[rRoot, 0], [rTip, 0.2], [rTip, 0.45], [rRoot, 0.65]].forEach(function (q, idx) {
        var th = t0 + q[1] * a;
        pts.push([cx + q[0] * Math.cos(th), y, cz + q[0] * Math.sin(th)]);
        if (idx === 1) tips.push(pts.length - 1);
      });
    }
    pts.push(pts[0]);
    return { pts: pts, tips: tips };
  }
  function mechanical(t) {
    var h = 0.45, lines = [], aA = TAU / 24, aB = TAU / 12;
    var rotA = t * 0.4, rotB = Math.PI + 0.17 * aB - 2 * (rotA + 0.33 * aA);
    [[-1.89, 24, 2.29, 2.75, rotA, 0.95], [1.89, 12, 1.03, 1.49, rotB, 0.5]].forEach(function (g) {
      var top = gearOutline(g[0], 0, g[1], g[2], g[3], g[4], h), bot = gearOutline(g[0], 0, g[1], g[2], g[3], g[4], -h);
      lines.push(L(top.pts)); lines.push(L(bot.pts, 0, 0.55));
      top.tips.forEach(function (ix) { lines.push(L([top.pts[ix], bot.pts[ix]], 0, 0.5)); });
      lines.push(L(ring(g[0], h, 0, g[5], 28), 1)); lines.push(L(ring(g[0], h, 0, g[5] * 0.45, 20), 1));
      lines.push(L([[g[0], -h - 1.2, 0], [g[0], h + 1.2, 0]], 1, 0.6));
    });
    return { name: 'Mechanical', sub: 'spur gear pair, 2:1', ext: 4.4, ground: null, lines: lines,
      dim: { a: [-4.41, h, 3.5], b: [0.63, h, 3.5], text: 'Ø 50.4' } };
  }

  var PIPE_CACHE;
  function pipes(t) {
    if (!PIPE_CACHE) {
      var xs = [-1.3, 0.5, 2.3, 4.1], zs = [-2, 0, 2], GY = -2.2, lines = [], paths = [], i, j;
      var yy = function (a, b) { return 0.9 - 0.35 * a + (b - 1) * 0.25; };
      var node = function (a, b) { return [xs[a], yy(a, b), zs[b]]; };
      for (j = 0; j < 3; j++) for (i = 0; i < 3; i++) {
        var A = node(i, j), B = node(i + 1, j); paths.push([A, [B[0], A[1], A[2]], B]);
      }
      [1, 3].forEach(function (c) { for (var b = 0; b < 2; b++) { var A2 = node(c, b), B2 = node(c, b + 1); paths.push([A2, [A2[0], A2[1], B2[2]], B2]); } });
      paths.push([[-2.5, yy(0, 1), 0], node(0, 1)]);
      paths.forEach(function (p) { lines.push(L(p)); });
      for (i = 0; i < 4; i++) for (j = 0; j < 3; j++) {
        var n = node(i, j);
        lines.push(L(ring(n[0], n[1], n[2], 0.22, 14), 1));
        lines.push(L([n, [n[0], GY, n[2]]], 2, 0.8));
      }
      var tx = -3.3, y0 = -0.9, y1 = 1.5, r = 0.8;
      lines.push(L(ring(tx, y0, 0, r, 28), 1)); lines.push(L(ring(tx, y1, 0, r, 28), 1));
      [0, 1, 2, 3].forEach(function (q) { var a = q * Math.PI / 2; lines.push(L([[tx + r * Math.cos(a), y0, r * Math.sin(a)], [tx + r * Math.cos(a), y1, r * Math.sin(a)]], 1, 0.7)); });
      var meas = paths.map(function (p) {
        var cum = [0]; for (var k = 1; k < p.length; k++) cum.push(cum[k - 1] + Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1], p[k][2] - p[k - 1][2]));
        return { p: p, cum: cum, len: cum[cum.length - 1] };
      });
      PIPE_CACHE = { lines: lines, meas: meas, GY: GY };
    }
    var dots = [];
    PIPE_CACHE.meas.forEach(function (m, idx) {
      for (var k = 0; k < 2; k++) {
        var d = (((t * 0.22 + idx * 0.37 + k * 0.5) % 1) + 1) % 1 * m.len, s = 1;
        while (s < m.cum.length - 1 && m.cum[s] < d) s++;
        var f = (d - m.cum[s - 1]) / ((m.cum[s] - m.cum[s - 1]) || 1), a = m.p[s - 1], b = m.p[s];
        dots.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]);
      }
    });
    return { name: 'Hydraulics', sub: 'DN300 mains, 12 nodes', ext: 5.0, ground: { y: PIPE_CACHE.GY, r: 4.8 }, lines: PIPE_CACHE.lines, dots: dots,
      dim: { a: [-4.1, PIPE_CACHE.GY, 3.6], b: [4.1, PIPE_CACHE.GY, 3.6], text: '82 m' } };
  }

  function road() {
    var lines = [], gx, gz, s, hgt = function (x, z) { return 0.9 * Math.sin(x * 0.45 + 0.6) * Math.cos(z * 0.5) + 0.35 * Math.sin(z * 0.9 + x * 0.3) - 1.3; };
    for (gz = -4; gz <= 4.01; gz += 0.8) { var row = []; for (s = -5; s <= 5.01; s += 0.4) row.push([s, hgt(s, gz), gz]); lines.push(L(row, 2, 0.9)); }
    for (gx = -5; gx <= 5.01; gx += 0.8) { var col = []; for (s = -4; s <= 4.01; s += 0.4) col.push([gx, hgt(gx, s), s]); lines.push(L(col, 2, 0.9)); }
    var zc = function (x) { return 1.6 * Math.sin(x * 0.5); }, left = [], right = [], mid = [];
    for (s = -5; s <= 5.01; s += 0.2) {
      var dz = 0.8 * Math.cos(s * 0.5), n = Math.hypot(1, dz), nx = -dz / n, nz = 1 / n, x = s, z = zc(s);
      left.push([x + nx * 0.45, hgt(x + nx * 0.45, z + nz * 0.45) + 0.05, z + nz * 0.45]);
      right.push([x - nx * 0.45, hgt(x - nx * 0.45, z - nz * 0.45) + 0.05, z - nz * 0.45]);
      mid.push([x, hgt(x, z) + 0.06, z]);
    }
    lines.push(L(left, 1)); lines.push(L(right, 1));
    for (var i = 0; i < mid.length - 1; i += 2) lines.push(L([mid[i], mid[i + 1]], 0));                    // centre dashes
    for (i = 0; i < mid.length; i += 5) lines.push(L([left[i], right[i]], 0, 0.8));                          // stations
    return { name: 'Civil', sub: 'alignment with stations', ext: 5.2, ground: null, lines: lines,
      dim: { a: [-5, -2.7, -4.8], b: [5, -2.7, -4.8], text: '1,000 m' } };
  }

  var SOFT_CACHE;
  function software(t) {
    if (!SOFT_CACHE) {
      var lines = [], conns = [], ys = [-2, 0, 2], xs = [[-2.7, -0.9, 0.9, 2.7], [-1.8, 0, 1.8], [-0.9, 0.9]], zs = [[0.8, -0.8, 0.8, -0.8], [0.8, -0.8, 0.8], [0.8, -0.8]];
      ys.forEach(function (y, l) {
        lines.push(L([[-4, y, -2.4], [4, y, -2.4], [4, y, 2.4], [-4, y, 2.4], [-4, y, -2.4]], 0, 0.55));
        xs[l].forEach(function (x, m) { var z = zs[l][m]; lines = lines.concat(box(x - 0.6, y, z - 0.6, x + 0.6, y + 0.45, z + 0.6, l === 1 ? 1 : 0)); });
      });
      for (var l = 0; l < 2; l++) xs[l].forEach(function (x, m) {
        xs[l + 1].forEach(function (x2, m2) {
          var p = [[x, ys[l] + 0.45, zs[l][m]], [x2, ys[l + 1], zs[l + 1][m2]]];
          lines.push(L(p, 2, 0.9)); conns.push(p);
        });
      });
      SOFT_CACHE = { lines: lines, conns: conns };
    }
    var dots = SOFT_CACHE.conns.map(function (p, i) {
      var u = (((t * 0.3 + i * 0.29) % 1) + 1) % 1;
      return [p[0][0] + (p[1][0] - p[0][0]) * u, p[0][1] + (p[1][1] - p[0][1]) * u, p[0][2] + (p[1][2] - p[0][2]) * u];
    });
    return { name: 'Software', sub: 'layered modules, call flow', ext: 5.2, ground: null, lines: SOFT_CACHE.lines, dots: dots,
      dim: { a: [-4, -2, 3.2], b: [4, -2, 3.2], text: '9 modules' } };
  }

  function comms(t) {
    var lines = [], dots = [], GY = -2.8, i;
    function lattice(cx, cz, H, w0, w1, secs) {
      var lv = [], k, j;
      for (k = 0; k <= secs; k++) {
        var w = w0 + (w1 - w0) * k / secs, y = GY + H * k / secs;
        lv.push([[cx - w, y, cz - w], [cx + w, y, cz - w], [cx + w, y, cz + w], [cx - w, y, cz + w]]);
        lines.push(L(lv[k].concat([lv[k][0]])));
      }
      for (j = 0; j < 4; j++) lines.push(L(lv.map(function (q) { return q[j]; })));
      for (k = 0; k < secs; k++) for (j = 0; j < 4; j++) {
        var a = lv[k][j], b = lv[k][(j + 1) % 4], a2 = lv[k + 1][j], b2 = lv[k + 1][(j + 1) % 4];
        lines.push(L([a, b2], 0, 0.7)); lines.push(L([b, a2], 0, 0.7));
      }
      return GY + H;
    }
    var topA = lattice(-3.2, 0, 6, 0.7, 0.15, 6), topB = lattice(3.4, 0, 3, 0.5, 0.12, 3), ay = topA + 0.3, by = topB + 0.3;
    lines = lines.concat(box(-3.35, topA, -0.15, -3.05, topA + 0.6, 0.15, 1));
    for (i = 0; i < 4; i++) {                                                // radio waves leaving the antenna
      var u = (((t * 0.35 + i / 4) % 1) + 1) % 1;
      lines.push(L(ring(-3.2, ay, 0, 0.3 + u * 5.5, 48), 1, (1 - u) * 0.85));
    }
    var dish = []; for (i = 0; i <= 24; i++) { var th = i / 24 * TAU; dish.push([3.1, by + 0.6 * Math.cos(th), 0.6 * Math.sin(th)]); }
    lines.push(L(dish, 1)); lines.push(L([[3.4, by, 0], [3.1, by, 0]], 1));
    var A = [-3.05, ay, 0], B = [3.1, by, 0];                               // dashed radio link with pulses
    for (i = 0; i < 14; i += 2) lines.push(L([lerp(A, B, i / 14), lerp(A, B, (i + 1) / 14)], 2, 0.9));
    for (i = 0; i < 3; i++) dots.push(lerp(A, B, (((t * 0.3 + i / 3) % 1) + 1) % 1));
    return { name: 'Communication', sub: 'base station, radio link', ext: 5.6, ground: { y: GY, r: 4.8 }, lines: lines, dots: dots,
      dim: { a: [-3.2, GY, 3.4], b: [3.4, GY, 3.4], text: '2.4 km' } };
  }
  function agent(t) {
    var lines = [], dots = [], N = 6, R = 3.4, GY = -1.2, i, hub = [0, 0, 0], nodes = [];
    lines = lines.concat(box(-0.8, -0.8, -0.8, 0.8, 0.8, 0.8, 1));              // the agent: central core
    lines = lines.concat(box(-0.4, -0.4, -0.4, 0.4, 0.4, 0.4, 0));
    lines.push(L(ring(0, 0, 0, 1.5 + 0.12 * Math.sin(t * 2), 40), 2, 0.8));      // thinking halo
    for (i = 0; i < N; i++) {                                                  // tools around it
      var a = i / N * TAU, x = R * Math.cos(a), z = R * Math.sin(a), n = [x, 0, z];
      nodes.push(n);
      lines = lines.concat(box(x - 0.45, -0.45, z - 0.45, x + 0.45, 0.45, z + 0.45, 0));
      lines.push(L(ring(x, GY, z, 0.6, 16), 2, 0.7));
      lines.push(L([[x, -0.45, z], [x, GY, z]], 2, 0.6));
      lines.push(L([[hub[0] + 0.8 * Math.cos(a), 0, 0.8 * Math.sin(a)], [x - 0.45 * Math.cos(a), 0, z - 0.45 * Math.sin(a)]], 2, 0.9));
    }
    lines.push(L(ring(0, GY, 0, R, 48), 2, 0.5));
    for (i = 0; i < N; i++) {                                                  // calls go out, results come back
      var u = (((t * 0.35 + i * 0.17) % 1) + 1) % 1, v = u < 0.5 ? u * 2 : 2 - u * 2, a2 = i / N * TAU;
      dots.push(lerp([1.0 * Math.cos(a2), 0, 1.0 * Math.sin(a2)], [(R - 0.6) * Math.cos(a2), 0, (R - 0.6) * Math.sin(a2)], v));
    }
    return { name: 'Agent', sub: 'planner, tools, feedback loop', ext: 4.4, ground: { y: GY, r: 4.8 }, lines: lines, dots: dots,
      dim: { a: [-R, GY, R + 0.9], b: [R, GY, R + 0.9], text: '6 tools' } };
  }
  var MESH_CACHE;
  function mesh(t) {
    if (!MESH_CACHE) {                                                         // PCB: grid lines cluster around component edges
      var xs = [-3.6, -3, -2.55, -2.3, -2.2, -2.1, -1.5, -0.9, -0.7, -0.6, -0.5, -0.1, 0.4, 0.8, 0.95, 1.0, 1.05, 1.9, 2.7, 2.8, 2.9, 3.2, 3.6],
          zs = [-2.4, -1.8, -1.3, -1.1, -1.0, -0.9, -0.7, -0.6, -0.5, -0.1, 0.4, 0.75, 0.8, 0.85, 1.3, 1.4, 1.5, 1.9, 2.4],
          lines = [], Y = 0, i, j, nx = xs.length - 1, nz = zs.length - 1, Tk = -0.2;
      for (i = 0; i <= nx; i++) lines.push(L([[xs[i], Y, zs[0]], [xs[i], Y, zs[nz]]], i === 0 || i === nx ? 0 : 2, i === 0 || i === nx ? 1 : 0.9));
      for (j = 0; j <= nz; j++) lines.push(L([[xs[0], Y, zs[j]], [xs[nx], Y, zs[j]]], j === 0 || j === nz ? 0 : 2, j === 0 || j === nz ? 1 : 0.9));
      for (i = 0; i < nx; i++) for (j = 0; j < nz; j++)                        // each cell split into two triangles
        lines.push((i + j) % 2 ? L([[xs[i], Y, zs[j]], [xs[i + 1], Y, zs[j + 1]]], 2, 0.9) : L([[xs[i + 1], Y, zs[j]], [xs[i], Y, zs[j + 1]]], 2, 0.9));
      var X0 = xs[0], X1 = xs[nx], Z0 = zs[0], Z1 = zs[nz];                    // board edge thickness
      lines.push(L([[X0, Tk, Z0], [X1, Tk, Z0], [X1, Tk, Z1], [X0, Tk, Z1], [X0, Tk, Z0]], 0, 0.8));
      [[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1]].forEach(function (c) { lines.push(L([[c[0], Y, c[1]], [c[0], Tk, c[1]]], 0, 0.8)); });
      lines = lines.concat(box(-2.2, 0, -1.0, -0.6, 0.45, 0.8, 1));            // two ICs
      lines = lines.concat(box(1.0, 0, -0.6, 2.8, 0.35, 1.4, 1));
      [[-3.2, -2.0], [3.2, -2.0], [3.2, 2.0], [-3.2, 2.0]].forEach(function (c) { lines.push(L(ring(c[0], Y, c[1], 0.17, 12), 1)); });  // mounting holes
      var trace = [[-0.6, 0.01, 0.1], [0.4, 0.01, 0.1], [0.4, 0.01, 0.4], [1.0, 0.01, 0.4]], trace2 = [[-1.5, 0.01, -1.0], [-1.5, 0.01, -1.8], [1.9, 0.01, -1.8], [1.9, 0.01, -0.6]];
      lines.push(L(trace, 1)); lines.push(L(trace2, 1));
      MESH_CACHE = { lines: lines, paths: [trace, trace2], tris: nx * nz * 2 };
    }
    var dots = [];
    MESH_CACHE.paths.forEach(function (pts, pi) {                              // signals running along the traces
      var cum = [0], k, len;
      for (k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][2] - pts[k - 1][2]));
      len = cum[cum.length - 1];
      for (var n = 0; n < 2; n++) {
        var d = ((((t * 0.18 + n / 2 + pi * 0.3) % 1) + 1) % 1) * len, s2 = 1;
        while (s2 < cum.length - 1 && cum[s2] < d) s2++;
        dots.push(lerp(pts[s2 - 1], pts[s2], (d - cum[s2 - 1]) / (cum[s2] - cum[s2 - 1])));
      }
    });
    return { name: 'Mesh', sub: 'PCB board, refined at components', ext: 4.6, ground: null, lines: MESH_CACHE.lines, dots: dots,
      dim: { a: [-3.6, -0.2, 2.9], b: [3.6, -0.2, 2.9], text: MESH_CACHE.tris + ' tris' } };
  }

  function geometry(t) {
    var lines = [], dots = [], LN = 4, XW = 3.4, ZW = 2.2, gap = 0.5 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.7)), ys = [], k, i;
    for (k = 0; k < LN; k++) ys.push((k - (LN - 1) / 2) * gap);                  // layer stack, breathing apart and together
    var V = [[-2, -1], [0, 0.8], [2, -0.6]], top = ys[LN - 1];
    for (k = 0; k < LN; k++) {
      var y = ys[k], outer = k === 0 || k === LN - 1;
      lines.push(L([[-XW, y, -ZW], [XW, y, -ZW], [XW, y, ZW], [-XW, y, ZW], [-XW, y, -ZW]], 0, outer ? 1 : 0.7));
      var a = V[k % 3], b = V[(k + 1) % 3];                                    // copper traces joining the vias
      lines.push(L([[a[0], y, a[1]], [b[0], y, a[1]], [b[0], y, b[1]]], k === LN - 1 ? 1 : 2, 1));
      [[-3.0, -1.8], [3.0, -1.8], [3.0, 1.8], [-3.0, 1.8]].forEach(function (c) { lines.push(L(ring(c[0], y, c[1], 0.15, 12), 2, 0.8)); });
    }
    V.forEach(function (v, n) {                                                // vias run through every layer
      lines.push(L([[v[0], ys[0], v[1]], [v[0], top, v[1]]], 1));
      for (k = 0; k < LN; k++) lines.push(L(ring(v[0], ys[k], v[1], 0.16, 12), 1));
      var u = (((t * 0.3 + n / 3) % 1) + 1) % 1;
      dots.push([v[0], ys[0] + (top - ys[0]) * u, v[1]]);
    });
    lines = lines.concat(box(-1.2, top, -0.9, 0.6, top + 0.45, 0.2, 1));      // IC package
    for (i = 0; i < 6; i++) lines = lines.concat(box(-2.5 + i * 1.0 - 0.12, top, -1.95, -2.5 + i * 1.0 + 0.12, top + 0.5, -1.7, 0));  // header pins
    [[2.6, 1.2], [-2.6, 1.3]].forEach(function (c) {                           // capacitors
      lines.push(L(ring(c[0], top, c[1], 0.22, 16), 0)); lines.push(L(ring(c[0], top + 0.55, c[1], 0.22, 16), 0));
      [0, 1, 2, 3].forEach(function (q) { var an = q * Math.PI / 2; lines.push(L([[c[0] + 0.22 * Math.cos(an), top, c[1] + 0.22 * Math.sin(an)], [c[0] + 0.22 * Math.cos(an), top + 0.55, c[1] + 0.22 * Math.sin(an)]], 0, 0.7)); });
    });
    return { name: 'Geometry', sub: 'PCB stack-up, vias, components', ext: 4.8, ground: null, lines: lines, dots: dots,
      dim: { a: [-XW, ys[0], ZW + 0.5], b: [XW, ys[0], ZW + 0.5], text: LN + ' layers' } };
  }

  function lerp(a, b, u) { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }

  var builders = [building, road, chip, mechanical, pipes, software, comms, agent, mesh, geometry], cache = [], ANIM = { 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 };
  function scene(i, t) { return ANIM[i] ? builders[i](t) : (cache[i] || (cache[i] = builders[i](t))); }

  /* ---------- rendering ---------- */
  function tok(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = view.clientWidth; H = view.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); frame(performance.now());
  }
  function drawScene(sc, alpha, col, sf) {
    var cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cx = W * 0.5, cy = H * 0.5;
    function proj(p) {
      var x = p[0] * cyw - p[2] * syw, z = p[0] * syw + p[2] * cyw, y2 = p[1] * cp - z * sp, z2 = p[1] * sp + z * cp, f = 1 / (1 - z2 * 0.045);
      return [cx + x * sf * f, cy - y2 * sf * f];
    }
    function path(pts) { var q = proj(pts[0]); ctx.moveTo(q[0], q[1]); for (var i = 1; i < pts.length; i++) { q = proj(pts[i]); ctx.lineTo(q[0], q[1]); } }
    ctx.lineWidth = 1;
    if (sc.ground) {
      ctx.strokeStyle = col.faint; ctx.globalAlpha = 0.45 * alpha; ctx.beginPath();
      var n = Math.floor(sc.ground.r / 0.8), r = n * 0.8;
      for (var g = -n; g <= n; g++) { path([[g * 0.8, sc.ground.y, -r], [g * 0.8, sc.ground.y, r]]); path([[-r, sc.ground.y, g * 0.8], [r, sc.ground.y, g * 0.8]]); }
      ctx.stroke();
    }
    [0, 2, 1].forEach(function (c) {                                      // ink, faint, then pen on top
      ctx.strokeStyle = c === 0 ? col.ink : c === 1 ? col.pen : col.faint; ctx.lineWidth = c === 1 ? 1.4 : 1;
      sc.lines.forEach(function (l) {
        if (l.c !== c) return;
        ctx.globalAlpha = l.a * alpha * (c === 2 ? 0.55 : 1); ctx.beginPath(); path(l.p); ctx.stroke();
      });
    });
    if (sc.dots) {
      ctx.fillStyle = col.pen; ctx.globalAlpha = alpha;
      sc.dots.forEach(function (d) { var q = proj(d); ctx.beginPath(); ctx.arc(q[0], q[1], 2.4, 0, TAU); ctx.fill(); });
    }
    if (sc.dim) {
      var a = proj(sc.dim.a), b = proj(sc.dim.b);
      ctx.globalAlpha = alpha; ctx.strokeStyle = col.pen; ctx.fillStyle = col.pen; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      [a, b].forEach(function (p) { ctx.moveTo(p[0] - 5, p[1] - 5); ctx.lineTo(p[0] + 5, p[1] + 5); });
      ctx.stroke();
      ctx.font = '500 11px "IBM Plex Mono", monospace'; ctx.textAlign = 'left';
      ctx.fillText(sc.dim.text, (a[0] + b[0]) / 2 + 8, (a[1] + b[1]) / 2 - 4);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- timeline: the subject follows the clock ---------- */
  var cur = -1, prev = -1, switchedAt = 0, holdUntil = 0, dots = [];
  function label(i) {
    var s = scene(i, 0);
    nameEl.textContent = s.name; subEl.textContent = s.sub;
    dots.forEach(function (d, k) { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
  }
  function switchTo(i, now) { if (i === cur) return; prev = cur; cur = i; switchedAt = now; label(i); }
  builders.forEach(function (b, i) {
    var d = document.createElement('button'); d.type = 'button'; d.setAttribute('aria-label', 'Show ' + scene(i, 0).name.toLowerCase());
    d.addEventListener('click', function (e) { e.stopPropagation(); holdUntil = Date.now() + DUR * 2; switchTo(i, performance.now()); frame(performance.now()); });
    d.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    dotsEl.appendChild(d); dots.push(d);
  });

  function frame(now) {
    if (!W) return;
    var col = { ink: tok('--fg'), pen: tok('--accent'), faint: tok('--faint') }, t = now / 1000;
    if (!reduce && Date.now() > holdUntil) switchTo(Math.floor(Date.now() / DUR) % builders.length, now);
    ctx.clearRect(0, 0, W, H);
    var p = Math.min(1, (now - switchedAt) / FADE);
    if (prev >= 0 && p < 1) { var o = scene(prev, t); drawScene(o, 1 - p, col, Math.min(W, H) / (2.3 * o.ext)); }
    var s = scene(cur, t); drawScene(s, prev >= 0 ? p : 1, col, Math.min(W, H) / (2.3 * s.ext));
  }

  switchTo(reduce ? 0 : Math.floor(Date.now() / DUR) % builders.length, performance.now());
  addEventListener('resize', size); size();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { frame(performance.now()); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { setTimeout(function () { frame(performance.now()); }, 0); });
  new MutationObserver(function () { frame(performance.now()); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  view.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, yaw: yaw, pitch: pitch }; view.setPointerCapture(e.pointerId); });
  view.addEventListener('pointermove', function (e) {
    if (!drag) return;
    yaw = drag.yaw + (e.clientX - drag.x) * 0.01; pitch = Math.max(0.05, Math.min(1.2, drag.pitch + (e.clientY - drag.y) * 0.006)); frame(performance.now());
  });
  ['pointerup', 'pointercancel'].forEach(function (t) { view.addEventListener(t, function () { drag = null; }); });
  if (!reduce) (function spin(now) { if (!drag) { yaw += 0.003; frame(now); } requestAnimationFrame(spin); })(performance.now());
})();
