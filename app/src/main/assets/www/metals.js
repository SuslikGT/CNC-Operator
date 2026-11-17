/* Марки сталей и сплавов */
SCREENS.metals = {
  title: 'Марки сталей',
  render(){
    return '<div class="card"><div class="search"><input class="inp" id="mt_q" type="text" autocomplete="off" ' +
      'placeholder="30ХГСА, 12Х18Н10Т, чугун…"></div>' +
      '<div class="note" style="margin-top:0">Можно искать по марке, группе или применению.</div></div>' +
      '<button class="collapse-head" type="button" data-collapse="mt_letters" aria-expanded="false">' +
        '<span>Что значат буквы</span>' +
        '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>' +
      '</button>' +
      '<div class="collapse-body" id="mt_letters">' +
      '<div class="card">' +
      D.letterCodes.map(r => '<div class="kv"><span class="k"><b>' + r[0] + '</b></span><span class="v">' +
        r[1] + '</span></div>').join('') +
      '<div class="note">Цифры в начале марки — среднее содержание углерода в сотых долях процента: ' +
      '<b>45</b> = 0,45 % C, <b>30ХГСА</b> = ~0,30 % C. У инструментальных — в десятых: <b>У8</b> = 0,8 % C.</div></div>' +
      '</div>' +
      '<div class="h">Марки</div><div id="mt_list"></div>' +
      '<div class="note">Состав приведён по ГОСТ (средние диапазоны) и предназначен для ориентира. ' +
      'Для точных расчётов и сертификации используйте ГОСТ 4543, 5632, 1050 и сертификат на партию.</div>';
  },
  mount(){
    const q = $('mt_q');
    const draw = () => { $('mt_list').innerHTML = mtList(q.value); };
    q.addEventListener('input', draw);
    draw();
  }
};
function mtList(query){
  const q = String(query || '').trim().toLowerCase();
  const rows = D.steels.filter(s => !q || (s.c + ' ' + s.n + ' ' + s.g + ' ' + s.use + ' ' + s.comp).toLowerCase().indexOf(q) >= 0);
  if(!rows.length) return '<div class="empty">Ничего не найдено</div>';
  return rows.map(s => {
    const vc = s.vc;
    return '<div class="card">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">' +
        '<div style="font-size:17px;font-weight:700;color:#f2a33c">' + s.c + '</div>' +
        '<div class="tag" style="margin:0">' + s.g + '</div></div>' +
      '<div class="mini" style="margin-top:2px">' + s.n + '</div>' +
      '<div class="kv"><span class="k">Состав</span><span class="v" style="max-width:62%">' + s.comp + '</span></div>' +
      '<div class="kv"><span class="k">Твёрдость</span><span class="v">' + s.hb + '</span></div>' +
      '<div class="kv"><span class="k">Сварка</span><span class="v">' + s.weld + '</span></div>' +
      '<div class="kv"><span class="k">Применение</span><span class="v" style="max-width:62%">' + s.use + '</span></div>' +
      '<div class="kv"><span class="k">Vc твердосплавом</span><span class="v">' + vc + ' м/мин</span></div>' +
      '</div>';
  }).join('');
}
