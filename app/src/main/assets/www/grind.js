/* Режимы круглого шлифования */

const GR_TYPICAL = [
  ['Сталь незакалённая','30–35','20–30','0,010–0,025'],
  ['Сталь закалённая (HRC 45+)','25–30','15–25','0,005–0,015'],
  ['Нержавеющая','25–30','15–25','0,005–0,015'],
  ['Чугун','25–30','20–30','0,010–0,030'],
  ['Твёрдый сплав (алмаз/КНБ)','20–25','10–20','0,002–0,010']
];

function grindModesPage(){
  return '<div class="card"><div class="kick">круглое шлифование</div>' +
      '<div class="mini" style="margin-top:4px">Скорость круга задаётся в м/с, скорость детали — в м/мин. ' +
      'Подача — на проход (врезание).</div></div>' +
    '<div class="card">' +
      '<div class="row2">' + fld('gr_d', 'Диаметр круга', '455', 'мм') + fld('gr_vc', 'Скорость круга', '35', 'м/с') + '</div>' +
      '<div class="row2">' + fld('gr_dw', 'Диаметр детали', '30', 'мм') + fld('gr_vw', 'Скорость детали', '25', 'м/мин') + '</div>' +
      '<div class="row2">' + fld('gr_ae', 'Подача на проход', '0,01', 'мм') + fld('gr_total', 'Съём всего', '0,3', 'мм') + '</div>' +
      '<div class="row2">' + fld('gr_l', 'Длина хода', '60', 'мм') + fld('gr_spark', 'Выхаживание', '3', 'проходов') + '</div>' +
      '<div class="res" id="gr_out"></div>' +
    '</div>' +
    '<div class="h">Типовые значения</div>' +
    '<div class="tw"><table><tr><th>Материал</th><th class="n">Круг, м/с</th><th class="n">Деталь, м/мин</th><th class="n">Подача, мм</th></tr>' +
    GR_TYPICAL.map(r => '<tr><td>' + r[0] + '</td><td class="n">' + r[1] + '</td><td class="n">' + r[2] +
      '</td><td class="n">' + r[3] + '</td></tr>').join('') + '</table></div>' +
    '<div class="note">Скорость круга выше паспортной (для 455 мм — 1900 об/мин, это ~45 м/с при новом круге) ' +
    'не поднимайте: круг может разорвать. По мере износа обороты пересчитывайте, чтобы держать м/с.</div>' +
    '<div class="warn">Подача больше 0,03 мм за проход даёт прижог и дробление. Чистовые проходы — ' +
    '0,002–0,005 мм с выхаживанием 2–5 проходов.</div>';
}

function grindModesMount(){
  ['gr_d','gr_vc','gr_dw','gr_vw','gr_ae','gr_total','gr_l','gr_spark'].forEach(id => {
    const el = $(id); if(el){ el.addEventListener('input', grindModesCalc); el.addEventListener('change', grindModesCalc); }
  });
  grindModesCalc();
}

function grindModesCalc(){
  const out = $('gr_out'); if(!out) return;
  const D = num('gr_d', 0), vc = num('gr_vc', 0);
  const Dw = num('gr_dw', 0), vw = num('gr_vw', 0);
  const ae = num('gr_ae', 0), total = num('gr_total', 0);
  const L = num('gr_l', 0), spark = num('gr_spark', 0);
  if(!(D > 0) || !(vc > 0)){ out.innerHTML = '<div class="note" style="grid-column:1/-1">Введите диаметр и скорость круга</div>'; return; }

  const nWheel = 60000 * vc / (Math.PI * D);
  const maxRpm = 1900;
  const over = nWheel > maxRpm;
  const vMax = Math.PI * D * maxRpm / 60000;
  const nWork = (Dw > 0 && vw > 0) ? 1000 * vw / (Math.PI * Dw) : NaN;
  const passes = (ae > 0 && total > 0) ? Math.ceil(total / ae) : NaN;
  const feedPass = vw * 1000 / 60;
  const tOne = (L > 0 && feedPass > 0) ? L / feedPass : NaN;
  const tCycle = isFinite(passes) && isFinite(tOne) ? passes * tOne + spark * tOne : NaN;
  const q = (ae > 0 && vw > 0) ? ae * vw * 1000 / 60 : NaN;

  out.innerHTML =
    rbox('Обороты круга', fmt0(nWheel), 'об/мин', over ? 'bad' : 'lead') +
    rbox('Обороты детали', isFinite(nWork) ? fmt0(nWork) : '—', 'об/мин') +
    rbox('Проходов', isFinite(passes) ? fmt0(passes) : '—', 'шт') +
    rbox('Время цикла', isFinite(tCycle) ? fmt(tCycle, 1) : '—', 'с') +
    rbox('Съём в минуту', isFinite(q) ? fmt(q, 1) : '—', 'мм³/мин') +
    (over
      ? '<div class="warn" style="grid-column:1/-1">' + fmt0(nWheel) + ' об/мин выше паспортных 1900. ' +
        'Максимум для ⌀' + fmt(D, 0) + ' мм — ' + fmt(vMax, 1) + ' м/с. Снизьте скорость круга.</div>'
      : '<div class="note" style="grid-column:1/-1">Для ⌀' + fmt(D, 0) + ' мм паспортный предел 1900 об/мин ' +
        'соответствует ' + fmt(vMax, 1) + ' м/с.</div>');
}
