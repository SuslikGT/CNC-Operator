/* Станок: выбор машины и страницы станков */

function curMachine(){
  const id = lsGet('machine.sel', 't65m');
  return D.machines.find(m => m.id === id) || D.machines[0];
}
function setMachine(id){ lsSet('machine.sel', id); }
function machKV(r){ return '<div class="kv"><span class="k">' + r[0] + '</span><span class="v">' + r[1] + '</span></div>'; }
function machGeneric(m){
  let h = '<div class="hero" style="margin-bottom:14px">' +
    '<div class="kick">' + m.kind + ' · ' + m.cnc + '</div>' +
    '<h1>' + m.name + '</h1>' +
    '<p>' + (m.year ? m.year + ' · ' : '') + m.cnc + '</p></div>';
  if(m.notes) h += '<div class="note">' + m.notes + '</div>';
  h += '<div class="h">Характеристики</div><div class="card">' + (m.specs || []).map(machKV).join('') + '</div>';
  if(m.similar && m.similar.length){
    h += '<div class="h">Похожие станки</div><div class="card">' + m.similar.map(machKV).join('') + '</div>';
  }
  if(m.tips && m.tips.length){
    h += '<div class="h">Подсказки</div><div class="card"><ul class="list">' +
      m.tips.map(t => '<li>' + t + '</li>').join('') + '</ul></div>';
  }
  if(m.life && m.life.length){
    h += '<div class="h">Лайфхаки</div><div class="card"><ul class="list">' +
      m.life.map(t => '<li>' + t + '</li>').join('') + '</ul></div>';
  }
  h += '<div class="warn">Данные приведены по открытым источникам. Перед наладкой сверяйтесь ' +
    'с паспортом станка и руководством по эксплуатации.</div>';
  h += '<button class="btn ghost" type="button" data-go="siemens" style="margin-top:10px">Стойка ' +
    m.cnc + '</button>';
  h += '<button class="btn ghost" type="button" data-go="cmds" style="margin-top:8px">Команды стойки</button>';
  h += '<button class="btn ghost" type="button" data-go="machines" style="margin-top:8px">Сменить станок</button>';
  return h;
}

SCREENS.machines = {
  title: 'Выбор станка',
  render(){
    const cur = curMachine();
    let h = '<div class="card"><div class="mini">Активный станок: <b>' + cur.short + '</b>' +
      '<div style="margin-top:6px">Нажмите на станок, чтобы открыть его раздел.</div></div></div>';
    D.machines.forEach(m => {
      const on = m.id === cur.id;
      h += '<button class="tile" type="button" data-mach="' + m.id + '" style="width:100%;margin-bottom:10px' +
        (on ? ';border-color:#ffb454' : '') + '">' +
        '<span class="ic" style="color:#5ec8ff;background:rgba(94,200,255,.13);border-color:rgba(94,200,255,.26)">' +
        ICONS.machine + '</span>' +
        '<span><span class="cap">' + m.name + '</span>' +
        '<span class="sub">' + m.kind + ' · ' + m.cnc + (on ? ' · выбран' : '') + '</span></span></button>';
    });
    return h;
  },
  mount(){
    $$('[data-mach]').forEach(b => b.addEventListener('click', () => {
      setMachine(b.dataset.mach);
      homeNav();
      toast('Станок: ' + curMachine().short);
    }));
  }
};

/* ================= СТАНОК ================= */
SCREENS.machine = {
  title: 'Станок',
  render(){
    const m = curMachine();
    if(!m.custom) return machGeneric(m);
    return '<div class="hero" style="margin-bottom:14px">' +
      '<div class="kick">Headman · горизонтальный токарный центр</div>' +
      '<h1>T65M II/750</h1>' +
      '<p>Приводной инструмент · ось C · Siemens Sinumerik 828D</p></div>' +

      '<div class="card">' +
      '<div class="kv"><span class="k">Производитель</span><span class="v">Zhejiang Headman Machinery, КНР</span></div>' +
      '<div class="kv"><span class="k">Макс. диаметр обточки</span><span class="v">650 мм (над станиной)</span></div>' +
      '<div class="kv"><span class="k">Макс. диаметр обработки</span><span class="v">370 мм</span></div>' +
      '<div class="kv"><span class="k">Макс. длина обработки</span><span class="v">717 мм</span></div>' +
      '<div class="kv"><span class="k">Перемещения</span><span class="v">X 230 · Z 822 мм</span></div>' +
      '<div class="kv"><span class="k">Ускоренные подачи</span><span class="v">X 30 · Z 33 м/мин</span></div>' +
      '<div class="kv"><span class="k">Шпиндель</span><span class="v">мотор-шпиндель 4000 об/мин</span></div>' +
      '<div class="kv"><span class="k">Мощность</span><span class="v">22 / 26 кВт (S1 / 30 мин)</span></div>' +
      '<div class="kv"><span class="k">Конец шпинделя</span><span class="v">A2-8, отверстие 91 мм</span></div>' +
      '<div class="kv"><span class="k">Патрон</span><span class="v">10" (12" — опция)</span></div>' +
      '<div class="kv"><span class="k">Пруток</span><span class="v">74–80 мм (данные расходятся)</span></div>' +
      '<div class="kv"><span class="k">Револьвер</span><span class="v">12 позиций, BMT65</span></div>' +
      '<div class="kv"><span class="k">Приводной инструмент</span><span class="v">5000 об/мин, 5,5 кВт, до ⌀20</span></div>' +
      '<div class="kv"><span class="k">Сечение резца</span><span class="v">25×25 · расточной ⌀40</span></div>' +
      '<div class="kv"><span class="k">Задняя бабка</span><span class="v">серво, ход 771 мм, 2,5 кН</span></div>' +
      '<div class="kv"><span class="k">Пиноль</span><span class="v">⌀80, конус MT4 / MT5</span></div>' +
      '<div class="kv"><span class="k">Точность</span><span class="v">0,008 мм · повторяемость 0,003</span></div>' +
      '<div class="kv"><span class="k">ЧПУ</span><span class="v">SINUMERIK 828D, экран 10,4"</span></div>' +
      '<div class="kv"><span class="k">Оси</span><span class="v">X, Z, C (оси Y нет)</span></div>' +
      '<div class="kv"><span class="k">Масса / габариты</span><span class="v">5200 кг · 2955×2000×1783</span></div>' +
      '<div class="kv"><span class="k">Питание / СОЖ</span><span class="v">49 кВт · бак 230 л</span></div>' +
      '</div>' +
      '<div class="warn">Характеристики зависят от комплектации и года выпуска — ' +
      'уточняйте по паспорту станка. Ось Y есть только у модели <b>MY</b>.</div>' +

      '<div class="h">Проверка режима под станок</div>' +
      '<div class="card">' +
      seg('mc_mode', [['vc','Постоянная Vc (G96)'],['n','Постоянные обороты (G97)']], 'vc') +
      '<div class="row2">' +
        '<div>' + fld('mc_d', 'Диаметр обработки', '60', 'мм') + '</div>' +
        '<div id="mc_scell">' + mcField('vc') + '</div>' +
      '</div>' +
      '<div class="res" id="mc_out"></div>' +
      '<div class="note">Лимиты: шпиндель 4000 об/мин, привод 22 кВт (S1). ' +
      'Для патрона 10" рабочие обороты обычно ограничивают 3000–3500 об/мин — зависит от кулачков.</div></div>' +

      '<div class="h">Узлы и что важно на практике</div>' +
      '<div class="card"><ul class="list">' +
      '<li><b>Мотор-шпиндель</b> с жидкостным охлаждением. Холодный станок нельзя сразу гнать на 4000 — ' +
      'сначала прогрев, иначе уйдёт геометрия на первых деталях.</li>' +
      '<li><b>Ось C</b>: магнитный энкодер, тормоз и фиксатор положения. Позиционирование — SPOS, ' +
      'фрезерование на торце/цилиндре — приводным блоком в револьвере.</li>' +
      '<li><b>Револьвер BMT65</b>, 12 позиций, привод 5000 об/мин и 5,5 кВт. Максимальный приводной инструмент — ⌀20: ' +
      'фреза большего диаметра перегружает привод и оправку.</li>' +
      '<li><b>Задняя бабка серво</b>, ход 771 мм, усилие поджима 2,5 кН, встроенный вращающийся центр. ' +
      'Усилие программируемое — тонкие валы поджимайте меньше, иначе «бочка».</li>' +
      '<li><b>Патрон 10"</b> гидравлический полый. При смене кулачков проверьте балансировку и заново ' +
      'ограничьте обороты (LIMS).</li>' +
      '<li><b>Опции по документации</b>: прутковый податчик, конвейер стружки, СОЖ высокого давления до 7 МПа, ' +
      'щуп привязки инструмента и измерения детали.</li>' +
      '</ul></div>' +

      '<div class="h">Приёмы оператора</div>' +
      '<div class="card"><ul class="list">' +
      '<li><b>Прогрев 15–20 мин</b>: 25 % → 50 % → 75 % → 100 % оборотов по 4–5 мин на холостом, ' +
      'затем проход без подачи. Первую деталь мерить обязательно.</li>' +
      '<li><b>Ограничение оборотов</b> задаётся в G96: <b>G96 S180 LIMS=3000</b> — для патрона это страховка ' +
      'от разрыва при малом диаметре.</li>' +
      '<li><b>Смена инструмента</b>: револьвер поворачивается на 0,2 с, поэтому в черновых переходах ' +
      'не бойтесь частых смен — выгоднее, чем лишний проход.</li>' +
      '<li><b>Привязка инструмента</b> на 828D: JOG → «Измерить инструмент» (вручную или щупом), ' +
      'результат пишется в корректор D1. Для каждого резца — свой D.</li>' +
      '<li><b>Резервная копия</b>: Operate → Наладка → «Серия ввода-вывода» (архив на USB). ' +
      'Делайте копию после каждой удачной наладки — восстановление занимает минуты вместо дней.</li>' +
      '<li><b>Приводной инструмент</b>: перед включением убедитесь, что ось C в режиме позиционирования, ' +
      'а инструмент не касается детали. Включение привода — отдельным M-кодом станка.</li>' +
      '<li><b>Стружка</b>: при обработке вязкой нержавейки и алюминия следите за наростом на приводном блоке — ' +
      'он выводит из строя оправку.</li>' +
      '</ul></div>' +

      '<div class="h">Частые проблемы</div>' +
      '<div class="card">' +
      '<div class="kv"><span class="k">Ошибка 61102 «направление шпинделя не запрограммировано»</span>' +
      '<span class="v" style="max-width:56%;text-align:right">перед кадром с осью C задайте M3/M4 и проверьте режим C</span></div>' +
      '<div class="kv"><span class="k">Приводной инструмент «ждёт обороты шпинделя»</span>' +
      '<span class="v" style="max-width:56%;text-align:right">проверьте последовательность: останов → тормоз C → включение привода</span></div>' +
      '<div class="kv"><span class="k">Уход размера за смену</span>' +
      '<span class="v" style="max-width:56%;text-align:right">прогрев, температура СОЖ, износ пластины</span></div>' +
      '<div class="kv"><span class="k">Дребезг на чистовой</span>' +
      '<span class="v" style="max-width:56%;text-align:right">вылет резца, радиус пластины, подача</span></div>' +
      '<div class="note">Точные M-коды включения привода и тормоза оси C — ' +
      'в таблице M-команд станка.</div></div>' +

      '<div class="h">Чем отличаются соседние модели</div>' +
      '<div class="tw"><table><tr><th>Модель</th><th>Отличие</th></tr>' +
      [['T65II/750','без приводного инструмента, диаметр до 380 мм'],
       ['T65M/750','предшественник: 10", BMT, 4000 об/мин, пруток 74–80'],
       ['T65MII/500','короче станина: длина обработки 507 мм, Z 612'],
       ['T65MII/1250','длинная: 1245 мм, Z 1360 мм, масса 6500 кг'],
       ['T65MY/750','есть ось Y (±50 мм), привод 3,7/5,5 кВт, 6000 кг'],
       ['T65MSY/750','ось Y + противошпиндель 8", диаметр 370 мм']]
       .map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>').join('') + '</table></div>';
  },
  mount(){
    if(!$('mc_mode')) return;
    $('mc_mode').addEventListener('seg', mcModeSwitch);
    ['mc_d','mc_vc','mc_n'].forEach(id => {
      const el = $(id); if(el){ el.addEventListener('input', mcCalc); el.addEventListener('change', mcCalc); }
    });
    mcCalc();
  }
};
function mcField(mode){
  return mode === 'n'
    ? fld('mc_n', 'Обороты n', '1000', 'об/мин', {ph:'постоянные обороты'})
    : fld('mc_vc', 'Vc', '180', 'м/мин', {ph:'постоянная скорость'});
}
function mcModeSwitch(){
  const mode = segVal('mc_mode') || 'vc';
  const cell = $('mc_scell');
  if(!cell) return;
  const d = num('mc_d', 0);
  const oldVc = num('mc_vc', 0);
  const oldN = num('mc_n', 0);
  if(mode === 'n'){
    const n = oldN > 0 ? oldN : (d > 0 && oldVc > 0 ? Math.round(1000 * oldVc / (Math.PI * d)) : 1000);
    cell.innerHTML = mcField('n');
    $('mc_n').value = String(n);
    $('mc_n').addEventListener('input', mcCalc);
    $('mc_n').addEventListener('change', mcCalc);
  } else {
    const vc = oldVc > 0 ? oldVc : (d > 0 && oldN > 0 ? Math.PI * d * oldN / 1000 : 180);
    cell.innerHTML = mcField('vc');
    $('mc_vc').value = String(Math.round(vc * 10) / 10).replace('.', ',');
    $('mc_vc').addEventListener('input', mcCalc);
    $('mc_vc').addEventListener('change', mcCalc);
  }
  mcCalc();
}
function mcCalc(){
  const out = $('mc_out'); if(!out) return;
  const d = num('mc_d', 0);
  const mode = segVal('mc_mode') || 'vc';
  let n = 0, vc = 0;
  if(mode === 'n'){
    n = Math.round(num('mc_n', 0));
    vc = d > 0 && n > 0 ? Math.PI * d * n / 1000 : 0;
  } else {
    vc = num('mc_vc', 0);
    n = d > 0 && vc > 0 ? Math.round(1000 * vc / (Math.PI * d)) : 0;
  }
  if(!(d > 0) || !(n > 0)){ out.innerHTML = '<div class="note" style="grid-column:1/-1">Введите диаметр и ' + (mode === 'n' ? 'обороты' : 'Vc') + '</div>'; return; }
  const vcFact = Math.PI * d * n / 1000;
  const over = n > 4000;
  const overChuck = n > 3500;
  out.innerHTML = rbox('Обороты n', fmt0(n), 'об/мин', over ? 'bad' : 'lead') +
    rbox('Скорость резания Vc', fmt(vcFact, 1), 'м/мин') +
    rbox('Лимит шпинделя', '4000', 'об/мин') +
    (over
      ? '<div class="note" style="grid-column:1/-1"><b style="color:#ff6b73">Превышен лимит шпинделя.</b> ' +
        'Снизьте Vc до ' + fmt(Math.PI * d * 4000 / 1000, 0) + ' м/мин или задайте LIMS=4000.</div>'
      : (overChuck
        ? '<div class="note" style="grid-column:1/-1">Выше 3500 об/мин — проверьте допустимые обороты патрона и кулачков.</div>'
        : '<div class="note" style="grid-column:1/-1">В пределах лимитов. ' +
          (mode === 'n'
            ? 'Для G97 так и оставьте: S' + fmt0(n) + '.'
            : 'Для G96 поставьте LIMS=' + Math.min(4000, Math.ceil(n / 100) * 100) + '.') + '</div>'));
}

/* ================= КОМАНДЫ 828D ================= */
SCREENS.cmds = {
  title: 'Команды',
  render(){
    if(cncInfo().id === 'fanuc') return fanucCmdsPage();
    if(cncInfo().id === 'osp') return ospCmdsPage();
    const g828 = [
      ['G0','ускоренный ход','G0 X100 Z50'],
      ['G1','линейная интерполяция, F в мм/об или мм/мин','G1 X40 Z-30 F0,2'],
      ['G2 / G3','дуга по / против часовой','G2 X30 Z-10 CR=5'],
      ['G4','пауза (сек)','G4 F0,5'],
      ['G9','точный останов на кадр','G9 X50'],
      ['G17 / G18 / G19','плоскости XY / ZX / YZ','G18 — токарная'],
      ['G25 / G26','ограничение / снятие ограничения оборотов','G26 S3000'],
      ['G33','резьба, шаг в K','G33 Z-25 K1,5'],
      ['G331 / G332','резьба без синхронизации / отмена','G331 Z-20 K1'],
      ['G40 / G41 / G42','коррекция радиуса инструмента','G42'],
      ['G53','в машинных координатах','G53 G0 X0 Z0'],
      ['G54…G57','нулевые точки заготовки','G54'],
      ['G60 / G64','точный останов / непрерывный контур','G64'],
      ['G70 / G71','дюймы / миллиметры','G71'],
      ['G90 / G91','абсолют / приращение','G91 G0 X2'],
      ['G94 / G95','мм/мин / мм/об','G95 F0,25'],
      ['G96 / G97','постоянная Vc / постоянные обороты','G96 S180 LIMS=3000'],
      ['G601 / G602 / G603','точный останов окна (точно/средне/грубо)','G602'],
      ['DIAMON / DIAMOF','X в диаметрах / в радиусах','DIAMON'],
      ['SPOS','ориентация шпинделя','SPOS=90'],
      ['CYCLE95','черновая обработка контура','CYCLE95("K1",2,0.2,0.2,0.3,0.25,0.2,0.15,1)'],
      ['CYCLE99','нарезание резьбы','CYCLE99(...)'],
      ['CYCLE93','канавка / отрезка','CYCLE93(...)'],
      ['CYCLE94 / CYCLE96','канавка под выход / недорез резьбы','CYCLE94(...)'],
      ['CYCLE81…CYCLE86','сверление, растачивание','CYCLE83(...)'],
      ['CYCLE84 / CYCLE840','резьба метчиком: жёсткий / плавающий','CYCLE84(...)'],
      ['CYCLE800','поворот рабочей плоскости (опция)','CYCLE800(...)']
    ];
    const prog = [
      ['DEF REAL x, y','объявление переменных','DEF REAL D1=10'],
      ['PROC / RET','начало и конец подпрограммы','PROC L100'],
      ['IF … GOTOF … ENDIF','условие','IF R1>5 GOTOF SKIP'],
      ['GOTOF / GOTOB','переход вперёд / назад по метке','GOTOB LOOP1'],
      ['LOOP … ENDLOOP','безусловный цикл','LOOP'],
      ['FOR … TO … ENDFOR','цикл со счётчиком','FOR R1=1 TO 10'],
      ['WHILE … ENDWHILE','цикл с условием','WHILE R1<5'],
      ['REPEAT … UNTIL','цикл с постусловием','REPEAT'],
      ['CALL','вызов подпрограммы','CALL "L100"'],
      ['TRANS / ATRANS','смещение нуля','TRANS Z-5'],
      ['ROT / AROT','поворот координат','ROT Z=90'],
      ['SCALE / ASCALE','масштабирование','SCALE X2'],
      ['MIRROR / AMIRROR','зеркало','MIRROR X0'],
      ['OFFSET','смещение по осям','OFFSET X10'],
      ['SUPA','отмена всех смещений','SUPA G0 Z100'],
      ['SBLON / SBLOF','включение/выключение покадрового стопа','SBLON'],
      ['SETINT','обработчик прерывания','SETINT(3) L10'],
      ['WAITM / WAITE','ожидание метки / конца кадра','WAITM(1,1,2)'],
      ['INIT','инициализация канала','INIT(2)']
    ];
    const vars = [
      ['R0…R99','свободные параметры','R1=100'],
      ['$P_EP[X]','запрограммированная позиция',''],
      ['$P_TOOLNO','номер активного инструмента',''],
      ['$P_TOOL','активный D-корректор',''],
      ['$A_DBB[n]','цифровой вход/выход',''],
      ['$A_OUTA[n]','аналоговый выход',''],
      ['$TC_DP1…$TC_DP25','данные инструмента (геометрия, износ)',''],
      ['GUD','глобальные пользовательские данные','']
    ];
    let h = '<div class="warn">Синтаксис зависит от версии ПО. Если стойка не принимает кадр, ' +
      'откройте подсказку <b>«i» / Help</b> — там актуальный формат.</div>';

    h += '<div class="h">Режимы работы стойки</div><div class="card">' +
      '<div class="kv"><span class="k">JOG</span><span class="v">ручной режим, привязка, измерение</span></div>' +
      '<div class="kv"><span class="k">MDA</span><span class="v">отработка одного блока</span></div>' +
      '<div class="kv"><span class="k">AUTO</span><span class="v">автомат по программе</span></div>' +
      '<div class="kv"><span class="k">ShopTurn</span><span class="v">программирование циклами (если куплено)</span></div>' +
      '<div class="note">Если программа не воспринимает G54 или циклы — проверьте, ' +
      'в каком диалекте она создана: Siemens или ISO.</div></div>';

    h += '<div class="h">Подготовительные G-коды</div>' +
      '<div class="tw"><table><tr><th>Код</th><th>Назначение</th></tr>' +
      g828.map(g => '<tr><td><b>' + g[0] + '</b></td><td>' + g[1] + '</td></tr>').join('') + '</table></div>';

    h += '<div class="h">Программирование</div>' +
      '<div class="tw"><table><tr><th>Команда</th><th>Что делает</th></tr>' +
      prog.map(g => '<tr><td><b>' + g[0] + '</b></td><td>' + g[1] + '</td></tr>').join('') + '</table></div>';

    h += '<div class="h">Переменные и данные</div>' +
      '<div class="tw"><table><tr><th>Переменная</th><th>Смысл</th></tr>' +
      vars.map(g => '<tr><td><b>' + g[0] + '</b></td><td>' + g[1] + '</td></tr>').join('') + '</table></div>';

    h += '<div class="h">M-коды</div>' +
      '<div class="tw"><table><tr><th>Код</th><th>Назначение</th></tr>' +
      D.mcodes.map(m => '<tr><td><b>' + m[0] + '</b></td><td>' + m[1] + '</td></tr>').join('') + '</table></div>' +
      '<div class="note">M-коды сверх стандартных (приводной инструмент, тормоз оси C, зажим патрона, ' +
      'сдув, конвейер стружки) задаёт производитель станка. Их таблица — в руководстве T65M II/750 ' +
      'и в папке программ станка.</div>';

    h += '<div class="h">Каркас программы</div><pre class="code">' +
      'N10 G71 G90 G18 DIAMON\n' +
      'N20 G54 G0 X200 Z200\n' +
      'N30 T1 D1 M6\n' +
      'N40 G96 S180 LIMS=3000 M3 M8\n' +
      'N50 G0 X62 Z2\n' +
      'N60 G1 Z0 F0,3\n' +
      'N70 G1 X-1 F0,12\n' +
      '<i>; … обработка …</i>\n' +
      'N200 G0 X200 Z200 M9\n' +
      'N210 M30</pre>' +
      '<div class="note">Расшифровка: <b>G71</b> — миллиметры, <b>G90</b> — абсолютные координаты, ' +
      '<b>G18</b> — плоскость ZX, <b>DIAMON</b> — X в диаметрах, <b>T1 D1</b> — инструмент и корректор, ' +
      '<b>LIMS</b> — предел оборотов.</div>';
    return h;
  }
};
