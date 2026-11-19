/* Допуски и посадки: ISO 286-1 / ГОСТ 25346 */
const TOL_RANGES = [
  { lo: 0,   hi: 3,   d: 1.732 },
  { lo: 3,   hi: 6,   d: 4.243 },
  { lo: 6,   hi: 10,  d: 7.746 },
  { lo: 10,  hi: 18,  d: 13.416 },
  { lo: 18,  hi: 30,  d: 23.238 },
  { lo: 30,  hi: 50,  d: 38.73 },
  { lo: 50,  hi: 80,  d: 63.246 },
  { lo: 80,  hi: 120, d: 97.98 },
  { lo: 120, hi: 180, d: 146.97 },
  { lo: 180, hi: 250, d: 212.13 },
  { lo: 250, hi: 315, d: 280.62 },
  { lo: 315, hi: 400, d: 354.96 },
  { lo: 400, hi: 500, d: 447.21 }
];
/* Допуски IT, мкм: квалитеты 5…18 */
const TOL_IT = {
  5:  [4, 5, 6, 8, 9, 11, 13, 15, 18, 20, 23, 25, 27],
  6:  [6, 8, 9, 11, 13, 16, 19, 22, 25, 29, 32, 36, 40],
  7:  [10, 12, 15, 18, 21, 25, 30, 35, 40, 46, 52, 57, 63],
  8:  [14, 18, 22, 27, 33, 39, 46, 54, 63, 72, 81, 89, 97],
  9:  [25, 30, 36, 43, 52, 62, 74, 87, 100, 115, 130, 140, 155],
  10: [40, 48, 58, 70, 84, 100, 120, 140, 160, 185, 210, 230, 250],
  11: [60, 75, 90, 110, 130, 160, 190, 220, 250, 290, 320, 360, 400],
  12: [100, 120, 150, 180, 210, 250, 300, 350, 400, 460, 520, 570, 630],
  13: [140, 180, 220, 270, 330, 390, 460, 540, 630, 720, 810, 890, 970],
  14: [250, 300, 360, 430, 520, 620, 740, 870, 1000, 1150, 1300, 1400, 1550],
  15: [400, 480, 580, 700, 840, 1000, 1200, 1400, 1600, 1850, 2100, 2300, 2500],
  16: [600, 750, 900, 1100, 1300, 1600, 1900, 2200, 2500, 2900, 3200, 3600, 4000],
  17: [1000, 1200, 1500, 1800, 2100, 2500, 3000, 3500, 4000, 4600, 5200, 5700, 6300],
  18: [1400, 1800, 2200, 2700, 3300, 3900, 4600, 5400, 6300, 7200, 8100, 8900, 9700]
};
/* Основные отклонения валов, мкм (ISO 286-1, табличные значения) */
const TOL_DEV = {
  a: [-270, -270, -280, -290, -300, -310, -340, -380, -460, -580, -800, -860, -960],
  b: [-140, -140, -150, -150, -160, -170, -180, -200, -240, -260, -290, -320, -360],
  c: [-60, -70, -80, -95, -110, -120, -140, -170, -200, -230, -260, -280, -310],
  d: [-20, -30, -40, -50, -65, -80, -100, -120, -145, -170, -190, -210, -230],
  e: [-14, -20, -25, -32, -40, -50, -60, -72, -85, -100, -110, -125, -135],
  f: [-6, -10, -13, -16, -20, -25, -30, -36, -43, -50, -56, -62, -68],
  g: [-2, -4, -5, -6, -7, -9, -10, -12, -14, -15, -17, -18, -20],
  k: [0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5],
  m: [2, 4, 6, 7, 8, 9, 11, 13, 15, 17, 20, 21, 23],
  n: [4, 8, 10, 12, 15, 17, 20, 23, 27, 31, 34, 37, 40]
};
const TOL_LETTERS = {  a: 'зазор, большое отрицательное отклонение',
  b: 'зазор, отрицательное отклонение',
  c: 'зазор',
  d: 'зазор',
  e: 'зазор, ходовая посадка',
  f: 'зазор, ходовая посадка',
  g: 'малый зазор',
  h: 'верхнее отклонение 0',
  js: 'симметричное (±IT/2)',
  k: 'переходная',
  m: 'переходная, натяг растёт',
  n: 'переходная, ближе к натягу'
};

function tolRange(size){
  for(let i = 0; i < TOL_RANGES.length; i++){
    const r = TOL_RANGES[i];
    if(size > r.lo && size <= r.hi) return {i: i, r: r};
  }
  if(size <= 0) return null;
  return {i: TOL_RANGES.length - 1, r: TOL_RANGES[TOL_RANGES.length - 1]};
}
function tolParse(text){
  const s = String(text || '').trim().replace(/\s+/g, '').replace(',', '.');
  const m = s.match(/^(\d+(?:\.\d+)?)([A-Za-z]{1,2})(\d{1,2})$/);
  if(!m) return null;
  const letterRaw = m[2];
  const letter = letterRaw.toLowerCase();
  const grade = parseInt(m[3], 10);
  const size = parseFloat(m[1]);
  if(!(size > 0)) return null;
  if(!TOL_IT[grade]) return {bad: 'grade', grade: grade};
  if(!(letter in TOL_LETTERS)) return {bad: 'letter', letter: letterRaw};
  return {size: size, letter: letter, hole: letterRaw === letterRaw.toUpperCase(), grade: grade, raw: s};
}
function tolDeviation(size, letter, grade, hole, it){
  const rg = tolRange(size);
  if(!rg) return null;
  let es = 0, ei = 0;
  const base = TOL_DEV[letter] ? TOL_DEV[letter][rg.i] : null;
  if(letter === 'js'){
    es = it / 2;
    ei = -it / 2;
  } else if(letter === 'h'){
    es = 0;
    ei = -it;
  } else if(base === null){
    return null;
  } else if(letter === 'k' || letter === 'm' || letter === 'n'){
    ei = base;
    es = ei + it;
  } else {
    es = base;
    ei = es - it;
  }
  if(hole){
    let ES = -ei, EI = -es;
    if(letter === 'k' || letter === 'm' || letter === 'n'){
      const delta = (grade >= 6 && grade <= 8) ? it - TOL_IT[grade - 1][rg.i] : 0;
      ES = -ei + delta;
      EI = ES - it;
    }
    return {ei: EI, es: ES, range: rg.r, hole: true};
  }
  return {ei: ei, es: es, range: rg.r, hole: false};
}
function tolDevParse(text){
  const raw = String(text || '').trim();
  const s = raw.replace(/\s+/g, '').replace(/,/g, '.');
  const m = s.match(/^(\d+(?:\.\d+)?)((?:[+\-±]\d+(?:\.\d+)?){1,2})$/);
  if(!m) return null;
  const size = parseFloat(m[1]);
  if(!(size > 0)) return null;
  const parts = m[2].match(/[+\-±]\d+(?:\.\d+)?/g) || [];
  let es = null, ei = null;
  if(parts.length === 1 && parts[0].charAt(0) === '±'){
    const v = Math.abs(parseFloat(parts[0].slice(1)));
    es = v; ei = -v;
  } else if(parts.length === 2){
    es = parseFloat(parts[0]);
    ei = parseFloat(parts[1]);
  } else {
    return {bad: 'dev', raw: raw};
  }
  if(!isFinite(es) || !isFinite(ei)) return {bad: 'dev', raw: raw};
  let swapped = false;
  if(es < ei){ const t = es; es = ei; ei = t; swapped = true; }
  if(Math.abs(es) >= size || Math.abs(ei) >= size) return {bad: 'range', raw: raw};
  return {size: size, es: es, ei: ei, raw: raw, swapped: swapped};
}
function tolCalc(){
  const out = $('tol_out');
  if(!out) return;
  const text = val('tol_q');
  const mm = v => {
    const fourth = Math.abs(v * 1000 - Math.round(v * 1000)) > 1e-6;
    return fmt(v, fourth ? 4 : 3);
  };
  const sign = v => (v > 0 ? '+' : v < 0 ? '−' : '') + mm(Math.abs(v));

  const dev = tolDevParse(text);
  if(dev && dev.bad){
    out.innerHTML = dev.bad === 'range'
      ? '<div class="warn">Отклонения больше самого размера. Проверьте запись: <b>40-0,2-0,45</b>.</div>'
      : '<div class="warn">Нужны два отклонения или «±». Примеры: <b>40-0,2-0,45</b>, <b>40+0,1-0,05</b>, ' +
        '<b>40±0,1</b>.</div>';
    return;
  }
  if(dev){
    const max = dev.size + dev.es, min = dev.size + dev.ei;
    const mid = (max + min) / 2;
    out.innerHTML =
      rbox('Верхнее отклонение', sign(dev.es), 'мм', dev.es > 0 ? 'good' : '') +
      rbox('Нижнее отклонение', sign(dev.ei), 'мм', dev.ei < 0 ? 'bad' : '') +
      rbox('Поле допуска', fmt0((dev.es - dev.ei) * 1000), 'мкм') +
      rbox('Наибольший размер', mm(max), 'мм') +
      rbox('Наименьший размер', mm(min), 'мм') +
      rbox('Средний размер', mm(mid), 'мм', 'good') +
      '<div class="note" style="grid-column:1/-1">Задано отклонениями: <b>' + esc(dev.raw) + '</b>. ' +
        'Настройка по среднему размеру: ' + mm(mid) + ' мм.' +
        (dev.swapped ? ' Отклонения переставлены — верхнее должно быть больше нижнего.' : '') + '</div>';
    return;
  }

  const p = tolParse(text);
  if(!p || p.bad){
    if(p && p.bad === 'letter'){
      out.innerHTML = '<div class="warn">Буква <b>' + esc(p.letter) + '</b> в этом разделе не считается: ' +
        'посадки с натягом (p…z и P…Z) смотрите по справочнику. Доступны a…n и A…N.</div>';
      return;
    }
    if(p && p.bad === 'grade'){
      out.innerHTML = '<div class="warn">Квалитет IT' + esc(p.grade) + ' не поддерживается. ' +
        'В разделе есть квалитеты IT5…IT18.</div>';
      return;
    }
    out.innerHTML = '<div class="warn">Введите размер с буквой и квалитетом либо с отклонениями. ' +
      'Примеры: <b>14h14</b>, <b>12h9</b>, <b>4G10</b>, <b>40-0,2-0,45</b>, <b>40±0,1</b>.</div>';
    return;
  }
  const rg = tolRange(p.size);
  const it = TOL_IT[p.grade][rg.i];
  const d = tolDeviation(p.size, p.letter, p.grade, p.hole, it);
  if(!d){
    out.innerHTML = '<div class="warn">Буква <b>' + esc(p.letter) + '</b> в этом разделе не считается. ' +
      'Доступны: a…h, js, k, m, n для валов и A…H, JS, K, M, N для отверстий.</div>';
    return;
  }
  const es = d.es / 1000, ei = d.ei / 1000;
  const max = p.size + es, min = p.size + ei;
  const kind = p.hole ? 'отверстие' : 'вал';
  out.innerHTML =
    rbox('Допуск IT' + p.grade, fmt0(it), 'мкм', 'lead') +
    rbox('Верхнее отклонение', sign(es), 'мм', es > 0 ? 'good' : '') +
    rbox('Нижнее отклонение', sign(ei), 'мм', ei < 0 ? 'bad' : '') +
    rbox('Наибольший размер', mm(max), 'мм') +
    rbox('Наименьший размер', mm(min), 'мм') +
    rbox('Средний размер', mm((max + min) / 2), 'мм', 'good') +
    '<div class="note" style="grid-column:1/-1">' + esc(p.raw) + ' — ' + kind + ', интервал ' +
      fmt(rg.r.lo, 0) + '–' + fmt(rg.r.hi, 0) + ' мм, квалитет IT' + p.grade + ' = ' + fmt0(it) + ' мкм. ' +
      TOL_LETTERS[p.letter] + '.</div>' +
    (p.size > 500 ? '<div class="warn" style="grid-column:1/-1">Размер ' + fmt(p.size, 1) +
      ' мм больше 500 — таблица ISO 286 до 500 мм, значения взяты для последнего интервала (400–500).</div>' : '');
}

let TOL_UNIT = 'mm';
function tolVal(um){
  return TOL_UNIT === 'mm' ? fmt(um / 1000, 3) : fmt0(um);
}
SCREENS.toler = {
  title: 'Допуски и посадки',
  render(){
    const unit = TOL_UNIT === 'mm' ? 'мм' : 'мкм';
    const itRows = (from, to) => {
      let h = '<div class="tw"><table><tr><th>Размер, мм</th>';
      for(let g = from; g <= to; g++) h += '<th class="n">IT' + g + '</th>';
      h += '</tr>';
      TOL_RANGES.forEach((r, i) => {
        h += '<tr><td>' + (i === 0 ? 'до 3' : fmt(r.lo, 0) + '–' + fmt(r.hi, 0)) + '</td>';
        for(let g = from; g <= to; g++) h += '<td class="n">' + tolVal(TOL_IT[g][i]) + '</td>';
        h += '</tr>';
      });
      return h + '</table></div>';
    };
    return '<div class="card">' +
        fld('tol_q', 'Размер с допуском', '14h14', '', {ph: '14h14 или 40-0,2-0,45', text: true}) +
        '<div class="mini" style="margin:2px 2px 10px">' +
          ['14h14','12h9','4G10','30H7','25js6','40-0,2-0,45','40±0,1'].map(x =>
            '<span class="pill" data-tol="' + x + '">' + x + '</span>').join('') + '</div>' +
        '<div class="res" id="tol_out"></div>' +
      '</div>' +
      '<div class="h">Допуски IT, ' + unit + '</div>' +
      seg('tol_unit', [['mm','В мм'],['um','В мкм']], TOL_UNIT) +
      itRows(5, 11) +
      '<div class="h">Грубые квалитеты, ' + unit + '</div>' +
      itRows(12, 18) +
      '<div class="note">IT — допуск по ISO 286-1 / ГОСТ 25346. Для 14h14: 14,000 / 13,570 мм. ' +
      'Буквы: a…h — вал с зазором, js — симметрично, k…n — переходные; A…H, JS, K…N — то же для отверстий. ' +
      'Значения отклонений — табличные, по ISO 286.</div>' +
      '<div class="warn">Посадки с натягом (p…z и P…Z) в этом разделе не считаются: ' +
      'их подбирают по справочнику.</div>';
  },
  mount(){
    const q = $('tol_q');
    if(!q) return;
    const unitSeg = $('tol_unit');
    if(unitSeg) unitSeg.addEventListener('seg', () => {
      TOL_UNIT = segVal('tol_unit') || 'mm';
      paint();
    });
    q.addEventListener('input', tolCalc);
    q.addEventListener('change', tolCalc);
    $$('[data-tol]').forEach(b => b.addEventListener('click', () => {
      q.value = b.dataset.tol;
      tolCalc();
      window.scrollTo({top: 0, behavior: 'smooth'});
    }));
    tolCalc();
  }
};
