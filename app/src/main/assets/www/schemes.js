/* Анимированные схемы с реальным масштабом */
const SCHEME_ST = {};

function animScheme(key, el, target, render){
  if(!el) return;
  const now = (window.performance && performance.now) ? performance.now() : Date.now();
  const valid = target.every(v => isFinite(v) && v > 0);
  const preview = render(target);
  if(!valid || preview.indexOf('<div') === 0){
    el.innerHTML = preview;
    SCHEME_ST[key] = null;
    return;
  }
  let st = SCHEME_ST[key];
  if(!st || st.el !== el){
    st = SCHEME_ST[key] = {el: el, cur: target.slice(), from: target.slice(), target: target.slice(), t0: now, raf: 0};
    el.innerHTML = render(st.cur);
    return;
  }
  const same = target.length === st.target.length &&
    target.every((v, i) => Math.abs(v - st.target[i]) < 1e-9);
  if(same && !st.raf) return;
  st.from = st.cur.slice();
  st.target = target.slice();
  st.t0 = now;
  if(st.raf) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){
    st.cur = target.slice();
    el.innerHTML = render(st.cur);
    return;
  }
  const step = t => {
    const k = Math.min(1, (t - st.t0) / 240);
    const e = 1 - Math.pow(1 - k, 3);
    st.cur = st.from.map((v, i) => v + (st.target[i] - v) * e);
    el.innerHTML = render(st.cur);
    if(k < 1){ st.raf = requestAnimationFrame(step); }
    else { st.raf = 0; st.cur = st.target.slice(); }
  };
  st.raf = requestAnimationFrame(step);
}

function scaleBar(x, y, s, maxPx){
  const cands = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
  let mm = cands[0];
  for(let i = 0; i < cands.length; i++){ if(cands[i] * s <= maxPx) mm = cands[i]; }
  const px = mm * s;
  const lbl = (mm < 1 ? mm.toFixed(1).replace('.', ',') : String(mm)) + ' мм';
  return '<path class="barline" d="M' + x + ',' + y + 'h' + px.toFixed(1) + '"/>' +
    '<path class="bar-tick" d="M' + x + ',' + (y - 4) + 'v8M' + (x + px).toFixed(1) + ',' + (y - 4) + 'v8"/>' +
    '<text class="bar-text" x="' + (x + px + 6).toFixed(1) + '" y="' + (y + 3) + '">' + lbl + '</text>';
}
function n1(v){ return (Math.round(v * 10) / 10).toFixed(1); }
function n2(v){ return (Math.round(v * 100) / 100).toFixed(0); }

/* ---------- фаска ---------- */
function renderChamfer(v){
  const D = v[0], c = v[1], a = v[2];
  if(!(D > 0) || !(c > 0) || !(a > 0)) return emptyScheme('Введите диаметр, катет и угол фаски');
  const cy = 72, maxH = 80;
  const s = maxH / Math.max(D, 4 * c);
  const h = D * s;
  const top = cy - h / 2, bot = cy + h / 2;
  const rad = a * Math.PI / 180;
  const cpx = Math.max(1.2, Math.min(c * s, 90));
  const cpy = Math.max(1.2, Math.min(c * Math.tan(rad) * s, h * 0.45));
  const xR = 288, xL = 46;
  const path = 'M' + xL + ',' + top + ' L' + n1(xR - cpx) + ',' + top +
    ' L' + xR + ',' + n1(top + cpy) + ' L' + xR + ',' + bot + ' L' + xL + ',' + bot + ' Z';
  const ghost = 'M' + n1(xR - cpx) + ',' + top + ' L' + xR + ',' + top + ' L' + xR + ',' + n1(top + cpy);
  return '<svg viewBox="0 0 320 172">' +
    '<path class="part" d="' + path + '"/>' +
    '<path class="axis" d="M18,' + cy + 'H306"/>' +
    '<path class="tool" d="' + ghost + '"/>' +
    dimV(30, top, bot, '⌀' + fmt(D, 1)) +
    '<text x="' + n1(xR - cpx - 4) + '" y="' + n1(top - 8) + '" text-anchor="end">c ' + fmt(c, 2) + '</text>' +
    '<text x="' + (xR - 2) + '" y="' + n1(top + cpy + 16) + '" text-anchor="end">' + fmt(a, 0) + '°</text>' +
    '<text class="calc" x="' + (xL + 4) + '" y="' + n1(bot + 16) + '">X ' + fmt(D - 2 * c, 2) + ' · Z ' + fmt(-c, 2) + '</text>' +
    scaleBar(20, 152, s, 110) +
    '</svg>';
}

/* ---------- конус ---------- */
function renderCone(v){
  const d1 = v[0], d2 = v[1], L = v[2];
  if(!(d1 > 0) || !(d2 > 0) || !(L > 0)) return emptyScheme('Введите D1, D2 и длину');
  const cy = 70, maxH = 84, maxW = 198;
  const s = Math.min(maxH / Math.max(d1, d2), maxW / L);
  const h1 = d1 * s, h2 = d2 * s, w = Math.max(36, L * s);
  const x1 = 62, x2 = Math.min(286, x1 + w);
  const top1 = cy - h1 / 2, top2 = cy - h2 / 2;
  const path = 'M' + x1 + ',' + n1(top1) + ' L' + n1(x2) + ',' + n1(top2) +
    ' L' + n1(x2) + ',' + n1(cy + h2 / 2) + ' L' + x1 + ',' + n1(cy + h1 / 2) + ' Z';
  const ang = Math.atan((d1 - d2) / (2 * L)) * 180 / Math.PI;
  const baseY = Math.max(cy + h1 / 2, cy + h2 / 2) + 18;
  return '<svg viewBox="0 0 320 172">' +
    '<path class="part" d="' + path + '"/>' +
    '<path class="axis" d="M14,' + cy + 'H306"/>' +
    dimV(38, top1, cy + h1 / 2, 'D1 ' + fmt(d1, 1)) +
    dimV(300, top2, cy + h2 / 2, 'D2 ' + fmt(d2, 1)) +
    dimH(x1, x2, baseY, 'L ' + fmt(L, 1)) +
    '<text x="' + n1(x2 - 4) + '" y="' + n1(cy - 8) + '" text-anchor="end">' + fmt(ang, 2) + '°</text>' +
    scaleBar(20, 152, s, 110) +
    '</svg>';
}

/* ---------- галтель ---------- */
function renderFillet(v){
  const r = v[0];
  if(!(r > 0)) return emptyScheme('Введите радиус галтели');
  const W = 36, H = 24;
  const s = Math.min(84 / H, 190 / W);
  const rp = Math.min(r * s, 72);
  const x0 = 62, y0 = 44, x1 = 268, y1 = 132;
  const path = 'M' + x0 + ',' + n1(y0 + rp) + ' A' + n1(rp) + ',' + n1(rp) + ' 0 0 1 ' +
    n1(x0 + rp) + ',' + y0 + ' L' + x1 + ',' + y0 + ' L' + x1 + ',' + y1 + ' L' + x0 + ',' + y1 + ' Z';
  const cx = x0 + rp, cyy = y0 + rp;
  const mx = cx - rp * 0.7071, my = cyy - rp * 0.7071;
  return '<svg viewBox="0 0 320 172">' +
    '<path class="part" d="' + path + '"/>' +
    '<path class="tool" d="M' + x0 + ',' + n1(cyy) + ' L' + n1(cx) + ',' + n1(cyy) + ' L' + n1(cx) + ',' + y0 + '"/>' +
    '<circle cx="' + n1(cx) + '" cy="' + n1(cyy) + '" r="2.6" class="hl"/>' +
    '<path class="dim" d="M' + n1(cx) + ',' + n1(cyy) + ' L' + n1(mx) + ',' + n1(my) + '"/>' +
    '<text x="' + n1(cx + 8) + '" y="' + n1(cyy + 16) + '">r ' + fmt(r, 2) + '</text>' +
    '<text class="calc" x="' + (x0 + 4) + '" y="' + (y1 + 16) + '">' + fmt(2 * r, 1) + ' × ' + fmt(2 * r, 1) + '</text>' +
    scaleBar(20, 152, s, 110) +
    '</svg>';
}

/* ---------- профиль резьбы ---------- */
function renderThread(v, prof){
  prof = prof || {k2: 0.6495, k1: 1.0825, k3: 1.2269, name: '60°'};
  const d = v[0], P = v[1];
  if(!(d > 0) || !(P > 0)) return emptyScheme('Введите диаметр и шаг резьбы');
  const W = 340, x0 = 24, x1 = 224, turns = 3;
  const pitch = (x1 - x0) / turns;
  const cy = 82;
  const depth = Math.max(40, Math.min(56, pitch * 0.62));
  const crestY = cy - depth / 2, rootY = cy + depth / 2;
  let p = 'M' + n1(x0) + ',' + n1(crestY);
  for(let i = 0; i < turns; i++){
    const x = x0 + i * pitch;
    p += ' L' + n1(x + pitch * 0.22) + ',' + n1(crestY);
    p += ' L' + n1(x + pitch * 0.40) + ',' + n1(rootY);
    p += ' L' + n1(x + pitch * 0.60) + ',' + n1(rootY);
    p += ' L' + n1(x + pitch * 0.78) + ',' + n1(crestY);
    p += ' L' + n1(x + pitch) + ',' + n1(crestY);
  }
  const d2 = d - prof.k2 * P, d1 = d - prof.k1 * P;
  const d3 = prof.ac ? d - P - 2 * prof.ac : d - prof.k3 * P;
  const lx = x1 + 12;
  const y2 = cy - depth * 0.16;
  const y3 = rootY + 16;
  const bodyBottom = rootY + 26;
  return '<svg viewBox="0 0 ' + W + ' 170">' +
    '<path class="part" d="' + p + ' L' + n1(x1) + ',' + n1(bodyBottom) + ' L' + x0 + ',' + n1(bodyBottom) + ' Z"/>' +
    '<path class="axis" d="M8,' + cy + 'H' + (W - 8) + '"/>' +
    '<path class="dim" d="M' + n1(x0 + 4) + ',' + n1(crestY) + 'H' + n1(lx - 6) + '"/>' +
    '<path class="dim" d="M' + n1(x0 + 4) + ',' + n1(y2) + 'H' + n1(lx - 6) + '"/>' +
    '<path class="dim" d="M' + n1(x0 + 4) + ',' + n1(rootY) + 'H' + n1(lx - 6) + '"/>' +
    '<path class="dim" d="M' + n1(x0 + 4) + ',' + n1(y3) + 'H' + n1(lx - 6) + '"/>' +
    '<text class="calc" x="' + lx + '" y="' + n1(crestY + 4) + '">d ' + fmt(d, 2) + '</text>' +
    '<text x="' + lx + '" y="' + n1(y2 + 4) + '">d2 ' + fmt(d2, 2) + '</text>' +
    '<text x="' + lx + '" y="' + n1(rootY + 4) + '">d1 ' + fmt(d1, 2) + '</text>' +
    '<text x="' + lx + '" y="' + n1(y3 + 4) + '">d3 ' + fmt(d3, 2) + '</text>' +
    dimH(x0, x0 + pitch, bodyBottom + 16, 'P ' + fmt(P, 2)) +
    '<text class="hint" x="' + x0 + '" y="162">3 витка, ' + prof.name + ', профиль схематично</text>' +
    '</svg>';
}
