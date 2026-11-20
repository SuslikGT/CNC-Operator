/* Контур детали: точки → эскиз и программа под стойку */
const CONT = {
  pts: [
    {x: 40, z: 0,  t: 'line', r: 0, c: 0},
    {x: 40, z: -20, t: 'line', r: 0, c: 0},
    {x: 30, z: -20, t: 'line', r: 0, c: 0},
    {x: 30, z: -50, t: 'line', r: 0, c: 0}
  ]
};

function contTypeName(t){
  return t === 'arcCW' ? 'дуга G2' : t === 'arcCCW' ? 'дуга G3' : 'линия';
}

/* центр дуги в координатах радиуса Xr/Z */
function contArcCenter(p1, p2, r, cw){
  const x1 = p1.x / 2, z1 = p1.z, x2 = p2.x / 2, z2 = p2.z;
  const dx = x2 - x1, dz = z2 - z1;
  const d = Math.hypot(dx, dz);
  if(!(r > 0) || d < 1e-9 || d > 2 * r) return null;
  const h = Math.sqrt(Math.max(0, r * r - d * d / 4));
  const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
  const nx = -dz / d, nz = dx / d;
  const s = cw ? 1 : -1;
  return {x: mx + nx * h * s, z: mz + nz * h * s};
}

/* фаски: точка с c превращается в две точки со срезом угла */
function contApplyChamfers(pts){
  if(pts.length < 3) return pts.slice();
  const out = [pts[0]];
  for(let i = 1; i < pts.length - 1; i++){
    const p = pts[i], prev = out[out.length - 1], next = pts[i + 1];
    if(!(p.c > 0) || p.t !== 'line' || next.t === 'arcCW' || next.t === 'arcCCW'){
      out.push(p);
      continue;
    }
    const ax = prev.x / 2, az = prev.z, bx = p.x / 2, bz = p.z, cx = next.x / 2, cz = next.z;
    const l1 = Math.hypot(bx - ax, bz - az), l2 = Math.hypot(cx - bx, cz - bz);
    if(!(l1 > 0) || !(l2 > 0)){ out.push(p); continue; }
    const c = Math.min(p.c, l1 * 0.9, l2 * 0.9);
    const x1 = bx - (bx - ax) / l1 * c, z1 = bz - (bz - az) / l1 * c;
    const x2 = bx + (cx - bx) / l2 * c, z2 = bz + (cz - bz) / l2 * c;
    out.push({x: x1 * 2, z: z1, t: 'line', r: 0, c: 0});
    out.push({x: x2 * 2, z: z2, t: 'line', r: 0, c: 0});
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function contCode(){
  const cnc = (typeof cncInfo === 'function') ? cncInfo().id : 'siemens';
  const vc = num('c_vc', 180), f = num('c_f', 0.25), lims = num('c_lims', 2000);
  const pts = contApplyChamfers(CONT.pts);
  if(pts.length < 2) return '; добавьте минимум две точки';
  const L = [];
  const fmt3 = v => fmt(v, 3);
  const g2 = v => fmt(v, 2);

  if(cnc === 'siemens'){
    L.push('; КОНТУР ДЕТАЛИ — SINUMERIK 828D');
    L.push('G18 G95 G40');
    L.push('G54 G71');
    L.push('T1 D1');
    L.push('G96 S' + fmt0(vc) + ' LIMS=' + fmt0(lims));
    L.push('G0 X' + g2(pts[0].x + 2) + ' Z2');
    L.push('M3 M8');
    L.push('G1 Z0 F' + fmt(f, 2));
  } else if(cnc === 'fanuc'){
    L.push('O0001 (КОНТУР ДЕТАЛИ — FANUC)');
    L.push('G21 G18 G40 G99');
    L.push('G50 S' + fmt0(lims));
    L.push('T0101');
    L.push('G96 S' + fmt0(vc));
    L.push('G0 X' + g2(pts[0].x + 2) + ' Z2');
    L.push('M3 M8');
    L.push('G1 Z0 F' + fmt(f, 2));
  } else {
    L.push('O0001 (КОНТУР ДЕТАЛИ — OSP)');
    L.push('G21 G18 G40 G97 G99');
    L.push('G50 S' + fmt0(lims));
    L.push('T0101');
    L.push('G97 S' + fmt0(Math.min(lims, 1200)) + ' M3 M8');
    L.push('G0 X' + g2(pts[0].x + 2) + ' Z2');
    L.push('G1 Z0 F' + fmt(f, 2));
  }

  for(let i = 1; i < pts.length; i++){
    const p1 = pts[i - 1], p2 = pts[i];
    if(p2.t === 'arcCW' || p2.t === 'arcCCW'){
      const cw = p2.t === 'arcCW';
      const g = cw ? 'G2' : 'G3';
      if(cnc === 'osp'){
        const c = contArcCenter(p1, p2, p2.r, cw);
        if(c){
          const I = c.x - p1.x / 2, K = c.z - p1.z;
          L.push(g + ' X' + g2(p2.x) + ' Z' + g2(p2.z) + ' I' + fmt3(I) + ' K' + fmt3(K) + ' F' + fmt(f, 2));
        } else {
          L.push('(дуга R' + fmt3(p2.r) + ' не строится: проверьте радиус)');
        }
      } else if(cnc === 'siemens'){
        L.push(g + ' X' + g2(p2.x) + ' Z' + g2(p2.z) + ' CR=' + fmt3(p2.r) + ' F' + fmt(f, 2));
      } else {
        L.push(g + ' X' + g2(p2.x) + ' Z' + g2(p2.z) + ' R' + fmt3(p2.r) + ' F' + fmt(f, 2));
      }
    } else {
      L.push('G1 X' + g2(p2.x) + ' Z' + g2(p2.z) + ' F' + fmt(f, 2));
    }
  }

  const last = pts[pts.length - 1];

  /* канавка */
  const gx = num('c_gr_x', 0), gz = num('c_gr_z', 0), gw = num('c_gr_w', 0);
  if(gx > 0 && gw > 0){
    const startD = last.x;
    L.push('(канавка ⌀' + g2(gx) + ' на Z' + g2(gz) + ', ширина ' + g2(gw) + ')');
    L.push('G0 X' + g2(startD + 2) + ' Z' + g2(gz));
    if(gw > 3.2){
      const step = gw / 2;
      L.push('G1 X' + g2(gx) + ' F0,08');
      L.push('G0 X' + g2(startD + 2));
      L.push('G0 Z' + g2(gz + step));
      L.push('G1 X' + g2(gx) + ' F0,08');
      L.push('G0 X' + g2(startD + 2));
    } else {
      L.push('G1 X' + g2(gx) + ' F0,08');
      L.push('G4 F0,2');
      L.push('G0 X' + g2(startD + 2));
    }
  }

  /* резьба */
  const tx = num('c_th_x', 0), tp = num('c_th_p', 0), tl = num('c_th_l', 0);
  if(tx > 0 && tp > 0 && tl > 0){
    const depth = 0.65 * tp;
    const zEnd = last.z - tl;
    L.push('(резьба M' + g2(tx) + '×' + fmt(tp, 2) + ', длина ' + g2(tl) + ')');
    if(cnc === 'fanuc'){
      const P = Math.round(depth * 1000), Q = Math.round(depth * 300);
      L.push('G0 X' + g2(tx + 2) + ' Z2');
      L.push('G76 P020060 Q' + Math.max(50, Math.round(Q / 3)) + ' R0,05');
      L.push('G76 X' + g2(tx - depth) + ' Z' + g2(zEnd) + ' P' + P + ' Q' + Q + ' F' + fmt(tp, 2));
    } else {
      const passes = 5;
      L.push('G0 X' + g2(tx + 2) + ' Z2');
      for(let i = 1; i <= passes; i++){
        const d = depth * Math.sqrt(i / passes);
        L.push('G0 X' + g2(tx - d + depth));
        L.push((cnc === 'osp' ? 'G33 Z' + g2(zEnd) + ' F' + fmt(tp, 2)
                              : 'G33 Z' + g2(zEnd) + ' K' + fmt(tp, 2)));
        L.push('G0 X' + g2(tx + 2));
      }
    }
  }

  /* отрезка */
  const cz = num('c_ct_z', 0);
  if(cz !== 0){
    L.push('(отрезка на Z' + g2(cz) + ')');
    L.push('G0 X' + g2(last.x + 2) + ' Z' + g2(cz));
    L.push('G1 X-0,5 F0,05');
    L.push('G0 X' + g2(last.x + 2));
  }

  L.push('G0 X' + g2(last.x + 40) + ' Z50');
  L.push('M9');
  L.push(cnc === 'siemens' ? 'M5' : 'M5');
  L.push('M30');
  return L.join('\n');
}

function contSvg(){
  const pts = contApplyChamfers(CONT.pts);
  if(pts.length < 2) return '<div class="note">Добавьте точки контура</div>';
  const W = 330, H = 190, pad = 26;
  const zs = pts.map(p => p.z), xs = pts.map(p => p.x / 2);
  const zMin = Math.min.apply(null, zs), zMax = Math.max.apply(null, zs);
  const xMin = Math.min.apply(null, xs, 0), xMax = Math.max.apply(null, xs);
  const spanZ = Math.max(1, zMax - zMin), spanX = Math.max(1, xMax - xMin);
  const sc = Math.min((W - pad * 2) / spanZ, (H - pad * 2) / spanX);
  const X = z => pad + (zMax - z) * sc;
  const Y = x => H - pad - (x - xMin) * sc;
  let d = 'M' + X(zs[0]).toFixed(1) + ',' + Y(xs[0]).toFixed(1);
  for(let i = 1; i < pts.length; i++){
    const p2 = pts[i];
    if(p2.t === 'arcCW' || p2.t === 'arcCCW'){
      d += ' A' + (p2.r * sc).toFixed(1) + ',' + (p2.r * sc).toFixed(1) + ' 0 0 ' +
        (p2.t === 'arcCW' ? 1 : 0) + ' ' + X(p2.z).toFixed(1) + ',' + Y(p2.x / 2).toFixed(1);
    } else {
      d += ' L' + X(p2.z).toFixed(1) + ',' + Y(p2.x / 2).toFixed(1);
    }
  }
  d += ' L' + X(pts[pts.length - 1].z).toFixed(1) + ',' + (H - pad) +
       ' L' + X(pts[0].z).toFixed(1) + ',' + (H - pad) + ' Z';
  return '<svg viewBox="0 0 ' + W + ' ' + H + '">' +
    '<path class="axis" d="M' + pad + ',' + (H - pad) + 'H' + (W - 8) + '"/>' +
    '<path class="part" d="' + d + '"/>' +
    '<text class="hint" x="' + pad + '" y="14">Z →</text>' +
    '<text class="hint" x="' + (W - 40) + '" y="' + (H - 4) + '">⌀</text>' +
    '</svg>';
}

function contRows(){
  let h = '';
  CONT.pts.forEach((p, i) => {
    h += '<div class="row3" style="align-items:end;margin-bottom:8px" data-crow="' + i + '">' +
      '<label class="f"><span>X, мм</span><input class="inp" type="text" inputmode="decimal" data-cx="' + i + '" value="' + fmt(p.x, 2) + '"></label>' +
      '<label class="f"><span>Z, мм</span><input class="inp" type="text" inputmode="decimal" data-cz="' + i + '" value="' + fmt(p.z, 2) + '"></label>' +
      '<label class="f"><span>Переход</span><select class="inp" data-ct="' + i + '">' +
        ['line','arcCW','arcCCW'].map(t => '<option value="' + t + '"' + (p.t === t ? ' selected' : '') + '>' +
          contTypeName(t) + '</option>').join('') + '</select></label>' +
      '<label class="f"><span>R</span><input class="inp" type="text" inputmode="decimal" data-cr="' + i + '" value="' + (p.r ? fmt(p.r, 2) : '') + '"></label>' +
      '<label class="f"><span>Фаска</span><input class="inp" type="text" inputmode="decimal" data-cc="' + i + '" value="' + (p.c ? fmt(p.c, 2) : '') + '"></label>' +
      '<button class="del" type="button" data-cdel="' + i + '">×</button>' +
    '</div>';
  });
  return h;
}

function contRefresh(rebuildRows){
  const svg = $('c_svg'); if(svg) svg.innerHTML = contSvg();
  const code = $('c_code'); if(code) code.textContent = contCode();
  if(rebuildRows !== false){
    const rows = $('c_rows'); if(rows) rows.innerHTML = contRows();
    contBindRows();
  }
}

function contBindRows(){
  $$('[data-cx]').forEach(el => el.addEventListener('input', () => {
    CONT.pts[+el.dataset.cx].x = parseFloat(String(el.value).replace(',', '.')) || 0;
    contRefresh(false);
  }));
  $$('[data-cz]').forEach(el => el.addEventListener('input', () => {
    CONT.pts[+el.dataset.cz].z = parseFloat(String(el.value).replace(',', '.')) || 0;
    contRefresh(false);
  }));
  $$('[data-ct]').forEach(el => el.addEventListener('change', () => {
    CONT.pts[+el.dataset.ct].t = el.value;
    contRefresh(false);
  }));
  $$('[data-cr]').forEach(el => el.addEventListener('change', () => {
    CONT.pts[+el.dataset.cr].r = parseFloat(String(el.value).replace(',', '.')) || 0;
    contRefresh(false);
  }));
  $$('[data-cc]').forEach(el => el.addEventListener('change', () => {
    CONT.pts[+el.dataset.cc].c = parseFloat(String(el.value).replace(',', '.')) || 0;
    contRefresh(false);
  }));
  $$('[data-cdel]').forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.cdel;
    if(CONT.pts.length <= 2){ toast('Нужно минимум две точки'); return; }
    CONT.pts.splice(i, 1);
    contRefresh();
  }));
}

SCREENS.contour = {
  title: 'Контур детали',
  render(){
    const cnc = (typeof cncInfo === 'function') ? cncInfo().name : 'стойка';
    return '<div class="card"><div class="kick">контур → программа · ' + esc(cnc) + '</div>' +
        '<div class="mini" style="margin-top:4px">Введите точки по часовой стрелке от торца: X — диаметр, ' +
        'Z — координата. Для дуги укажите радиус R и направление, для фаски — размер в поле «Фаска».</div></div>' +
      '<div class="scheme" id="c_svg"></div>' +
      '<div class="card"><div class="h">Точки контура</div><div id="c_rows"></div>' +
        '<div class="row2">' +
          '<button class="btn sm" type="button" id="c_add">Добавить точку</button>' +
          '<button class="btn sm ghost" type="button" id="c_example">Пример</button>' +
        '</div></div>' +
      '<div class="card"><div class="row2">' +
          fld('c_vc', 'Скорость Vc', '180', 'м/мин') + fld('c_f', 'Подача', '0,25', 'мм/об') +
        '</div><div class="row2">' +
          fld('c_lims', 'Ограничение оборотов', '2000', 'об/мин') +
          '<div></div></div>' +
        '<div class="h">Канавка</div><div class="row3">' +
          fld('c_gr_x', 'Диаметр дна', '32', 'мм') + fld('c_gr_z', 'Z канавки', '-40', 'мм') +
          fld('c_gr_w', 'Ширина', '3', 'мм') + '</div>' +
        '<div class="h">Резьба</div><div class="row3">' +
          fld('c_th_x', 'Диаметр', '24', 'мм') + fld('c_th_p', 'Шаг', '2', 'мм') +
          fld('c_th_l', 'Длина', '25', 'мм') + '</div>' +
        '<div class="h">Отрезка</div><div class="row2">' +
          fld('c_ct_z', 'Z отрезки', '-60', 'мм') + '<div></div></div>' +
      '</div>' +
      '<div class="h">Программа</div>' +
      '<pre class="code" id="c_code" style="white-space:pre;overflow:auto"></pre>' +
      '<div class="note">Программа-пример: проверьте нули, корректоры и лимиты станка, прогоните в графике ' +
      'стойки. Дуги на OSP выводятся через I/K, на Sinumerik — через CR=, на Fanuc — через R.</div>' +
      '<div class="warn">Не запускайте без проверки: шапка, номер инструмента и корректор подставлены условно.</div>';
  },
  mount(){
    ['c_vc','c_f','c_lims','c_gr_x','c_gr_z','c_gr_w','c_th_x','c_th_p','c_th_l','c_ct_z'].forEach(id => {
      const el = $(id); if(el){ el.addEventListener('input', contRefresh); el.addEventListener('change', contRefresh); }
    });
    const add = $('c_add');
    if(add) add.addEventListener('click', () => {
      const last = CONT.pts[CONT.pts.length - 1] || {x: 20, z: 0};
      CONT.pts.push({x: last.x, z: last.z - 10, t: 'line', r: 0, c: 0});
      contRefresh();
    });
    const ex = $('c_example');
    if(ex) ex.addEventListener('click', () => {
      CONT.pts = [
        {x: 40, z: 0, t: 'line', r: 0, c: 0},
        {x: 40, z: -15, t: 'line', r: 0, c: 0},
        {x: 30, z: -15, t: 'arcCW', r: 5, c: 0},
        {x: 30, z: -45, t: 'line', r: 0, c: 1},
        {x: 20, z: -50, t: 'line', r: 0, c: 0},
        {x: 20, z: -60, t: 'line', r: 0, c: 0}
      ];
      contRefresh();
    });
    contRefresh();
  }
};
