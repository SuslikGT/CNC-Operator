/* Баг-репорт */
const BUG_REPO = 'SuslikGT/CNC-Operator';
const BUG_KEY = 'bugreports';

function openExternal(url){
  try{
    if(window.Native && Native.openUrl){ Native.openUrl(url); return; }
  }catch(e){}
  try{ window.location.href = url; }catch(e){ toast('Не удалось открыть ссылку'); }
}
function deviceInfo(){
  const ua = navigator.userAgent || '';
  const m = ua.match(/Android\s+([\d.]+)/i);
  const model = (ua.match(/;\s*([^;)]+)\s*Build/i) || [])[1] || '';
  return {
    version: (typeof appVersion === 'function') ? appVersion() : {name: '—', code: '—'},
    android: m ? m[1] : '—',
    model: model.trim(),
    screen: window.screen.width + '×' + window.screen.height,
    dpr: window.devicePixelRatio || 1
  };
}
function bugTypeLabel(t){
  return t === 'idea' ? 'Идея' : t === 'question' ? 'Вопрос' : 'Ошибка';
}
function bugBody(type, text, contact){
  const d = deviceInfo();
  const dt = new Date().toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
  return '### ' + bugTypeLabel(type) + '\n\n' + text.trim() +
    '\n\n---\n' +
    '**Версия:** ' + d.version.name + ' (' + d.version.code + ')\n' +
    '**Устройство:** Android ' + d.android + (d.model ? ', ' + d.model : '') + '\n' +
    '**Экран:** ' + d.screen + ' (×' + d.dpr + ')\n' +
    '**Дата:** ' + dt + '\n' +
    (contact ? '**Связь:** ' + contact + '\n' : '');
}
function bugIssueUrl(type, text, contact){
  const body = bugBody(type, text, contact);
  const first = text.trim().split('\n')[0].slice(0, 60);
  const title = '[' + bugTypeLabel(type) + '] ' + (first || 'без описания');
  return 'https://github.com/' + BUG_REPO + '/issues/new?title=' +
    encodeURIComponent(title) + '&body=' + encodeURIComponent(body.slice(0, 5000));
}
function bugSave(type, text, sent){
  const list = lsGet(BUG_KEY, []);
  list.unshift({id: Date.now(), t: Date.now(), type: type, text: text, sent: !!sent});
  lsSet(BUG_KEY, list.slice(0, 30));
}
function bugList(){
  const list = lsGet(BUG_KEY, []);
  if(!list.length) return '<div class="empty">Отчётов пока нет</div>';
  return list.map(r => {
    const d = new Date(r.t);
    const dt = d.toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
    return '<div class="card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">' +
      '<div><div style="font-weight:600">' + esc(bugTypeLabel(r.type)) + ' · ' + dt + '</div>' +
      '<div class="mini" style="margin-top:4px;white-space:pre-wrap">' + esc(r.text.slice(0, 400)) + '</div></div>' +
      '<button class="del" type="button" data-bugdel="' + r.id + '">×</button></div>' +
      '<div class="mini" style="margin-top:6px;color:' + (r.sent ? '#4ad991' : '#8496a8') + '">' +
      (r.sent ? 'отправлено' : 'сохранено локально') + '</div></div>';
  }).join('');
}

SCREENS.bug = {
  title: 'Баг-репорт',
  render(){
    const d = deviceInfo();
    return '<div class="card">' +
        '<label class="f"><span>Тип обращения</span><div class="iw"><select class="inp" id="br_type">' +
          '<option value="bug">Ошибка</option><option value="idea">Идея</option>' +
          '<option value="question">Вопрос</option></select></div></label>' +
        '<label class="f"><span>Что случилось</span>' +
          '<textarea class="inp ta" id="br_text" rows="5" placeholder="Что делали, что произошло и что ожидали. Чем подробнее — тем быстрее исправим."></textarea>' +
        '</label>' +
        fld('br_contact', 'Контакт для ответа (необязательно)', '', '', {ph: 'почта или @ник', text: true}) +
        '<button class="btn pri" type="button" id="br_send">Отправить отчёт</button>' +
        '<div class="row2" style="margin-top:8px">' +
          '<button class="btn ghost sm" type="button" id="br_copy">Скопировать</button>' +
          '<button class="btn ghost sm" type="button" id="br_save">Сохранить</button>' +
        '</div>' +
        '<div class="mini" style="margin-top:10px" id="br_info">Версия ' + esc(d.version.name) +
          ' · Android ' + esc(d.android) + (d.model ? ' · ' + esc(d.model) : '') +
          ' · ' + esc(d.screen) + '</div>' +
      '</div>' +
      '<div class="note">Отчёт откроется на GitHub с уже заполненным текстом — останется нажать «Submit new issue». ' +
      'Если отправить не получится, скопируйте текст и передайте любым удобным способом.</div>' +
      '<div class="h">Мои отчёты</div><div id="br_list">' + bugList() + '</div>';
  },
  mount(){
    const ta = $('br_text');
    const send = $('br_send'), copy = $('br_copy'), save = $('br_save');
    ['br_type','br_contact'].forEach(id => { const el = $(id); if(el){ el.addEventListener('change', () => {}); } });

    send.addEventListener('click', () => {
      const text = (ta.value || '').trim();
      if(text.length < 10){ toast('Опишите проблему подробнее'); ta.focus(); return; }
      const type = val('br_type'), contact = val('br_contact').trim();
      bugSave(type, text, true);
      openExternal(bugIssueUrl(type, text, contact));
      toast('Отчёт открыт на GitHub');
      ta.value = '';
      return;
    });
    copy.addEventListener('click', () => {
      const text = (ta.value || '').trim();
      if(text.length < 5){ toast('Введите текст'); return; }
      const full = bugBody(val('br_type'), text, val('br_contact').trim());
      const tmp = document.createElement('textarea');
      tmp.value = full; tmp.style.position = 'fixed'; tmp.style.opacity = '0';
      document.body.appendChild(tmp); tmp.select();
      let ok = false;
      try{ ok = document.execCommand('copy'); }catch(e){}
      document.body.removeChild(tmp);
      toast(ok ? 'Текст скопирован' : 'Выделите текст и скопируйте вручную');
    });
    save.addEventListener('click', () => {
      const text = (ta.value || '').trim();
      if(text.length < 10){ toast('Опишите проблему подробнее'); return; }
      bugSave(val('br_type'), text, false);
      ta.value = '';
      $('br_list').innerHTML = bugList();
      bindBugDel();
      toast('Сохранено на телефоне');
    });
    bindBugDel();
  }
};
function bindBugDel(){
  $$('[data-bugdel]').forEach(b => b.addEventListener('click', () => {
    const list = lsGet(BUG_KEY, []).filter(x => String(x.id) !== b.dataset.bugdel);
    lsSet(BUG_KEY, list);
    const box = $('br_list');
    if(box) box.innerHTML = bugList();
    bindBugDel();
  }));
}
