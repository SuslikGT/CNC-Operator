/* Пластины, державки, свёрла, сплавы */
SCREENS.insert = {
  title: 'Пластины ISO',
  render(){
    return '<div class="card"><div class="search"><input class="inp" id="ins_q" type="text" autocomplete="off" ' +
      'placeholder="CNMG 120408" style="text-transform:uppercase"></div>' +
      '<button class="btn pri" type="button" id="ins_go">Расшифровать</button>' +
      '<div id="ins_out" style="margin-top:12px"></div></div>' +
      '<div class="h">Частые обозначения</div><div class="card">' +
      ['CNMG 120408','CNMG 120412','CCMT 09T304','DCMT 070204','VCMT 160404','TNMG 160408',
       'WNMG 080408','SCMT 09T308','RCMT 120400','DNMG 150608'].map(c =>
        '<span class="pill" data-ins="' + c + '">' + c + '</span>').join('') +
      '</div>' +
      '<div class="h">Структура кода</div>' +
      '<div class="card"><div class="kv"><span class="k">1-я буква</span><span class="v">форма пластины</span></div>' +
      '<div class="kv"><span class="k">2-я буква</span><span class="v">задний угол</span></div>' +
      '<div class="kv"><span class="k">3-я буква</span><span class="v">класс точности</span></div>' +
      '<div class="kv"><span class="k">4-я буква</span><span class="v">тип крепления и стружколом</span></div>' +
      '<div class="kv"><span class="k">цифры 1–2</span><span class="v">размер (вписанный круг), мм</span></div>' +
      '<div class="kv"><span class="k">цифры 3–4</span><span class="v">толщина, мм</span></div>' +
      '<div class="kv"><span class="k">цифры 5–6</span><span class="v">радиус при вершине, мм</span></div>' +
      '<div class="kv"><span class="k">окончание</span><span class="v">направление R/L, стружколом, покрытие</span></div>' +
      '</div>' +
      '<div class="h">Формы пластин</div>' +
      '<div class="tw"><table><tr><th>Код</th><th>Угол</th><th>Форма</th></tr>' +
      Object.keys(D.insertShapes).map(k => {
        const s = D.insertShapes[k];
        return '<tr><td>' + k + '</td><td class="n">' + (s.a ? s.a + '°' : '—') + '</td><td>' + s.name + '</td></tr>';
      }).join('') + '</table></div>' +
      '<div class="note">Угол — при вершине пластины. Чем меньше угол, тем острее и слабее кромка: V (35°) — только чистовая, S (90°) — черновая.</div>' +
      '<div class="h">Задние углы</div><div class="card">' +
      Object.keys(D.relief).map(k => '<span class="pill"><b>' + k + '</b> ' + D.relief[k] + '</span>').join('') +
      '<div class="note">N = 0° — двусторонняя пластина (переворачивается), самая экономичная.</div></div>';
  },
  mount(){
    $('ins_go').addEventListener('click', insDecode);
    $('ins_q').addEventListener('input', () => { if($('ins_q').value.replace(/\s/g,'').length >= 8) insDecode(); });
    $('ins_q').addEventListener('keydown', e => { if(e.key === 'Enter') insDecode(); });
    $$('[data-ins]').forEach(el => el.addEventListener('click', () => {
      $('ins_q').value = el.dataset.ins; insDecode(); window.scrollTo({top:0, behavior:'smooth'});
    }));
  }
};
function insDecode(){
  const raw = String(val('ins_q')).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const out = $('ins_out'); if(!out) return;
  const m = raw.match(/^([A-Z]{4})(\d{2})([0-9A-Z]{2})(\d{2})/);
  if(!m){ out.innerHTML = '<div class="warn">Не удалось разобрать код. Пример: <b>CNMG 120408</b> — 4 буквы + 6 знаков.</div>'; return; }
  const L = m[1], size = m[2], th = m[3], rad = m[4];
  const sh = D.insertShapes[L[0]], rel = D.relief[L[1]], tol = D.insertTol[L[2]], cl = D.clampTypes[L[3]];
  const sizeMm = D.insertSize[size], thMm = D.insertThick[th] || (parseFloat(th) / 100);
  const radMm = D.noseR[rad];
  let rows = '';
  const put = (k, v) => rows += '<div class="kv"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>';
  put('Форма', sh ? sh.name + ' (' + L[0] + ', ' + sh.a + '°)' : '<span style="color:#e86b70">неизвестно</span>');
  put('Задний угол', rel ? rel : '—');
  put('Точность', tol ? tol : '—');
  put('Крепление', cl ? cl : '—');
  put('Размер IC', sizeMm ? fmt(sizeMm, 3) + ' мм' : 'код ' + size);
  put('Толщина', thMm ? fmt(thMm, 2) + ' мм' : 'код ' + th);
  put('Радиус', radMm !== undefined ? fmt(radMm, 2) + ' мм' : 'код ' + rad);
  let note = '';
  if(sh && (sh.a === 35 || sh.a === 55)) note = 'Острая кромка: подходит для чистовой и профильной обработки, черновую нагрузку не держит.';
  else if(sh && (sh.a === 90 || sh.a === 80)) note = 'Прочная кромка: черновая и получистовая обработка.';
  out.innerHTML = '<div style="font-size:20px;font-weight:700;color:#f2a33c;margin-bottom:8px">' + L +
    ' ' + size + th + rad + '</div>' + rows +
    (note ? '<div class="note">' + note + '</div>' : '') +
    (radMm !== undefined ? '<div class="note">Теоретическая Ra при подаче 0,2 мм/об: <b>' +
      fmt(0.2 * 0.2 / (32 * radMm) * 1000, 2) + ' мкм</b></div>' : '');
}

SCREENS.holder = {
  title: 'Державки',
  render(){
    return '<div class="h">Как читать обозначение</div><div class="card">' +
      D.holders.letters.map(r => '<div class="kv"><span class="k">' + r[0] + '</span><span class="v">' +
        r[2] + '</span></div>').join('') +
      '<div class="note">Обозначения немного отличаются у Sandvik, Iscar, Korloy, Taegutec. ' +
      'Главное — совпадение <b>формы</b> пластины и её <b>размера</b>, остальное — геометрия державки.</div></div>' +
      '<div class="h">Примеры</div>' +
      D.holders.examples.map(e => '<div class="card"><div style="font-size:15px;font-weight:700;color:#f2a33c">' +
        e[0] + '</div><div class="note" style="margin-top:4px">' + e[1] + '</div></div>').join('') +
      '<div class="h">Подбор пластины под державку</div>' +
      '<div class="tw"><table><tr><th>Державка</th><th>Форма</th><th class="n">Пластина</th></tr>' +
      [['MCLNR/PCLNR','C, 80°','CNMG/CNMM 12…, 16…'],
       ['MCSNR/PCSNR','S, 90°','SNMG 12…, 15…'],
       ['MDJNR/PDJNR','D, 55°','DNMG 11…, 15…'],
       ['SDJCR/SDJCL','D, 55°','DCMT 07…, 11…'],
       ['STGCR/STGCL','T, 60°','TCMT 09…, 11…, 16…'],
       ['SVJCR','V, 35°','VCMT 11…, 16…'],
       ['MWLNR','W, 60°','WNMG 06…, 08…'],
       ['SRDCN','R, круг','RCMT/RCMX 08…, 10…'],
       ['MGEHR/SGEHR','отрезная','MGMN, ZTFD 03…'],
       ['MGIVR','канавочная','MGMN, ZTFD'],
       ['SER/SNR','резьбовая 60°','16ER, 16IR'],
       ['A25T-SDUCR','расточной','DCMT 11…']].map(r =>
        '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td class="n">' + r[2] + '</td></tr>').join('') +
      '</table></div>' +
      '<div class="note"><b>M</b> и <b>P</b> в начале — способ крепления (прижим сверху / штифт). ' +
      'Для черновой работы прижим надёжнее, для чистовой — винт (лучше доступ к стружке).</div>';
  }
};

SCREENS.drill = {
  title: 'Свёрла, метчики, фрезы',
  render(){
    const tbl = (head, rows) => '<div class="tw"><table><tr><th>' + head[0] + '</th><th>' + head[1] + '</th>' +
      (head[2] ? '<th>' + head[2] + '</th>' : '') + '</tr>' +
      rows.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td>' + (head[2] ? '<td>' + r[2] + '</td>' : '') + '</tr>').join('') +
      '</table></div>';
    return '<div class="h">Свёрла</div>' + tbl(['Обозначение','Что значит','Примечание'], D.drills) +
      '<div class="h">Метчики</div>' + tbl(['Обозначение','Что значит','Примечание'], D.taps) +
      '<div class="h">Фрезы</div>' + tbl(['Обозначение','Что значит','Примечание'], D.endmills) +
      '<div class="h">ISO-группы</div><div class="card">' +
      D.isoGroups.map(g => '<div class="kv"><span class="k"><span class="swatch" style="background:' + g.col +
        ';margin-right:6px"></span><b>' + g.c + '</b> — ' + g.name + '</span><span class="v" style="max-width:52%;font-size:12.5px">' +
        g.note + '</span></div>').join('') +
      '<div class="note">Цвет пластины или упаковки почти всегда указывает на группу ISO: синий — сталь, жёлтый — нержавейка, красный — чугун.</div></div>' +
      '<div class="h">Покрытия</div><div class="card">' +
      D.coatings.map(c => '<div class="kv"><span class="k"><span class="swatch" style="background:' + c.col +
        ';margin-right:6px"></span><b>' + c.c + '</b> — ' + c.t + '</span><span class="v" style="max-width:52%;font-size:12.5px">' +
        c.use + '</span></div>').join('') + '</div>' +
      '<div class="h">Марки сплавов у брендов</div>' +
      '<div class="tw"><table><tr><th>Бренд</th><th>Пример</th></tr>' +
      D.grades.map(g => '<tr><td>' + g.m + '</td><td>' + g.ex + '</td></tr>').join('') + '</table></div>' +
      '<div class="note">' + D.grades.map(g => '<b>' + g.m + '</b>: ' + g.rule).join('<br>') + '</div>';
  }
};
