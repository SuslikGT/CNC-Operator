/* Резьба и отверстия */
SCREENS.thread = {
  title: 'Резьба и отверстия',
  render(){
    const names = {metric:'Метрич.', fine:'Мелкая', unc:'UNC', unf:'UNF', pipe:'Трубная G', trap:'Трап. Tr'};
    let h = '<div class="cap">Тип резьбы</div>' +
      seg('th_type', Object.keys(names).map(k => [k, names[k]]), 'metric', 'wrap');
    h += '<div class="card">' +
      '<label class="f"><span>Резьба из таблицы</span><div class="iw"><select class="inp" id="th_sel">' +
      D.metric.map(r => '<option value="' + r[1] + '|' + r[2] + '">' + r[0] + '</option>').join('') +
      '</select></div></label>' +
      '<div class="row2">' + fld('th_d', 'Наружный диаметр d', '6', 'мм') + fld('th_p', 'Шаг P', '1', 'мм') + '</div>' +
      seg('th_mode', [['vc','Постоянная Vc (G96)'],['n','Постоянные обороты (G97)']], 'vc') +
      '<div class="row2">' +
        '<div id="th_scell">' + thField('vc') + '</div>' +
        '<div>' + fld('th_cut', 'Съём за проход', '0,1', 'мм') + '</div>' +
      '</div>' +
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
    const fillSel = (useCurrent) => {
      const t = segVal('th_type') || 'metric';
      const list = {metric:D.metric, fine:D.metricFine, unc:D.unc, unf:D.unf, pipe:D.pipe, trap:D.trap}[t] || D.metric;
      const s = $('th_sel');
      if(!s) return;
      s.innerHTML = list.map(r => '<option value="' + r[1] + '|' + r[2] + '">' + r[0] + '</option>').join('');
      if(useCurrent){
        const curD = num('th_d', 0), curP = num('th_p', 0);
        const m = list.find(r => Math.abs(r[1] - curD) < 0.01 && Math.abs(r[2] - curP) < 0.01);
        if(m) s.value = m[1] + '|' + m[2];
        thCalc();
        return;
      }
      const def = list.find(r => Math.abs(r[1] - 6) < 0.01) || list[0];
      s.value = def[1] + '|' + def[2];
      thApply();
    };
    $('th_type').addEventListener('seg', () => fillSel(false));
    $('th_sel').addEventListener('change', thApply);
    $('th_mode').addEventListener('seg', thModeSwitch);
    ['th_d','th_p','th_vc','th_n','th_cut'].forEach(id => {
      const el = $(id); if(el){ el.addEventListener('input', thCalc); el.addEventListener('change', thCalc); }
    });
    $('th_save').addEventListener('click', () => saveCalc('Резьба', thRows));
    fillSel(true);
  }
};
/* Поле скорости: в G96 — Vc, в G97 — обороты */
function thField(mode){
  return mode === 'n'
    ? fld('th_n', 'Обороты n', '530', 'об/мин', {ph:'постоянные обороты'})
    : fld('th_vc', 'Vc метчика/резца', '10', 'м/мин', {ph:'постоянная скорость'});
}
function thModeSwitch(){
  const mode = segVal('th_mode') || 'vc';
  const cell = $('th_scell');
  if(!cell) return;
  const d = num('th_d', 0);
  const oldVc = num('th_vc', 0);
  const oldN = num('th_n', 0);
  if(mode === 'n'){
    const n = oldN > 0 ? oldN : (d > 0 && oldVc > 0 ? Math.round(1000 * oldVc / (Math.PI * d)) : 530);
    cell.innerHTML = thField('n');
    $('th_n').value = String(n);
    $('th_n').addEventListener('input', thCalc);
    $('th_n').addEventListener('change', thCalc);
  } else {
    const vc = oldVc > 0 ? oldVc : (d > 0 && oldN > 0 ? Math.PI * d * oldN / 1000 : 10);
    cell.innerHTML = thField('vc');
    $('th_vc').value = String(Math.round(vc * 10) / 10).replace('.', ',');
    $('th_vc').addEventListener('input', thCalc);
    $('th_vc').addEventListener('change', thCalc);
  }
  thCalc();
}
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
  const type = segVal('th_type') || 'metric';
  const prof = type === 'trap' ? {k2: 0.5, k1: 1.0, k3: 1.0, H: 1.866, h: 0.5, name: '30°'}
    : type === 'pipe' ? {k2: 0.6403, k1: 1.2806, k3: 1.2806, H: 0.960, h: 0.6403, name: '55°'}
    : {k2: 0.6495, k1: 1.0825, k3: 1.2269, H: 0.866, h: 0.6134, name: '60°'};
  const d2 = d - prof.k2 * P;
  const d1 = d - prof.k1 * P;
  const d3 = d - prof.k3 * P;
  const H = prof.H * P;
  const h3 = prof.h * P;
  const drill = d - P;
  const mode = segVal('th_mode') || 'vc';
  let vc, n;
  if(mode === 'n'){
    n = Math.round(num('th_n', 0));
    vc = Math.PI * d * n / 1000;
  } else {
    vc = num('th_vc', 10);
    n = Math.round(1000 * vc / (Math.PI * d));
  }
  const sv = $('th_svg');
  if(sv) animScheme('thread', sv, [d, P], renderThread);
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
    rbox('Скорость резания Vc', fmt(vc, 1), 'м/мин') +
    rbox('Подача (шаг)', fmt(P, 3), 'мм/об') +
    rbox('Проходов резца', fmt0(passes), 'шт') +
    '<div class="note" style="grid-column:1/-1">Профиль ' + prof.name + ': H = ' + fmt(H, 3) +
    ' мм · ширина впадины ' + fmt(P / 2, 3) + ' мм · ' + fmt(tpi, 2) + ' ниток на дюйм. ' +
    'Первый проход резца — 60 % от заданного съёма, последний — 0,05 мм.</div>' +
    '<div class="note" style="grid-column:1/-1">Резьба режется только на постоянных оборотах: ' +
    '<b>G97 S' + fmt0(n) + '</b> (G96 для G33 не используется).</div>';
  thRows = [['Резьба', '⌀' + fmt(d, 2) + ' × ' + fmt(P, 2)], ['d2', fmt(d2, 3) + ' мм'],
    ['Сверло', fmt(drill, 2) + ' мм'], ['Обороты', fmt0(n) + ' об/мин']];
}
