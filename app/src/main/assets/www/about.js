/* О приложении и авторство */
SCREENS.about = {
  title: 'О приложении',
  render(){
    const v = (typeof appVersion === 'function') ? appVersion() : {name: '1.1', code: 2};
    return '<div class="card about-head">' +
        '<div class="about-logo">S</div>' +
        '<div><div class="about-name">ЧПУ Оператор</div>' +
        '<div class="about-author">автор: SuslikGT</div>' +
        '<div class="about-ver">версия ' + esc(v.name) + ' · сборка ' + esc(v.code) + '</div></div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="kv"><span class="k">Назначение</span><span class="v" style="max-width:62%">' +
          'рабочий справочник и калькуляторы оператора токарно-фрезерного центра</span></div>' +
        '<div class="kv"><span class="k">Станок</span><span class="v">Headman T65M II/750</span></div>' +
        '<div class="kv"><span class="k">Стойка</span><span class="v">SINUMERIK 828D</span></div>' +
        '<div class="kv"><span class="k">Пакет</span><span class="v">ru.cnc.operator</span></div>' +
        '<div class="kv"><span class="k">Android</span><span class="v">7.0 и новее</span></div>' +
        '<div class="kv"><span class="k">Сеть</span><span class="v">только проверка обновлений</span></div>' +
      '</div>' +
      '<div class="h">Что внутри</div><div class="card"><ul class="list">' +
        '<li>Расчёт режимов резания, времени, стоимости, геометрии и массы заготовки.</li>' +
        '<li>Резьба, шероховатость, допуски, перевод единиц.</li>' +
        '<li>Разбор пластин ISO и державок, свёрла, метчики, фрезы.</li>' +
        '<li>Марки сталей с составом и режимами обработки.</li>' +
        '<li>Раздел по станку T65M II/750 и команды 828D.</li>' +
        '<li>Корректоры, стойкость инструмента, чек-лист наладки.</li>' +
      '</ul></div>' +
      '<div class="h">Автор</div><div class="card">' +
        '<div class="kv"><span class="k">Автор и разработчик</span><span class="v"><b>SuslikGT</b></span></div>' +
        '<div class="kv"><span class="k">Год</span><span class="v">2026</span></div>' +
        '<div class="kv"><span class="k">Версия</span><span class="v">' + esc(v.name) + ' (' + esc(v.code) + ')</span></div>' +
        '<div class="note">Приложение сделано как личный рабочий инструмент оператора. ' +
        'Копирование и передача — по согласованию с автором.</div>' +
      '</div>' +
      '<div class="h">Данные</div><div class="card">' +
        '<div class="note" style="margin-top:0">Все расчёты и таблицы носят справочный характер. ' +
        'Полный список источников и нормативов — в отдельном разделе.</div>' +
        '<button class="btn ghost" type="button" data-go="sources">Источники данных</button>' +
        '<button class="btn ghost" type="button" data-go="updates">Проверить обновления</button>' +
      '</div>' +
      '<div class="warn">Приложение не заменяет руководство по эксплуатации станка, паспорт изделия ' +
      'и каталог инструмента. Ответственность за режимы обработки и безопасность — на операторе.</div>' +
      '<div class="note" style="text-align:center;margin:18px 0 4px">© 2026 SuslikGT · ЧПУ Оператор</div>';
  }
};
