/* Калькуляторы: режимы, время, геометрия, шероховатость, единицы */
function seg(id, items, cur, cls){
  let h = '<div class="seg' + (cls ? ' ' + cls : '') + '" id="' + id + '" data-v="' + cur + '">';
  items.forEach(it => {
    const v = it[0], t = it[1];
    h += '<button type="button" data-v="' + v + '"' + (v === cur ? ' class="on"' : '') + '>' + t + '</button>';
  });
  return h + '</div>';
}
function segVal(id){ const el = $(id); return el ? el.dataset.v : ''; }
document.addEventListener('click', e => {
  const b = e.target.closest('.seg button');
  if(!b) return;
  const p = b.parentElement;
  Array.prototype.forEach.call(p.children, x => x.classList.remove('on'));
  b.classList.add('on');
  p.dataset.v = b.dataset.v;
  p.dispatchEvent(new Event('seg'));
});
function bind(ids, fn){
  ids.forEach(id => {
    const el = $(id);
    if(!el) return;
    el.addEventListener('input', fn);
    el.addEventListener('change', fn);
  });
}
/* Поле скорости: в G96 задаётся Vc, в G97 — обороты */
function speedField(mode){
  return mode === 'n'
    ? fld('sp_n', 'Обороты n', '1200', 'об/мин', {ph:'постоянные обороты'})
    : fld('sp_vc', 'Vc', '200', 'м/мин', {ph:'постоянная скорость'});
}

/* ================= РЕЖИМЫ РЕЗАНИЯ ================= */
let spRows = [];
SCREENS.speed = {
  title: 'Режимы резания',
  render(){
    if((typeof curMachine === 'function') && curMachine().grind) return grindModesPage();
    const matOpts = D.materials.map(m => [m.id, m.name]);
    return '<div class="card">' +
      selFld('sp_mat', 'Материал заготовки', matOpts, 'st20') +
      '<div class="cap">Операция</div>' +
      seg('sp_op', [['turn','Точение'],['mill','Фрезеров.'],['drill','Сверление']], 'turn') +
      '<div class="cap">Материал инструмента</div>' +
      seg('sp_tool', [['carb','Твердосплав'],['hss','HSS']], 'carb') +
      '<div class="mini" style="margin:-2px 2px 12px">Твердосплав — сменные пластины (CNMG, WNMG и др.), ' +
        'HSS — быстрорежущая сталь (Р6М5, Р18): скорость резания в 3–4 раза ниже.</div>' +
      '<div class="cap">Режим на станке</div>' +
      seg('sp_mode', [['vc','Постоянная Vc (G96)'],['n','Постоянные обороты (G97)']], 'vc') +
      '<div class="row2">' +
        '<div id="sp_dcell">' + fld('sp_d', 'Диаметр D', '40', 'мм') + '</div>' +
        '<div id="sp_scell">' + speedField('vc') + '</div>' +
      '</div>' +
      '<button class="btn ghost sm" type="button" id="sp_auto">Подставить из справочника</button>' +
      '<div class="row2" style="margin-top:10px">' +
        fld('sp_f', 'Подача', '0,25', 'мм/об', {ph:'точение/сверло'}) +
        fld('sp_ap', 'Глубина ap', '2', 'мм') +
      '</div>' +
      '<div class="row2" id="sp_millrow" style="display:none">' +
        fld('sp_fz', 'Подача на зуб fz', '0,06', 'мм/зуб') +
        fld('sp_z', 'Число зубьев z', '4', 'шт') +
        fld('sp_ae', 'Ширина ae', '8', 'мм') +
      '</div>' +
      fld('sp_p', 'Мощность привода шпинделя', String((machLimits().power || 11)), 'кВт') +
      '<div class="mini" style="margin:-4px 2px 8px">Лимиты станка: до ' +
        fmt0(machLimits().nMax || 4000) + ' об/мин, привод ' +
        fmt0(machLimits().power || 11) + ' кВт, патрон ' + (machLimits().chuck || '—') +
        ', пруток до Ø' + fmt0(machLimits().bar || 0) + ' мм.</div>' +
      '<div class="res" id="sp_out"></div>' +
      '<button class="btn ghost sm" type="button" id="sp_save" style="margin-top:8px">Сохранить расчёт</button>' +
      '</div>' +
      '<div class="h">Справочник Vc, м/мин</div>' +
      '<div class="card" style="padding:0;overflow:hidden">' +
      '<div class="tw"><table><tr><th>Материал</th><th class="n">Черн.</th><th class="n">Чист.</th>' +
      '<th class="n">Фреза</th><th class="n">Сверло</th></tr>' +
      D.materials.map(m => '<tr><td>' + m.name + '</td><td class="n">' + m.vc.rough + '</td><td class="n">' +
        m.vc.finish + '</td><td class="n">' + m.vc.mill + '</td><td class="n">' + m.vc.drillCarb + '</td></tr>').join('') +
      '</table></div></div>' +
      '<div class="note">Значения для твердосплава с покрытием. HSS — примерно в 4 раза ниже. ' +
      'Прерывистое резание уменьшайте на 20 %, без СОЖ — на 15–20 %, слабая жёсткость системы — ещё 20 %.</div>';
  },
  mount(){
    if((typeof curMachine === 'function') && curMachine().grind){ grindModesMount(); return; }
    const opEl = $('sp_op');
    opEl.addEventListener('seg', () => {
      $('sp_millrow').style.display = segVal('sp_op') === 'mill' ? 'grid' : 'none';
      spAuto();
    });
    $('sp_tool').addEventListener('seg', () => { spAuto(); });
    $('sp_mode').addEventListener('seg', spModeSwitch);
    ['sp_d','sp_vc','sp_f','sp_ap','sp_fz','sp_z','sp_ae','sp_p'].forEach(id => {
      const el = $(id); if(el){ el.addEventListener('input', spCalc); el.addEventListener('change', spCalc); }
    });
    const matEl = $('sp_mat');
    if(matEl){
      matEl.addEventListener('change', spAuto);
      matEl.addEventListener('input', spAuto);
    }
    $('sp_auto').addEventListener('click', spAuto);
    $('sp_save').addEventListener('click', () => saveCalc('Режимы резания', spRows));
    if(!$('sp_vc').value) $('sp_vc').value = '200';
    if($('sp_p') && !$('sp_p').value) $('sp_p').value = String(machLimits().power || 11);
    spCalc();
  }
};
function spModeSwitch(){
  const mode = segVal('sp_mode') || 'vc';
  const cell = $('sp_scell');
  if(!cell) return;
  const Dm = num('sp_d', 0);
  const oldVc = num('sp_vc', 0);
  const oldN = num('sp_n', 0);
  if(mode === 'n'){
    const n = oldN > 0 ? oldN : (Dm > 0 && oldVc > 0 ? Math.round(1000 * oldVc / (Math.PI * Dm)) : 1200);
    cell.innerHTML = speedField('n');
    $('sp_n').value = String(n);
    bind(['sp_n'], spCalc);
  } else {
    const vc = oldVc > 0 ? oldVc : (Dm > 0 && oldN > 0 ? Math.PI * Dm * oldN / 1000 : 200);
    cell.innerHTML = speedField('vc');
    $('sp_vc').value = String(Math.round(vc * 10) / 10).replace('.', ',');
    bind(['sp_vc'], spCalc);
  }
  spCalc();
}

function spBase(){
  const m = D.materials.find(x => x.id === val('sp_mat')) || D.materials[0];
  const op = segVal('sp_op') || 'turn';
  const tool = segVal('sp_tool') || 'carb';
  const mode = segVal('sp_mode') || 'vc';
  const Dm = num('sp_d', 0);
  let vc = 0, n = 0;
  if(mode === 'n'){
    n = Math.round(num('sp_n', 0));
    vc = (Dm > 0 && n > 0) ? Math.PI * Dm * n / 1000 : 0;
  } else {
    vc = num('sp_vc', 0);
    n = (Dm > 0 && vc > 0) ? Math.round(1000 * vc / (Math.PI * Dm)) : 0;
  }
  return {m:m, op:op, tool:tool, mode:mode, vc:vc, n:n};
}
function spAuto(){
  const b = spBase();
  let base;
  if(b.op === 'turn') base = b.tool === 'hss' ? Math.round(b.m.vc.rough / 4) : b.m.vc.rough;
  else if(b.op === 'mill') base = b.tool === 'hss' ? b.m.vc.millHSS : b.m.vc.mill;
  else if(b.op === 'drill') base = b.tool === 'hss' ? b.m.vc.drill : b.m.vc.drillCarb;
  else base = b.m.vc.rough;
  const Dm = num('sp_d', 0);
  if(b.mode === 'n'){
    const n = Dm > 0 ? Math.round(1000 * base / (Math.PI * Dm)) : 0;
    if($('sp_n')) $('sp_n').value = String(n);
  } else {
    $('sp_vc').value = String(base).replace('.', ',');
  }
  spCalc();
}
function spCalc(){
  const b = spBase();
  const Dm = num('sp_d', 0);
  const n = b.n;
  const vcSet = b.vc;
  const out = $('sp_out');
  if(!out) return;
  if(!(Dm > 0) || !(n > 0) || !(vcSet > 0)){ out.innerHTML = '<div class="note" style="grid-column:1/-1">Введите диаметр и ' + (b.mode === 'n' ? 'обороты' : 'Vc') + '</div>'; return; }
  const vcFact = Math.PI * Dm * n / 1000;
  const kc = b.m.kc;
  let vf = 0, P = 0, detail = '';
  const ap = num('sp_ap', 0);
  if(b.op === 'turn'){
    const f = num('sp_f', 0);
    vf = f * n;
    P = ap * f * vcFact * kc / 60000;
    detail = 'Подача ' + fmt(f, 2) + ' мм/об · глубина ' + fmt(ap, 1) + ' мм';
  } else if(b.op === 'mill'){
    const fz = num('sp_fz', 0), z = num('sp_z', 1), ae = num('sp_ae', 0);
    vf = fz * z * n;
    P = ae * ap * vf * kc / 60000000;
    detail = 'fz ' + fmt(fz, 3) + ' × z' + fmt0(z) + ' · ae ' + fmt(ae, 1) + ' · ap ' + fmt(ap, 1);
  } else {
    const f = num('sp_f', 0);
    vf = f * n;
    P = (Math.PI * Dm * Dm / 4) * f * n * kc / 60000000;
    detail = 'Подача ' + fmt(f, 2) + ' мм/об · сверло ⌀' + fmt(Dm, 1);
  }
  const pm = num('sp_p', 0);
  const lim = (typeof machLimits === 'function') ? machLimits() : {};
  const nMax = lim.nMax || 4000;
  const nChuck = lim.nChuck || nMax;
  const load = pm > 0 ? P / pm * 100 : NaN;
  const M = n > 0 ? 9550 * P / n : NaN;
  const loadCls = isFinite(load) ? (load > 85 ? 'bad' : (load > 70 ? '' : 'good')) : '';
  const pct = isFinite(load) ? Math.max(0, Math.min(100, load)) : 0;
  const col = load > 85 ? '#ff6b73' : load > 70 ? '#ffc75f' : '#4ad991';
  out.innerHTML =
    rbox('Обороты n', fmt0(n), 'об/мин', 'lead') +
    rbox('Фактическая Vc', fmt(vcFact, 1), 'м/мин') +
    rbox('Минутная подача', fmt(vf, 0), 'мм/мин') +
    rbox('Мощность резания', fmt(P, 2), 'кВт') +
    rbox('Загрузка шпинделя', isFinite(load) ? fmt(load, 0) : '—', '%', loadCls) +
    rbox('Крутящий момент', fmt(M, 1), 'Н·м') +
    rbox('Удельная сила kc', fmt0(kc), 'Н/мм²') +
    '<div class="meter-wrap" style="grid-column:1/-1">' +
      '<div class="meter"><i style="width:' + pct.toFixed(1) + '%;background:' + col + '"></i>' +
      '<span class="mark" style="left:70%"></span><span class="mark" style="left:85%"></span></div>' +
      '<div class="meter-lbl"><span>нагрузка шпинделя</span><span>' +
        (isFinite(load) ? fmt(load, 0) + ' % из 100' : 'введите мощность привода') + '</span></div>' +
    '</div>' +
    '<div class="note" style="grid-column:1/-1">' + detail + '. ' +
    (isFinite(load) && load > 85 ? '<b style="color:#e86b70">Перегрузка: снизьте ap или Vc.</b>' : 'Проверьте по мощности станка.') + '</div>' +
    '<div class="note" style="grid-column:1/-1">' +
      (b.mode === 'n'
        ? '<b>G97 S' + fmt0(n) + '</b> — постоянные обороты; Vc на ⌀' + fmt(Dm, 1) + ' = ' + fmt(vcFact, 1) + ' м/мин.'
        : '<b>G96 S' + fmt0(vcSet) + ' LIMS=' + Math.min(nMax, Math.ceil(n / 100) * 100) +
          '</b> — постоянная Vc; обороты на ⌀' + fmt(Dm, 1) + ' = ' + fmt0(n) + ' об/мин.') +
    '</div>' +
    (n > nMax ? '<div class="warn" style="grid-column:1/-1">' + fmt0(n) +
      ' об/мин выше паспортного лимита станка ' + fmt0(nMax) + ' — снизьте Vc или задайте LIMS=' + fmt0(nMax) + '.</div>' : '') +
    (n > nChuck && n <= nMax ? '<div class="warn" style="grid-column:1/-1">' + fmt0(n) +
      ' об/мин выше рабочего предела патрона ' + (lim.chuck || '') + ' (' + fmt0(nChuck) +
      ' об/мин). Проверьте допустимые обороты кулачков.</div>' : '') +
    (b.op === 'turn' ? '<div class="note" style="grid-column:1/-1">Мощность = ap × f × Vc × kc / 60000. ' +
      'Сейчас: kc = ' + fmt0(kc) + ' Н/мм², Vc = ' + fmt(vcFact, 1) + ' м/мин. Сталь обрабатывают на большей ' +
      'скорости, чем нержавейку и чугун, поэтому при равном съёме она грузит шпиндель сильнее — ' +
      'хотя удельная сила резания у нержавейки выше.</div>' : '');
  spRows = [
    ['Материал', b.m.name], ['Режим', b.mode === 'n' ? 'G97, постоянные обороты' : 'G96, постоянная Vc'],
    ['Операция', b.op === 'turn' ? 'точение' : b.op === 'mill' ? 'фрезерование' : 'сверление'],
    ['Диаметр', fmt(Dm, 1) + ' мм'], ['Vc', fmt(vcFact, 1) + ' м/мин'],
    ['Обороты', fmt0(n) + ' об/мин'], ['Подача', fmt(vf, 0) + ' мм/мин'],
    ['Мощность', fmt(P, 2) + ' кВт'], ['Загрузка', isFinite(load) ? fmt(load, 0) + ' %' : '—']
  ];
}

/* ================= ВРЕМЯ И СТОИМОСТЬ ================= */
let tmRows = [];
SCREENS.time = {
  title: 'Время и стоимость',
  render(){
    return '<div class="card">' +
      '<div class="row2">' + fld('tm_l', 'Длина обработки', '100', 'мм') + fld('tm_y', 'Врезание + перебег', '2', 'мм') + '</div>' +
      '<div class="row2">' + fld('tm_n', 'Обороты n', '1200', 'об/мин') + fld('tm_f', 'Подача f', '0,25', 'мм/об') + '</div>' +
      '<div class="row2">' + fld('tm_i', 'Число проходов', '3', 'шт') + fld('tm_set', 'Установка/снятие', '1,5', 'мин') + '</div>' +
      '</div>' +
      '<div class="h">Стоимость</div>' +
      '<div class="card">' +
      '<div class="row3">' + fld('tm_rate', 'Ставка', '900', '₽/ч') + fld('tm_life', 'Стойкость', '15', 'мин') + fld('tm_plate', 'Пластина', '450', '₽') + '</div>' +
      '<div class="res" id="tm_out"></div>' +
      '<button class="btn ghost sm" type="button" id="tm_save" style="margin-top:8px">Сохранить расчёт</button>' +
      '</div>' +
      '<div class="note">Машинное время = (L + врезание) × число проходов / (n × f). ' +
      'Стоимость инструмента = пластина × (машинное время / стойкость).</div>';
  },
  mount(){
    ['tm_l','tm_y','tm_n','tm_f','tm_i','tm_set','tm_rate','tm_life','tm_plate'].forEach(id => {
      const el = $(id); if(el){ el.addEventListener('input', tmCalc); el.addEventListener('change', tmCalc); }
    });
    $('tm_save').addEventListener('click', () => saveCalc('Время и стоимость', tmRows));
    tmCalc();
  }
};
function tmCalc(){
  const L = num('tm_l', 0), y = num('tm_y', 0), n = num('tm_n', 0), f = num('tm_f', 0);
  const i = num('tm_i', 1), set = num('tm_set', 0);
  const out = $('tm_out'); if(!out) return;
  if(!(n > 0) || !(f > 0)){ out.innerHTML = '<div class="note" style="grid-column:1/-1">Введите обороты и подачу</div>'; return; }
  const tMach = (L + y) * i / (n * f);
  const tPiece = tMach + set;
  const rate = num('tm_rate', 0), life = num('tm_life', 0), plate = num('tm_plate', 0);
  const costOp = tPiece / 60 * rate;
  const costTool = life > 0 ? tMach / life * plate : 0;
  const perHour = tPiece > 0 ? 60 / tPiece : NaN;
  out.innerHTML =
    rbox('Машинное время', fmt(tMach, 2), 'мин', 'lead') +
    rbox('Штучное время', fmt(tPiece, 2), 'мин') +
    rbox('Деталей в час', fmt(perHour, 1), 'шт') +
    rbox('Обработка', fmt(costOp, 0), '₽') +
    rbox('Инструмент', fmt(costTool, 2), '₽') +
    rbox('Итого на деталь', fmt(costOp + costTool, 0), '₽');
  tmRows = [['Машинное время', fmt(tMach, 2) + ' мин'], ['Штучное', fmt(tPiece, 2) + ' мин'],
    ['Деталей в час', fmt(perHour, 1)], ['Стоимость', fmt(costOp + costTool, 0) + ' ₽']];
}

/* ================= ГЕОМЕТРИЯ И ВЕС ================= */
SCREENS.geo = {
  title: 'Геометрия и вес',
  render(){
    const mats = D.speedConst.map(x => [x[0], x[1].replace(',', '.')]);
    return '<div class="h">Фаска</div><div class="card">' +
      '<div class="row2">' + fld('ge_d', 'Диаметр детали', '40', 'мм') + fld('ge_c', 'Катет фаски', '2', 'мм') + '</div>' +
      '<div class="row2">' + fld('ge_a', 'Угол к оси', '45', '°') + '</div>' +
      '<div class="scheme" id="ge_svg1"></div>' +
      '<div class="res" id="ge_out1"></div></div>' +
      '<div class="h">Конус</div><div class="card">' +
      '<div class="row3">' + fld('gc_d1', 'D1 (больш.)', '50', 'мм') + fld('gc_d2', 'D2 (меньш.)', '30', 'мм') + fld('gc_l', 'Длина', '40', 'мм') + '</div>' +
      '<div class="scheme" id="ge_svg2"></div>' +
      '<div class="res" id="ge_out2"></div></div>' +
      '<div class="h">Галтель / радиус</div><div class="card">' +
      '<div class="row2">' + fld('gg_r', 'Радиус', '5', 'мм') + fld('gg_a', 'Угол дуги', '90', '°') + '</div>' +
      '<div class="scheme" id="ge_svg3"></div>' +
      '<div class="res" id="ge_out3"></div></div>' +
      '<div class="h">Вес заготовки</div><div class="card">' +
      selFld('gw_shape', 'Форма', [['round','Круг'],['square','Квадрат'],['hex','Шестигранник'],['tube','Труба']], 'round') +
      '<div class="row2">' + fld('gw_a', 'Размер (Ø / сторона / S)', '40', 'мм') + fld('gw_l', 'Длина', '100', 'мм') + '</div>' +
      '<div class="row2" id="gw_tuberow" style="display:none">' + fld('gw_b', 'Внутренний Ø', '25', 'мм') + '<div></div></div>' +
      selFld('gw_mat', 'Материал (плотность, г/см³)', mats, '7.85') +
      '<div class="row2">' + fld('gw_price', 'Цена металла', '85', '₽/кг') + '<div></div></div>' +
      '<div class="res" id="ge_out4"></div></div>' +
      '<div class="note">Вес = объём × плотность. Для шестигранника размер S — под ключ. ' +
      'Припуск на обработку добавляйте к размерам заготовки.</div>';
  },
  mount(){
    ['ge_d','ge_c','ge_a','gc_d1','gc_d2','gc_l','gg_r','gg_a','gw_a','gw_l','gw_b','gw_price'].forEach(id => {
      const el = $(id); if(el){ el.addEventListener('input', geoCalc); el.addEventListener('change', geoCalc); }
    });
    ['gw_shape','gw_mat'].forEach(id => { const el = $(id); if(el) el.addEventListener('change', geoCalc); });
    $('gw_shape').addEventListener('change', () => {
      $('gw_tuberow').style.display = val('gw_shape') === 'tube' ? 'grid' : 'none';
    });
    geoCalc();
  }
};
function geoCalc(){
  /* фаска */
  const Dm = num('ge_d', 0), c = num('ge_c', 0), a = num('ge_a', 45);
  const s1 = $('ge_svg1');
  if(s1) animScheme('chamfer', s1, [Dm, c, a], renderChamfer);
  const o1 = $('ge_out1');
  if(o1){
    if(Dm > 0 && c > 0 && a > 0){
      const rad = a * Math.PI / 180;
      const dX = 2 * c * Math.tan(rad);
      const x2 = Dm - dX;
      const len = c / Math.cos(rad);
      o1.innerHTML = rbox('Конец фаски X', fmt(x2, 2), 'мм', 'lead') +
        rbox('Конец по Z', fmt(-c, 2), 'мм') + rbox('Уменьшение Ø', fmt(dX, 2), 'мм') +
        rbox('Длина резания', fmt(len, 2), 'мм') +
        '<div class="note" style="grid-column:1/-1">Кадр: G1 X' + fmt(x2, 2) + ' Z' + fmt(-c, 2) + ' F0,1</div>';
    } else o1.innerHTML = '';
  }
  /* конус */
  const d1 = num('gc_d1', 0), d2 = num('gc_d2', 0), L = num('gc_l', 0);
  const s2 = $('ge_svg2');
  if(s2) animScheme('cone', s2, [d1, d2, L], renderCone);
  const o2 = $('ge_out2');
  if(o2){
    if(d1 > 0 && L > 0){
      const half = Math.atan((d1 - d2) / (2 * L)) * 180 / Math.PI;
      const len = Math.sqrt(L * L + Math.pow((d1 - d2) / 2, 2));
      const konus = (d1 - d2) / L;
      o2.innerHTML = rbox('Половина угла', fmt(half, 2), '°', 'lead') +
        rbox('Угол при вершине', fmt(half * 2, 2), '°') +
        rbox('Длина образующей', fmt(len, 2), 'мм') +
        rbox('Конусность', '1:' + fmt(1 / Math.abs(konus), 2), '');
    } else o2.innerHTML = '';
  }
  /* галтель */
  const r = num('gg_r', 0), ang = num('gg_a', 90);
  const s3 = $('ge_svg3');
  if(s3) animScheme('fillet', s3, [r], renderFillet);
  const o3 = $('ge_out3');
  if(o3){
    if(r > 0){
      const arc = 2 * Math.PI * r * ang / 360;
      const chord = 2 * r * Math.sin(ang * Math.PI / 360);
      o3.innerHTML = rbox('Длина дуги', fmt(arc, 2), 'мм', 'lead') +
        rbox('Хорда', fmt(chord, 2), 'мм') +
        rbox('Смещение центра X', fmt(2 * r, 2), 'мм') +
        rbox('Смещение центра Z', fmt(r, 2), 'мм');
    } else o3.innerHTML = '';
  }
  /* вес */
  const shape = val('gw_shape'), a2 = num('gw_a', 0), L2 = num('gw_l', 0), b = num('gw_b', 0);
  const rho = parseFloat(val('gw_mat')) || 7.85;
  const price = num('gw_price', 0);
  const o4 = $('ge_out4');
  if(o4){
    if(a2 > 0 && L2 > 0){
      if(shape === 'tube' && !(b < a2)){
        o4.innerHTML = '<div class="warn">Внутренний диаметр должен быть меньше наружного: ' +
          fmt(b, 1) + ' мм не может быть при наружном ' + fmt(a2, 1) + ' мм.</div>';
        return;
      }
      let V = 0;
      if(shape === 'round') V = Math.PI / 4 * a2 * a2 * L2;
      else if(shape === 'square') V = a2 * a2 * L2;
      else if(shape === 'hex') V = 0.866 * a2 * a2 * L2;
      else V = Math.PI / 4 * (a2 * a2 - b * b) * L2;
      const mass = V * rho / 1e6;
      o4.innerHTML = rbox('Объём', fmt(V / 1000, 1), 'см³', 'lead') +
        rbox('Масса', fmt(mass, 2), 'кг') +
        rbox('Стоимость', fmt(mass * price, 0), '₽') +
        '<div class="note" style="grid-column:1/-1">Плотность ' + fmt(rho, 2) + ' г/см³. ' +
        'Масса погонного метра: ' + fmt(V / L2 * rho / 1000, 3) + ' кг/м.</div>';
    } else o4.innerHTML = '';
  }
}

/* ================= ШЕРОХОВАТОСТЬ ================= */
SCREENS.rough = {
  title: 'Шероховатость и допуски',
  render(){
    return '<div class="card">' +
      fld('ra_r', 'Радиус при вершине r', '0,8', 'мм') +
      '<div class="row2">' + fld('ra_f', 'Подача f', '0,2', 'мм/об') + fld('ra_target', 'Нужная Ra', '1,6', 'мкм') + '</div>' +
      '<div class="res" id="ra_out"></div></div>' +
      '<div class="h">Рекомендуемая подача под Ra</div>' +
      '<div class="tw"><table><tr><th>Ra, мкм</th><th class="n">r 0,4</th><th class="n">r 0,8</th>' +
      '<th class="n">r 1,2</th><th class="n">r 2,0</th></tr>' +
      [0.4,0.8,1.6,3.2,6.3].map(ra => {
        const c = rr => fmt(Math.sqrt(32 * rr * ra / 1000), 2);
        return '<tr><td>' + fmt(ra, 1) + '</td><td class="n">' + c(0.4) + '</td><td class="n">' + c(0.8) +
          '</td><td class="n">' + c(1.2) + '</td><td class="n">' + c(2.0) + '</td></tr>';
      }).join('') + '</table></div>' +
      '<div class="note">Формула: Ra ≈ f² / (32·r) в мм, затем ×1000 в мкм. ' +
      'Rz ≈ 4·Ra. Значения теоретические: фактическая шероховатость зависит от материала, СОЖ, вибраций и износа пластины.</div>' +
      '<div class="h">Допуски IT, мкм</div>' +
      '<div class="tw"><table><tr><th>Ø, мм</th><th class="n">IT5</th><th class="n">IT6</th><th class="n">IT7</th>' +
      '<th class="n">IT8</th><th class="n">IT9</th><th class="n">IT10</th><th class="n">IT11</th></tr>' +
      [['до 3',4,6,10,14,25,40,60],['3–6',5,8,12,18,30,48,75],['6–10',6,9,15,22,36,58,90],
       ['10–18',8,11,18,27,43,70,110],['18–30',9,13,21,33,52,84,130],['30–50',11,16,25,39,62,100,160],
       ['50–80',13,19,30,46,74,120,190],['80–120',15,22,35,54,87,140,220],
       ['120–180',18,25,40,63,100,160,250],['180–250',20,29,46,72,115,185,290],
       ['250–315',23,32,52,81,130,210,320],['315–400',25,36,57,89,140,230,360],
       ['400–500',27,40,63,97,155,250,400]].map(r => '<tr><td>' + r[0] + ' мм</td>' +
        r.slice(1).map(x => '<td class="n">' + x + '</td>').join('') + '</tr>').join('') +
      '</table></div>' +
      '<div class="note">Для Ø30 H7: допуск 21 мкм → 30,000…30,021. Для вала h6: 0…−13 мкм → 29,987…30,000.</div>';
  },
  mount(){
    ['ra_r','ra_f','ra_target'].forEach(id => {
      const el = $(id); if(el){ el.addEventListener('input', raCalc); el.addEventListener('change', raCalc); }
    });
    raCalc();
  }
};
function raCalc(){
  const r = num('ra_r', 0), f = num('ra_f', 0), t = num('ra_target', 0);
  const out = $('ra_out'); if(!out) return;
  if(!(r > 0) || !(f > 0)){ out.innerHTML = '<div class="note" style="grid-column:1/-1">Введите радиус и подачу</div>'; return; }
  const ra = f * f / (32 * r) * 1000;
  const rz = ra * 4;
  const fNeed = t > 0 ? Math.sqrt(32 * r * t / 1000) : NaN;
  let cls = '—';
  if(ra <= 0.4) cls = 'Ra 0,4 (10)'; else if(ra <= 0.8) cls = 'Ra 0,8 (9)';
  else if(ra <= 1.6) cls = 'Ra 1,6 (8)'; else if(ra <= 3.2) cls = 'Ra 3,2 (7)';
  else if(ra <= 6.3) cls = 'Ra 6,3 (6)'; else cls = 'Ra 12,5 и грубее';
  out.innerHTML = rbox('Ra расчётная', fmt(ra, 2), 'мкм', 'lead') +
    rbox('Rz ≈', fmt(rz, 1), 'мкм') +
    rbox('Подача под Ra ' + fmt(t, 1), fmt(fNeed, 3), 'мм/об') +
    rbox('Класс чистоты', cls, '');
}

/* ================= ЕДИНИЦЫ ================= */
SCREENS.units = {
  title: 'Перевод единиц',
  render(){
    return '<div class="card"><div class="h" style="margin-top:0">Длина</div>' +
      '<div class="row2">' + fld('un_mm', 'мм', '25,4', 'мм') + fld('un_in', 'дюймы', '1', 'in') + '</div>' +
      '<div class="note" id="un_frac"></div></div>' +
      '<div class="card"><div class="h" style="margin-top:0">Скорость резания</div>' +
      '<div class="row2">' + fld('un_vc', 'Vc', '180', 'м/мин') + fld('un_sfm', 'SFM', '590', 'фт/мин') + '</div></div>' +
      '<div class="card"><div class="h" style="margin-top:0">Подача</div>' +
      '<div class="row2">' + fld('un_mmrev', 'мм/об', '0,25', 'мм/об') + fld('un_ipr', 'дюйм/об', '0,01', 'in/ob') + '</div>' +
      '<div class="row2">' + fld('un_mmmin', 'мм/мин', '300', 'мм/мин') + fld('un_ipm', 'дюйм/мин', '11,8', 'in/min') + '</div></div>' +
      '<div class="card"><div class="h" style="margin-top:0">Температура и масса</div>' +
      '<div class="row2">' + fld('un_c', '°C', '20', '°C') + fld('un_f', '°F', '68', '°F') + '</div>' +
      '<div class="row2">' + fld('un_kg', 'кг', '1', 'кг') + fld('un_lb', 'фунты', '2,205', 'lb') + '</div></div>' +
      '<div class="card"><div class="h" style="margin-top:0">Твёрдость (справочно)</div>' +
      '<div class="row2">' + fld('un_hb', 'HB', '200', 'HB') + fld('un_hrc', 'HRC', '—', 'HRC') + '</div>' +
      '<div class="note">Перевод приблизительный, для сталей. Точное соотношение — по ГОСТ 8.064 / таблицам производителя.</div></div>';
  },
  mount(){
    const link = (a, b, k, dec) => {
      const ea = $(a), eb = $(b);
      if(!ea || !eb) return;
      ea.addEventListener('input', () => {
        const v = num(a); if(isFinite(v)) eb.value = String((v * k).toFixed(dec)).replace('.', ',');
        if(a === 'un_mm') updFrac();
      });
      eb.addEventListener('input', () => {
        const v = num(b); if(isFinite(v)) ea.value = String((v / k).toFixed(dec)).replace('.', ',');
      });
    };
    link('un_mm', 'un_in', 1 / 25.4, 4);
    link('un_vc', 'un_sfm', 3.28084, 1);
    link('un_mmrev', 'un_ipr', 1 / 25.4, 4);
    link('un_mmmin', 'un_ipm', 1 / 25.4, 2);
    link('un_kg', 'un_lb', 2.20462, 3);
    const ec = $('un_c'), ef = $('un_f');
    ec.addEventListener('input', () => { const v = num('un_c'); if(isFinite(v)) ef.value = String((v * 9 / 5 + 32).toFixed(1)).replace('.', ','); });
    ef.addEventListener('input', () => { const v = num('un_f'); if(isFinite(v)) ec.value = String(((v - 32) * 5 / 9).toFixed(1)).replace('.', ','); });
    const eh = $('un_hb'), er = $('un_hrc');
    eh.addEventListener('input', () => {
      const hb = num('un_hb');
      let best = null, diff = 1e9;
      D.hardness.forEach(p => { const d = Math.abs(p[0] - hb); if(d < diff){ diff = d; best = p; } });
      er.value = best && best[1] !== '—' ? String(best[1]) : '—';
    });
    er.addEventListener('input', () => {
      const hrc = num('un_hrc');
      let best = null, diff = 1e9;
      D.hardness.forEach(p => { if(p[1] === '—') return; const d = Math.abs(p[1] - hrc); if(d < diff){ diff = d; best = p; } });
      if(best) eh.value = String(best[0]);
    });
    const updFrac = () => {
      const mm = num('un_mm');
      const box = $('un_frac');
      if(!isFinite(mm) || !box) return;
      const inch = mm / 25.4;
      const denoms = [64, 32, 16, 8, 4];
      let txt = '';
      for(let i = 0; i < denoms.length; i++){
        const d = denoms[i];
        const n = Math.round(inch * d);
        const err = Math.abs(n / d - inch);
        if(err < 0.0008){
          const g = (a, b) => b ? g(b, a % b) : a;
          const k = g(n, d);
          const num = n / k, den = d / k;
          txt = '≈ ' + (den === 1 ? String(num) : num + '/' + den) + ' дюйма';
          break;
        }
      }
      box.innerHTML = 'Дюймовая дробь: <b>' + (txt || '—') + '</b> · точное значение ' + fmt(inch, 4) + '″';
    };
    updFrac();
  }
};

/* ================= СХЕМЫ ================= */
function dimV(x, y1, y2, label){
  const mid = (y1 + y2) / 2;
  return '<path class="dim" d="M' + x + ',' + y1 + 'V' + y2 + '"/>' +
    '<path class="dim" d="M' + (x - 4) + ',' + (y1 + 7) + 'L' + x + ',' + y1 + 'L' + (x + 4) + ',' + (y1 + 7) + '"/>' +
    '<path class="dim" d="M' + (x - 4) + ',' + (y2 - 7) + 'L' + x + ',' + y2 + 'L' + (x + 4) + ',' + (y2 - 7) + '"/>' +
    (label ? '<text x="' + (x - 6) + '" y="' + mid + '" text-anchor="middle" transform="rotate(-90 ' + (x - 6) + ' ' + mid + ')">' + label + '</text>' : '');
}
function dimH(x1, x2, y, label){
  return '<path class="dim" d="M' + x1 + ',' + y + 'H' + x2 + '"/>' +
    '<path class="dim" d="M' + (x1 + 7) + ',' + (y - 4) + 'L' + x1 + ',' + y + 'L' + (x1 + 7) + ',' + (y + 4) + '"/>' +
    '<path class="dim" d="M' + (x2 - 7) + ',' + (y - 4) + 'L' + x2 + ',' + y + 'L' + (x2 - 7) + ',' + (y + 4) + '"/>' +
    (label ? '<text x="' + ((x1 + x2) / 2) + '" y="' + (y - 7) + '" text-anchor="middle">' + label + '</text>' : '');
}
function emptyScheme(txt){
  return '<div class="mini" style="text-align:center;padding:16px 8px">' + txt + '</div>';
}
