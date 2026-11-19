/* Sinumerik, корректоры, стойкость, чек-лист, история, шпаргалки */

/* ================= SINUMERIK ================= */
SCREENS.siemens = {
  title: 'Стойка',
  render(){
    if(cncInfo().id === 'fanuc') return fanucSystemPage();
    let h = '<div class="card">' +
      '<div class="kv"><span class="k">Стойка</span><span class="v">SINUMERIK 828D (T) · Operate, 10,4"</span></div>' +
      '<div class="kv"><span class="k">Станок</span><span class="v">Headman T65M II/750, оси X Z C</span></div>' +
      '<div class="kv"><span class="k">Диалект</span><span class="v">Siemens (базовый) · ISO — опционально</span></div>' +
      '<div class="kv"><span class="k">Токарный режим</span><span class="v">G18 (плоскость ZX), DIAMON</span></div>' +
      '<div class="note">828D — панельная стойка (PPU) с сенсорным экраном и SINUMERIK Operate. ' +
      'Всё программирование — от JOG/MDA/AUTO до циклов — доступно с панели без внешнего пульта. ' +
      'Если на станке включён диалект ISO, часть кадров (G54, циклы) записывается иначе: проверьте ' +
      'машинные данные диалекта перед запуском чужой программы.</div></div>' +
      '<div class="h">Типовой шаблон программы</div><pre class="code">' +
      D.sampleProgram.join('\n').replace(/;(.+)/g, '<i>;$1</i>') + '</pre>' +
      '<div class="note"><b>D1</b> — номер корректора инструмента (у каждого резца свой). ' +
      'DIAMON — программирование по диаметру. LIMS — ограничение оборотов при G96.</div>' +
      '<div class="h">Токарные циклы</div>';
    D.cycles.forEach(c => {
    h += '<div class="card"><div style="font-size:15px;font-weight:700;color:#f2a33c">' + c.c + ' — ' + c.n + '</div>' +
      '<div class="note" style="margin-top:4px">' + c.p + '</div>' +
      '<pre class="code">' + c.e + '</pre>' +
      (c.how && c.how.length ? '<div class="mini" style="margin:8px 0 4px">Как писать:</div>' +
        '<ul class="list">' + c.how.map(s => '<li>' + s + '</li>').join('') + '</ul>' : '') +
      '<div class="mini" style="margin-top:6px">' + c.t + '</div></div>';
    });
    h += '<div class="warn">Параметры циклов зависят от версии ПО стойки. Перед первым запуском откройте подсказку: ' +
      'клавиша <b>«i»/Help</b> на стойке — она показывает актуальный список параметров и их порядок.</div>';
    h += '<div class="h">828D: что где на панели</div><div class="card"><ul class="list">' +
      '<li><b>JOG → «Измерить инструмент»</b> — привязка резца к заготовке вручную или щупом, запись в D-корректор.</li>' +
      '<li><b>Параметры → Инструмент</b> — таблица инструментов: геометрия, износ, радиус, тип.</li>' +
      '<li><b>Наладка → «Серия ввода-вывода»</b> — архив станка на USB. Первое, что нужно сделать после покупки.</li>' +
      '<li><b>Диагностика → Журнал сообщений</b> — история ошибок, помогает понять, что было до останова.</li>' +
      '<li><b>Счётчики</b> — время работы, число деталей, наработка инструмента (данные станка).</li>' +
      '<li><b>ShopTurn</b> — режим программирования циклами по подсказкам, без ручного G-кода.</li>' +
      '<li><b>Блокировка доступа</b> — уровни паролей: оператор не должен менять машинные данные; ' +
      'для наладки нужен ключ/пароль наладчика.</li>' +
      '</ul></div>';
    h += '<div class="h">G-коды</div><div class="tw"><table><tr><th>Код</th><th>Назначение</th></tr>' +
      D.gcodes.map(g => '<tr><td><b>' + g[0] + '</b></td><td>' + g[1] + '</td></tr>').join('') + '</table></div>';
    h += '<div class="h">M-коды</div><div class="tw"><table><tr><th>Код</th><th>Назначение</th></tr>' +
      D.mcodes.map(g => '<tr><td><b>' + g[0] + '</b></td><td>' + g[1] + '</td></tr>').join('') + '</table></div>';
    h += '<div class="h">Полезные приёмы</div><div class="card"><ul class="list">' +
      '<li><b>G96 S180 LIMS=2500</b> — постоянная скорость резания с ограничением оборотов (обязательно для патрона).</li>' +
      '<li><b>G95 F0,25</b> — подача в мм/об; для точения почти всегда удобнее, чем мм/мин.</li>' +
      '<li><b>DIAMON</b> — все X в диаметрах. Если сомневаетесь, проверьте первый кадр в «симуляции».</li>' +
      '<li><b>G54…G57</b> — нулевые точки. Смещение можно править в таблице или через TRANS/ATRANS.</li>' +
      '<li><b>SPOS=0</b> — ориентация шпинделя для снятия патрона и контроля.</li>' +
      '<li><b>M0</b> после чернового прохода — удобно для промежуточного промера, если нет датчика.</li>' +
      '<li>Проверка программы: <b>Simulation / «Симуляция»</b> до запуска, затем первый проход на <b>S50 %</b> и <b>Rapid 25 %</b>.</li>' +
      '</ul></div>' +
      '<div class="note">Точный синтаксис вашей версии ПО — в руководстве по программированию стойки.</div>';
    return h;
  }
};

/* ================= КОРРЕКТОРЫ ================= */
SCREENS.corr = {
  title: 'Корректоры',
  render(){
    if(cncInfo().id === 'fanuc') return grindCorrPage();
    return '<div class="card"><div class="kick">порядок действий</div>' +
        '<div class="mini" style="margin-top:4px;line-height:1.6">' +
          '1. Проточили деталь на нужный размер.<br>' +
          '2. Измерили её микрометром.<br>' +
          '3. Вписали номинал и что получилось.<br>' +
          '4. Взяли поправку из результата.<br>' +
          '5. Ввели её в корректор инструмента (Параметры → Инструмент → D… → X).' +
        '</div></div>' +
      '<div class="card"><div class="h" style="margin-top:0">Промер диаметра</div>' +
      '<div class="row2">' + fld('cr_nom', 'Номинал Ø, мм', '30', 'мм') + fld('cr_meas', 'Измерено Ø, мм', '30,05', 'мм') + '</div>' +
      '<div class="row2">' + fld('cr_cur', 'Корректор X сейчас (радиус)', '0', 'мм') + '<div></div></div>' +
      '<div class="res" id="cr_out1"></div></div>' +
      '<div class="card"><div class="h" style="margin-top:0">Промер длины</div>' +
      '<div class="row2">' + fld('cr_znom', 'Номинал Z, мм', '20', 'мм') + fld('cr_zmeas', 'Измерено Z, мм', '20,03', 'мм') + '</div>' +
      '<div class="res" id="cr_out2"></div></div>' +
      '<div class="card"><div class="h" style="margin-top:0">Привязка нуля G54 — X (ось)</div>' +
      '<div class="row2">' + fld('cr_xm', 'Машинная X при касании', '122,4', 'мм') +
      fld('cr_xd', 'Измеренный Ø в точке касания', '40', 'мм') + '</div>' +
      '<div class="res" id="cr_outx"></div></div>' +
      '<div class="card"><div class="h" style="margin-top:0">Привязка нуля G54 — Z (торец)</div>' +
      '<div class="row2">' + fld('cr_zm', 'Машинная Z при касании торца', '412,5', 'мм') +
      fld('cr_zb', 'Координата торца в детали', '0', 'мм') + '</div>' +
      '<div class="res" id="cr_outz"></div></div>' +
      '<div class="h">Как это работает</div><div class="card"><ul class="list">' +
      '<li>В Sinumerik корректор по <b>X задаётся радиусом</b> (расстояние от оси), поэтому отклонение диаметра делим на 2.</li>' +
      '<li>Деталь <b>больше</b> номинала — корректор X <b>уменьшаем</b>. Меньше — увеличиваем.</li>' +
      '<li>По <b>Z</b>: деталь длиннее — корректор Z уменьшаем (или правим G54 по Z).</li>' +
      '<li>Правило трёх деталей: если отклонение одинаково на трёх деталях подряд — это корректор, а не износ.</li>' +
      '<li>После замены пластины корректор не меняют, но перепроверяют первую деталь.</li>' +
      '<li>Тепловой рост: первые 20–30 минут станок «уходит» на 0,01–0,03 мм — не гонитесь за сотками сразу.</li>' +
      '</ul></div>' +
      '<div class="warn">Корректор вводите <b>только на остановленном шпинделе</b> и после отвода инструмента. ' +
      'Изменение корректора действует со следующего кадра с этим D-номером.</div>';
  },
  mount(){
    if(cncInfo().id === 'fanuc'){ grindCorrMount(); return; }
    ['cr_nom','cr_meas','cr_cur','cr_znom','cr_zmeas','cr_xm','cr_xd','cr_zm','cr_zb'].forEach(id => {
      const el = $(id); if(el){ el.addEventListener('input', crCalc); el.addEventListener('change', crCalc); }
    });
    crCalc();
  }
};
function crCalc(){
  const nom = num('cr_nom', 0), meas = num('cr_meas', 0), cur = num('cr_cur', 0);
  const o1 = $('cr_out1');
  if(o1){
    if(nom > 0 && isFinite(meas)){
      const diff = meas - nom;          // + деталь больше
      const dX = -diff / 2;             // изменение корректора X (радиус)
      const newX = cur + dX;
      o1.innerHTML = rbox('Отклонение по диаметру', (diff > 0 ? '+' : '') + fmt(diff, 3), 'мм', diff > 0 ? 'bad' : 'good') +
        rbox('Ввести в корректор X (радиус)', (dX > 0 ? '+' : '') + fmt(dX, 3), 'мм', 'lead') +
        rbox('Станет в корректоре X', fmt(newX, 3), 'мм') +
        rbox('Это же по диаметру', (dX * 2 > 0 ? '+' : '') + fmt(dX * 2, 3), 'мм') +
        '<div class="note" style="grid-column:1/-1">' + (Math.abs(diff) < 0.005 ? 'В пределах 5 мкм — корректор не трогаем.' :
          (diff > 0 ? 'Деталь больше номинала: в корректоре X <b>вычесть</b> ' + fmt(Math.abs(dX), 3) + ' мм.' :
            'Деталь меньше номинала: в корректоре X <b>прибавить</b> ' + fmt(Math.abs(dX), 3) + ' мм.')) +
        ' Вводится в Параметры → Инструмент → нужный D → X.</div>';
    } else o1.innerHTML = '';
  }
  const zn = num('cr_znom', 0), zm = num('cr_zmeas', 0);
  const o2 = $('cr_out2');
  if(o2){
    if(isFinite(zn) && isFinite(zm)){
      const dz = zn - zm;
      o2.innerHTML = rbox('Отклонение по Z', (zm - zn > 0 ? '+' : '') + fmt(zm - zn, 3), 'мм', 'lead') +
        rbox('Ввести в корректор Z', (dz > 0 ? '+' : '') + fmt(dz, 3), 'мм') +
        '<div class="note" style="grid-column:1/-1">Поправка = номинал − измерено: ' +
        (Math.abs(dz) < 0.005 ? 'менять не нужно.' :
          (dz > 0 ? 'деталь <b>короче</b>, в корректор Z прибавить ' + fmt(Math.abs(dz), 3) + ' мм.'
                  : 'деталь <b>длиннее</b>, из корректора Z вычесть ' + fmt(Math.abs(dz), 3) + ' мм.')) +
        ' Тот же D-корректор, столбец Z.</div>';
    } else o2.innerHTML = '';
  }
  const xm = num('cr_xm', 0), xd = num('cr_xd', 0);
  const ox = $('cr_outx');
  if(ox){
    if(xm !== 0 && xd > 0){
      const g54x = xm - xd;
      ox.innerHTML = rbox('Ноль G54 по X', fmt(g54x, 3), 'мм', 'lead') +
        rbox('Проверка: деталь Ø', fmt(xd, 1), 'мм') +
        '<div class="note" style="grid-column:1/-1">Ноль по X — ось шпинделя. В Sinumerik X задаётся в диаметрах, ' +
        'поэтому <b>G54 X = машинная X − измеренный Ø</b>. Значения берите с включённым корректором того резца, ' +
        'которым касались. При радиальной индикации X вычтите радиус (Ø/2).</div>';
    } else ox.innerHTML = '';
  }
  const mzj = num('cr_zm', 0), zbase = num('cr_zb', 0);
  const oz = $('cr_outz');
  if(oz){
    if(mzj !== 0){
      const g54z = mzj - zbase;
      oz.innerHTML = rbox('Ноль G54 по Z', fmt(g54z, 3), 'мм', 'lead') +
        rbox('Торец в детали', fmt(zbase, 2), 'мм') +
        '<div class="note" style="grid-column:1/-1">Касание торца вершиной резца с активным корректором D: ' +
        '<b>G54 Z = машинная Z − координата торца</b> (обычно 0, если торец — база детали). ' +
        'Для уступа с известной глубиной подставьте её координату вместо нуля.</div>';
    } else oz.innerHTML = '';
  }
}

/* ================= СТОЙКОСТЬ ================= */
SCREENS.wear = {
  title: 'Стойкость инструмента',
  render(){
    return '<div class="card">' +
      fld('wr_name', 'Инструмент / пластина', '', 'например: T1 CNMG 120408', {ph:'название'}) +
      '<div class="row2">' + fld('wr_limit', 'Ресурс', '15', 'мин/шт') +
      '<label class="f"><span>Единица</span><div class="iw"><select class="inp" id="wr_unit">' +
      '<option value="мин">минут</option><option value="дет">деталей</option></select></div></label></div>' +
      '<button class="btn pri" type="button" id="wr_add">Добавить инструмент</button></div>' +
      '<div class="h">Учёт</div><div id="wr_list"></div>';
  },
  mount(){
    $('wr_add').addEventListener('click', () => {
      const name = val('wr_name').trim();
      const limit = num('wr_limit', 0);
      if(!name || !(limit > 0)){ toast('Укажите название и ресурс'); return; }
      const list = lsGet('wear', []);
      list.unshift({id: Date.now(), name: name, used: 0, limit: limit, unit: val('wr_unit')});
      lsSet('wear', list);
      $('wr_name').value = '';
      drawWear(); toast('Инструмент добавлен');
    });
    drawWear();
  }
};
function drawWear(){
  const box = $('wr_list'); if(!box) return;
  const list = lsGet('wear', []);
  if(!list.length){ box.innerHTML = '<div class="empty">Пока пусто. Добавьте инструмент выше.</div>'; return; }
  box.innerHTML = list.map(w => {
    const pct = Math.min(100, w.used / w.limit * 100);
    const col = pct >= 100 ? '#e86b70' : pct >= 80 ? '#e0a93c' : '#48c78e';
    return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">' +
      '<div><div style="font-weight:600">' + w.name + '</div>' +
      '<div class="mini">' + fmt(w.used, w.unit === 'мин' ? 1 : 0) + ' / ' + fmt(w.limit, 0) + ' ' + w.unit +
      (pct >= 100 ? ' · <b style="color:#e86b70">заменить</b>' : '') + '</div></div>' +
      '<button class="del" data-wdel="' + w.id + '">×</button></div>' +
      '<div class="bar"><i style="width:' + pct.toFixed(1) + '%;background:' + col + '"></i></div>' +
      '<div class="row3" style="margin-top:10px">' +
      '<button class="btn sm" type="button" data-wadd="' + w.id + '" data-d="1">' + (w.unit === 'мин' ? '+1 мин' : '+1 дет') + '</button>' +
      '<button class="btn sm" type="button" data-wadd="' + w.id + '" data-d="5">+5</button>' +
      '<button class="btn sm" type="button" data-wreset="' + w.id + '">Сброс</button>' +
      '</div></div>';
  }).join('');
  $$('[data-wadd]').forEach(b => b.addEventListener('click', () => {
    const list = lsGet('wear', []);
    const w = list.find(x => String(x.id) === b.dataset.wadd);
    if(w){ w.used += parseFloat(b.dataset.d); lsSet('wear', list); drawWear(); }
  }));
  $$('[data-wreset]').forEach(b => b.addEventListener('click', () => {
    const list = lsGet('wear', []);
    const w = list.find(x => String(x.id) === b.dataset.wreset);
    if(w){ w.used = 0; lsSet('wear', list); drawWear(); }
  }));
  $$('[data-wdel]').forEach(b => b.addEventListener('click', () => {
    const list = lsGet('wear', []).filter(x => String(x.id) !== b.dataset.wdel);
    lsSet('wear', list); drawWear();
  }));
}

/* ================= ЧЕК-ЛИСТ ================= */
const CHECK_ITEMS = [
  'Программа проверена в симуляции стойки',
  'Нулевые точки G54 совпадают с базой детали',
  'Все инструменты привязаны, корректоры D введены',
  'Заготовка зажата, кулачки не выходят за Ø обработки',
  'Пластины затянуты, кромки без сколов',
  'СОЖ в баке, концентрация 6–8 %, сопло на зону резания',
  'Давление воздуха и гидравлики в норме',
  'Ограничение оборотов LIMS выставлено',
  'Первый запуск: подача 50 %, быстрые 25 %',
  'Первая деталь измерена, корректор поправлен',
  'Стружка убрана, дверь закрыта, защита на месте',
  'Кнопка аварийного останова проверена'
];
SCREENS.check = {
  title: 'Чек-лист',
  render(){
    const st = lsGet('chk', {});
    let h = '<div class="card">';
    CHECK_ITEMS.forEach((t, i) => {
      const on = !!st[i];
      h += '<label class="chk"><input type="checkbox" data-chk="' + i + '"' + (on ? ' checked' : '') + '>' +
        '<span class="' + (on ? 'on' : '') + '">' + t + '</span></label>';
    });
    h += '</div><button class="btn ghost" type="button" id="chk_reset">Сбросить все отметки</button>' +
      '<div class="note">Отметки сохраняются в телефоне. Перед новой наладкой — сброс.</div>';
    return h;
  },
  mount(){
    $$('[data-chk]').forEach(el => el.addEventListener('change', () => {
      const st = lsGet('chk', {});
      st[el.dataset.chk] = el.checked;
      lsSet('chk', st);
      el.nextElementSibling.classList.toggle('on', el.checked);
    }));
    $('chk_reset').addEventListener('click', () => { lsSet('chk', {}); paint(); toast('Отметки сброшены'); });
  }
};

/* ================= ИСТОРИЯ ================= */
SCREENS.hist = {
  title: 'История',
  render(){
    const h = lsGet('hist', []);
    if(!h.length) return '<div class="empty">Сохранённых расчётов пока нет.<br>В разделах «Режимы», «Время» и «Резьба» есть кнопка «Сохранить расчёт».</div>' +
      '<button class="btn ghost" type="button" data-hclear="1" style="display:none">Очистить</button>';
    let out = '<div class="mini" style="margin-bottom:8px">Всего записей: ' + h.length + '</div>';
    h.forEach((e, i) => {
      const d = new Date(e.t);
      out += '<div class="card"><div style="display:flex;justify-content:space-between;gap:8px">' +
        '<div><div style="font-weight:600">' + e.title + '</div>' +
        '<div class="mini">' + d.toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit'}) + '</div></div>' +
        '<button class="del" data-hdel="' + i + '">×</button></div>' +
        e.rows.map(r => '<div class="kv"><span class="k">' + r[0] + '</span><span class="v">' + r[1] + '</span></div>').join('') +
        '</div>';
    });
    out += '<button class="btn ghost" type="button" data-hclear="1">Очистить историю</button>';
    return out;
  },
  mount(){
    $$('[data-hdel]').forEach(b => b.addEventListener('click', () => {
      const h = lsGet('hist', []);
      h.splice(parseInt(b.dataset.hdel, 10), 1);
      lsSet('hist', h); paint();
    }));
    $$('[data-hclear]').forEach(b => b.addEventListener('click', () => {
      if(!window.confirm('Очистить историю расчётов?')) return;
      clearHist(); paint(); toast('История очищена');
    }));
  }
};

/* ================= ШПАРГАЛКИ ================= */
SCREENS.refs = {
  title: 'Шпаргалки',
  render(){
    let h = '<div class="h">Крепёж и отверстия под резьбу</div>' +
      '<div class="tw"><table><tr><th>Резьба</th><th class="n">S под ключ</th><th class="n">Сверло</th><th class="n">Отв. в металле</th></tr>' +
      D.fasteners.map(r => '<tr><td>' + r[0] + '</td><td class="n">' + r[1] + '</td><td class="n">' + r[3] +
        '</td><td class="n">' + fmt(r[4], 1) + '</td></tr>').join('') + '</table></div>' +
      '<div class="note">S — размер ключа/головки. Отверстие в металле — сквозное с зазором, под шпильку.</div>' +
      '<div class="h">Конусы Морзе</div>' +
      '<div class="tw"><table><tr><th>Конус</th><th class="n">D, мм</th><th class="n">d, мм</th><th class="n">Длина, мм</th></tr>' +
      D.morse.map(r => '<tr><td>' + r[0] + '</td><td class="n">' + fmt(r[1], 3) + '</td><td class="n">' +
        fmt(r[2], 1) + '</td><td class="n">' + fmt(r[3], 1) + '</td></tr>').join('') + '</table></div>' +
      '<div class="h">Плотность материалов</div><div class="tw"><table><tr><th>Материал</th><th class="n">г/см³</th></tr>' +
      D.speedConst.map(r => '<tr><td>' + r[0] + '</td><td class="n">' + r[1] + '</td></tr>').join('') + '</table></div>' +
      '<div class="h">Твёрдость</div><div class="tw"><table><tr><th>HB</th><th class="n">HRC</th><th>Что это</th></tr>' +
      [['≤200','—','нормализация / отжиг'],['240–280','22–26','улучшение, валы'],['300–340','28–32','закалка + отпуск'],
       ['380–420','36–40','высокая прочность'],['480–540','46–51','инструментальная'],['600–700','55–60','высокая твёрдость']].map(r =>
        '<tr><td>' + r[0] + '</td><td class="n">' + r[1] + '</td><td>' + r[2] + '</td></tr>').join('') + '</table></div>' +
      '<div class="h">СОЖ</div><div class="card"><ul class="list">' +
      '<li>Эмульсия: концентрация <b>5–8 %</b> для стали, <b>7–10 %</b> для нержавейки и цветмета.</li>' +
      '<li>Слабый раствор — коррозия и запах; сильный — раздражение кожи и пена.</li>' +
      '<li>Алюминий — безводные/специальные СОЖ, иначе пятна.</li>' +
      '<li>Чугун часто обрабатывают «насухо» с обдувом.</li>' +
      '</ul></div>' +
      '<div class="h">Быстрые прикидки</div><div class="card"><ul class="list">' +
      '<li>Обороты: <b>n ≈ 318 × Vc / D</b>.</li>' +
      '<li>Мощность точения: <b>P ≈ ap × f × Vc × kc / 60000</b> кВт.</li>' +
      '<li>Шероховатость: <b>Ra ≈ f² / (32·r)</b> мм.</li>' +
      '<li>Сверло под резьбу: <b>d − P</b>.</li>' +
      '<li>Вес круга: <b>0,00617 × D² × L</b> кг (D и L в мм, сталь).</li>' +
      '</ul></div>';
    return h;
  }
};
