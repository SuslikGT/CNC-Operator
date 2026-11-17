/* Резьба и отверстия */
SCREENS.thread = {
  title: 'Резьба и отверстия',
  render(){
    const lists = {
      metric: D.metric, fine: D.metricFine, unc: D.unc, unf: D.unf, pipe: D.pipe, trap: D.trap
    };
    const names = {metric:'Метрическая', fine:'Метрическая мелкая', unc:'Дюймовая UNC',
      unf:'Дюймовая UNF', pipe:'Трубная G', trap:'Трапецеидальная Tr'};
    let h = seg('th_type', Object.keys(names).map(k => [k, names[k]]), 'metric');
    h += '<div class="card">' +
      '<label class="f"><span>Резьба из таблицы</span><div class="iw"><select class="inp" id="th_sel">' +
      D.metric.map(r => '<option value="' + r[1] + '|' + r[2] + '">' + r[0] + '</option>').join('') +
      '</select></div></label>' +
      '<div class="row2">' + fld('th_d', 'Наружный диаметр d', '6', 'мм') + fld('th_p', 'Шаг P', '1', 'мм') + '</div>' +
      '<div class="row2">' + fld('th_vc', 'Vc метчика/резца', '10', 'м/мин') + fld('th_cut', 'Съём за проход', '0,1', 'мм') + '</div>' +
      '<div class="scheme" id="th_svg"></div>' +
      '<div class="res" id="th_out"></div>' +
      '<button class="btn ghost sm" type="button" id="th_save" style="margin-top:8px">Сохранить расчёт</button>' +
      '</div>' +
      '<div class="h">Отверстия под резьбу</div>' +
      '<div class="card" style="padding:0"><div class="tw"><table>' +
      '<tr><th>Резьба</th><th class="n">Шаг</th><th class="n">Сверло</th><th class="n">d2</th></tr>' +
      D.metric.filter(r => r[1] >= 3 && r[1] <= 30).map(r => {
        const d = r[1], p = r[2];
        return '<tr><td>' + r[0] + '</td><td class="n">' + fmt(p, 2) + '</td><td class="n">' +
          fmt(d - p, 2) + '</td><td class="n">' + fmt(d - 0.6495 * p, 3) + '</td></tr>';
      }).join('') + '</table></div></div>' +
      '<div class="note">Сверло под резьбу = d − P (для метрической с шагом до 2 мм). ' +
      'Для точных отверстий берите d − 1,0825P и контролируйте калибром.</div>' +
      '<div class="h">Sinumerik: резьба</div>' +
      '<pre class="code">N10 G97 S400 M3\n' +
      'N20 G0 X' + '8 Z5\n' +
      'N30 G33 Z-20 K1,0          <b>; шаг 1 мм, 1-й проход</b>\n' +
      'N40 G0 X12\n' +
      'N50 G0 Z5\n' +
      'N60 G0 X7,7                <b>; следующий проход глубже</b>\n' +
      'N70 G33 Z-20 K1,0\n' +
      '<i>; … ещё проходы до X</i>5,2\n' +
      'N90 G0 X100 Z100\n' +
      '<i>; или циклом:</i>\n' +
      'CYCLE99(0,-20,1,0.92,...)  <b>; параметры — по Help стойки</b></pre>' +
      '<div class="note"><b>K</b> — шаг резьбы в мм (для дюймовой — нитки на дюйм, задаётся иначе). ' +
      'Перед G33 шпиндель должен вращаться, а обороты — быть постоянными (G97) или с ограничением LIMS.</div>';
    return h;
  },
  mount(){
    const fillSel = () => {
      const t = segVal('th_type') || 'metric';
      const list = {metric:D.metric, fine:D.metricFine, unc:D.unc, unf:D.unf, pipe:D.pipe, trap:D.trap}[t] || D.metric;
      const s = $('th_sel');
      s.innerHTML = list.map(r => '<option value="' + r[1] + '|' + r[2] + '">' + r[0] + '</option>').join('');
      const def = list.find(r => Math.abs(r[1] - 6) < 0.01) || list[0];
      s.value = def[1] + '|' + def[2];
      thApply();
    };
    $('th_type').addEventListener('seg', fillSel);
    $('th_sel').addEventListener('change', thApply);
    ['th_d','th_p','th_vc','th_cut'].forEach(id => {
      const el = $(id); if(el){ el.addEventListener('input', thCalc); el.addEventListener('change', thCalc); }
    });
    $('th_save').addEventListener('click', () => saveCalc('Резьба', thRows));
    fillSel();
  }
};
function thApply(){
  const v = String(val('th_sel')).split('|');
  if(v.length < 2) return;
  $('th_d').value = String(v[0]).replace('.', ',');
  $('th_p').value = String(v[1]).replace('.', ',');
  thCalc();
}
let thRows = [];
function thCalc(){
  const out = $('th_out'); if(!out) return;
  const d = num('th_d', 0), P = num('th_p', 0);
  if(!(d > 0) || !(P > 0)){ out.innerHTML = '<div class="note" style="grid-column:1/-1">Введите диаметр и шаг</div>'; return; }
  const d2 = d - 0.6495 * P;
  const d1 = d - 1.0825 * P;
  const d3 = d - 1.2269 * P;
  const H = 0.866 * P;
  const h3 = 0.6134 * P;
  const drill = d - P;
  const vc = num('th_vc', 10);
  const sv = $('th_svg');
  if(sv) animScheme('thread', sv, [d, P], renderThread);
  const n = Math.round(1000 * vc / (Math.PI * d));
  const depth = h3;
  const cut = num('th_cut', 0.1);
  const passes = cut > 0 ? Math.ceil(depth / cut) : NaN;
  const tpi = 25.4 / P;
  out.innerHTML =
    rbox('Средний диаметр d2', fmt(d2, 3), 'мм', 'lead') +
    rbox('Внутренний d1 (гайка)', fmt(d1, 3), 'мм') +
    rbox('По дну болта d3', fmt(d3, 3), 'мм') +
    rbox('Высота профиля h', fmt(depth, 3), 'мм') +
    rbox('Сверло под резьбу', fmt(drill, 2), 'мм') +
    rbox('Обороты метчика', fmt0(n), 'об/мин') +
    rbox('Подача (шаг)', fmt(P, 3), 'мм/об') +
    rbox('Проходов резца', fmt0(passes), 'шт') +
    '<div class="note" style="grid-column:1/-1">Высота исходного треугольника H = ' + fmt(H, 3) +
    ' мм · ширина впадины ' + fmt(P / 2, 3) + ' мм · ' + fmt(tpi, 2) + ' ниток на дюйм. ' +
    'Первый проход резца — 60 % от заданного съёма, последний — 0,05 мм.</div>';
  thRows = [['Резьба', '⌀' + fmt(d, 2) + ' × ' + fmt(P, 2)], ['d2', fmt(d2, 3) + ' мм'],
    ['Сверло', fmt(drill, 2) + ' мм'], ['Обороты', fmt0(n) + ' об/мин']];
}

/* схема профиля резьбы */
function svgThread(d, P){
  if(!(d > 0) || !(P > 0)) return emptyScheme('Введите диаметр и шаг');
  const cy = 70, pitch = 56, depth = 40;
  const crestY = cy - depth / 2, rootY = cy + depth / 2;
  const x0 = 16, steps = 3;
  let p = 'M' + x0 + ',' + crestY;
  for(let i = 0; i < steps; i++){
    const x = x0 + i * pitch;
    p += ' L' + (x + pitch * .22) + ',' + crestY;
    p += ' L' + (x + pitch * .40) + ',' + rootY;
    p += ' L' + (x + pitch * .60) + ',' + rootY;
    p += ' L' + (x + pitch * .78) + ',' + crestY;
    p += ' L' + (x + pitch) + ',' + crestY;
  }
  const xEnd = x0 + steps * pitch;
  const bodyBottom = rootY + 32;
  const d2 = d - 0.6495 * P, d1 = d - 1.0825 * P;
  const yMid = cy - depth * 0.1;
  const lx = xEnd + 42;
  return '<svg viewBox="0 0 320 158">' +
    '<path class="part" d="' + p + ' L' + xEnd + ',' + bodyBottom + ' L' + x0 + ',' + bodyBottom + ' Z"/>' +
    '<path class="axis" d="M8,' + cy + 'H314"/>' +
    '<path class="dim" d="M' + x0 + ',' + crestY + 'H' + (xEnd + 30) + '"/>' +
    '<path class="dim" d="M' + x0 + ',' + yMid + 'H' + (xEnd + 30) + '"/>' +
    '<path class="dim" d="M' + x0 + ',' + rootY + 'H' + (xEnd + 30) + '"/>' +
    '<text x="' + lx + '" y="' + (crestY + 4) + '">d ' + fmt(d, 2) + '</text>' +
    '<text x="' + lx + '" y="' + (yMid + 4) + '">d2 ' + fmt(d2, 2) + '</text>' +
    '<text x="' + lx + '" y="' + (rootY + 4) + '">d1 ' + fmt(d1, 2) + '</text>' +
    dimH(x0, x0 + pitch, bodyBottom + 12, 'P ' + fmt(P, 2)) +
    '</svg>';
}
