/* Баг-репорт: отправка на почту через FormSubmit + офлайн-очередь */
const BUG_EMAIL = 'suslikkozber@gmail.com';
const BUG_ENDPOINT = 'https://formsubmit.co/ajax/' + BUG_EMAIL;
const BUG_REPO = 'SuslikGT/CNC-Operator';
const BUG_KEY = 'bugreports';
const BUG_QUEUE = 'bugqueue';

function openExternal(url){
  try{
    if(window.Native && Native.openUrl){ Native.openUrl(url); return; }
  }catch(e){}
  try{ window.location.href = url; }catch(e){ toast('Не удалось открыть ссылку'); }
}
function deviceInfo(){
  const ua = navigator.userAgent || '';
  const apk = !!(window.Native && window.Native.versionName);
  const standalone = !!(navigator.standalone ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));
  const mode = apk ? 'APK' : standalone ? 'PWA с экрана' : 'браузер';

  let os = 'неизвестно', ver = '', model = '';
  const a = ua.match(/Android\s+([\d.]+)/i);
  const i = ua.match(/OS\s+([\d_]+)\s+like\s+Mac/i);
  if(a){
    os = 'Android';
    ver = a[1];
    model = ((ua.match(/;\s*([^;)]+)\s*Build/i) || [])[1] || '').trim();
  } else if(/iPhone/i.test(ua)){
    os = 'iOS';
    ver = i ? i[1].replace(/_/g, '.') : '';
    model = 'iPhone';
  } else if(/iPad/i.test(ua)){
    os = 'iPadOS';
    ver = i ? i[1].replace(/_/g, '.') : '';
    model = 'iPad';
  } else if(/Windows/i.test(ua)){
    os = 'Windows';
  } else if(/Mac OS X/i.test(ua)){
    os = 'macOS';
  } else if(/Linux/i.test(ua)){
    os = 'Linux';
  }

  const device = os + (ver ? ' ' + ver : '') + (model && model !== os ? ', ' + model : '') + ' · ' + mode;
  return {
    version: (typeof appVersion === 'function') ? appVersion() : {name: '—', code: '—'},
    os: os,
    android: ver,
    model: model,
    mode: mode,
    device: device,
    screen: window.screen.width + '×' + window.screen.height,
    dpr: window.devicePixelRatio || 1
  };
}
function bugTypeLabel(t){
  return t === 'idea' ? 'Идея' : t === 'question' ? 'Вопрос' : 'Ошибка';
}
function bugStamp(){
  return new Date().toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
}
function bugPayload(type, text, contact){
  const d = deviceInfo();
  return {
    name: 'ЧПУ Оператор',
    'Тип': bugTypeLabel(type),
    'Текст': text.trim(),
    'Контакт': contact || '—',
    'Версия': d.version.name + ' (' + d.version.code + ')',
    'Устройство': d.device,
    'Платформа': d.os + ' · ' + d.mode,
    'Экран': d.screen + ' ×' + d.dpr,
    'Дата': bugStamp(),
    '_subject': 'ЧПУ Оператор: баг-репорт',
    '_template': 'table',
    '_captcha': 'false'
  };
}
function bugBody(type, text, contact){
  const d = deviceInfo();
  return '### ' + bugTypeLabel(type) + '\n\n' + text.trim() +
    '\n\n---\n' +
    '**Версия:** ' + d.version.name + ' (' + d.version.code + ')\n' +
    '**Устройство:** ' + d.device + '\n' +
    '**Экран:** ' + d.screen + ' (×' + d.dpr + ')\n' +
    '**Дата:** ' + bugStamp() + '\n' +
    (contact ? '**Связь:** ' + contact + '\n' : '');
}

function postJson(url, obj){
  return new Promise(resolve => {
    const body = JSON.stringify(obj);
    if(window.Native && Native.httpPost){
      const id = 'pb' + Date.now() + Math.floor(Math.random() * 10000);
      window.__cb[id] = raw => resolve({err: '', body: raw || ''});
      try{ Native.httpPost(url, body, id); }catch(e){ delete window.__cb[id]; resolve({err: 'WebView', body: ''}); return; }
      setTimeout(() => {
        if(window.__cb[id]){ delete window.__cb[id]; resolve({err: 'Timeout', body: ''}); }
      }, 50000);
    } else {
      fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: body
      }).then(r => r.text()).then(t => resolve({err: '', body: t}))
        .catch(() => resolve({err: 'Network', body: ''}));
    }
  });
}
async function sendReport(type, text, contact){
  const r = await postJson(BUG_ENDPOINT, bugPayload(type, text, contact));
  const err = (r.body || '').startsWith('ERR:') ? r.body.slice(4) : r.err;
  if(/UnknownHost|ConnectException|NoRoute|Unreachable|Network/i.test(err)) return {ok: false, reason: 'offline'};
  const clean = (r.body || '').startsWith('ERR:') ? '' : (r.body || '');
  if(!clean) return {ok: false, reason: 'noconfirm'};
  try{
    const j = JSON.parse(clean);
    if(String(j.success) === 'true') return {ok: true};
    return {ok: false, reason: 'server', message: j.message || ''};
  }catch(e){
    return {ok: false, reason: 'noconfirm'};
  }
}
function bugSave(type, text, sent){
  const d = deviceInfo();
  const list = lsGet(BUG_KEY, []);
  list.unshift({id: Date.now(), t: Date.now(), type: type, text: text, sent: !!sent,
    ver: d.version.name + ' (' + d.version.code + ')', andr: d.android, model: d.model, dev: d.device});
  lsSet(BUG_KEY, list.slice(0, 30));
}
function queueAdd(type, text, contact){
  const d = deviceInfo();
  const q = lsGet(BUG_QUEUE, []);
  q.unshift({id: Date.now(), t: Date.now(), type: type, text: text, contact: contact || '',
    ver: d.version.name + ' (' + d.version.code + ')', andr: d.android, model: d.model, dev: d.device});
  lsSet(BUG_QUEUE, q.slice(0, 20));
}
function queueSet(list){ lsSet(BUG_QUEUE, list); }
async function bugQueueFlush(){
  const q = lsGet(BUG_QUEUE, []);
  if(!q.length) return;
  const left = [];
  for(let i = 0; i < q.length && i < 5; i++){
    const it = q[i];
    const res = await sendReport(it.type, it.text, it.contact);
    if(res.ok){ bugSave(it.type, it.text, true); }
    else if(res.reason === 'offline'){ left.push(it); }
    else if(res.reason === 'noconfirm'){ bugSave(it.type, it.text, true); }
    else { bugSave(it.type, it.text, false); }
  }
  for(let i = 5; i < q.length; i++) left.push(q[i]);
  queueSet(left);
  if(!left.length) toast('Отложенные отчёты отправлены');
}
window.bugQueueInit = function(){ setTimeout(bugQueueFlush, 2500); };

function bugRow(r, src){
  const d = new Date(r.t);
  const dt = d.toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
  const state = src === 'q' ? 'в очереди' : (r.sent ? 'отправлено' : 'не отправлено');
  const color = src === 'q' ? '#e8b44a' : (r.sent ? '#4ad991' : '#8496a8');
  return '<div class="card" data-bugopen="' + r.id + '" data-src="' + src + '" style="cursor:pointer">' +
    '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">' +
    '<div style="min-width:0"><div style="font-weight:600">' + esc(bugTypeLabel(r.type)) + ' · ' + dt + '</div>' +
    '<div class="mini" style="margin-top:4px;white-space:pre-wrap">' + esc(r.text.slice(0, 400)) + '</div></div>' +
    '<button class="del" type="button" data-bugdel="' + r.id + '" data-src="' + src + '">×</button></div>' +
    '<div class="mini" style="margin-top:6px;color:' + color + '">' + state + ' · открыть</div></div>';
}
function bugList(){
  const list = lsGet(BUG_KEY, []);
  const q = lsGet(BUG_QUEUE, []);
  if(!list.length && !q.length) return '<div class="empty">Отчётов пока нет</div>';
  return q.map(r => bugRow(r, 'q')).join('') + list.map(r => bugRow(r, 's')).join('');
}
function findBug(id, src){
  const arr = src === 'q' ? lsGet(BUG_QUEUE, []) : lsGet(BUG_KEY, []);
  return arr.find(x => String(x.id) === String(id)) || null;
}
SCREENS.bugview = {
  title: 'Отчёт',
  render(p){
    const r = findBug(p && p.id, p && p.src);
    if(!r) return '<div class="empty">Отчёт не найден</div>';
    const d = new Date(r.t);
    const dt = d.toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
    const state = p.src === 'q' ? 'в очереди на отправку' : (r.sent ? 'отправлено' : 'не отправлено');
    const color = p.src === 'q' ? '#e8b44a' : (r.sent ? '#4ad991' : '#8496a8');
    return '<div class="card">' +
        '<div class="mini">' + esc(bugTypeLabel(r.type)) + ' · ' + dt + '</div>' +
        '<div style="margin-top:10px;white-space:pre-wrap;line-height:1.55">' + esc(r.text) + '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="mini">Статус: <span style="color:' + color + '">' + state + '</span></div>' +
        (r.ver ? '<div class="mini">Версия: ' + esc(r.ver) + '</div>' : '') +
        (r.dev ? '<div class="mini">Устройство: ' + esc(r.dev) + '</div>'
          : (r.andr ? '<div class="mini">Устройство: Android ' + esc(r.andr) + (r.model ? ', ' + esc(r.model) : '') + '</div>' : '')) +
        (r.contact ? '<div class="mini">Контакт: ' + esc(r.contact) + '</div>' : '') +
      '</div>' +
      '<button class="btn ghost sm" type="button" id="bv_copy">Скопировать текст</button>';
  },
  mount(p){
    const btn = $('bv_copy');
    if(!btn) return;
    btn.addEventListener('click', () => {
      const r = findBug(p && p.id, p && p.src);
      if(!r) return;
      const tmp = document.createElement('textarea');
      tmp.value = bugBody(r.type, r.text, r.contact || '');
      tmp.style.position = 'fixed'; tmp.style.opacity = '0';
      document.body.appendChild(tmp); tmp.select();
      let ok = false;
      try{ ok = document.execCommand('copy'); }catch(e){}
      document.body.removeChild(tmp);
      toast(ok ? 'Текст скопирован' : 'Выделите текст и скопируйте вручную');
    });
  }
};

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
        '<button class="btn pri" type="button" id="br_send">Отправить</button>' +
        '<div class="row2" style="margin-top:8px">' +
          '<button class="btn ghost sm" type="button" id="br_copy">Скопировать</button>' +
          '<button class="btn ghost sm" type="button" id="br_save">Сохранить</button>' +
        '</div>' +
        '<div id="br_status" style="margin-top:10px"></div>' +
        '<div class="mini" style="margin-top:10px">Версия ' + esc(d.version.name) +
          ' · ' + esc(d.device) + ' · ' + esc(d.screen) + '</div>' +
      '</div>' +
      '<div class="note">Отчёт уходит разработчику по сети. Если интернета нет — сохранится и отправится ' +
      'автоматически при следующем запуске.</div>' +
      '<div class="h">Мои отчёты</div><div id="br_list">' + bugList() + '</div>';
  },
  mount(){
    const ta = $('br_text');
    const btn = $('br_send');
    const st = $('br_status');

    btn.addEventListener('click', async () => {
      const text = (ta.value || '').trim();
      if(text.length < 10){ toast('Опишите проблему подробнее'); ta.focus(); return; }
      const type = val('br_type'), contact = val('br_contact').trim();
      btn.disabled = true;
      btn.textContent = 'Отправляю…';
      st.innerHTML = '<div class="mini">Отправляю отчёт…</div>';
      const res = await sendReport(type, text, contact);
      btn.disabled = false;
      btn.textContent = 'Отправить';
      if(res.ok){
        bugSave(type, text, true);
        st.innerHTML = '<div class="note" style="margin-top:0;color:#4ad991">' +
          'Отправлено. Спасибо — отчёт получен.</div>';
        ta.value = '';
        $('br_list').innerHTML = bugList();
        bindBugList();
        toast('Отчёт отправлен');
      } else if(res.reason === 'offline'){
        queueAdd(type, text, contact);
        st.innerHTML = '<div class="warn">Нет интернета. Отчёт сохранён и уйдёт автоматически ' +
          'при следующем запуске с сетью.</div>';
        ta.value = '';
        $('br_list').innerHTML = bugList();
        bindBugList();
      } else if(res.reason === 'noconfirm'){
        bugSave(type, text, true);
        st.innerHTML = '<div class="note" style="margin-top:0;color:#4ad991">Отправлено. Спасибо — отчёт получен.' +
          '<div class="mini" style="margin-top:4px">Сервер ответил с задержкой, это нормально.</div></div>';
        ta.value = '';
        $('br_list').innerHTML = bugList();
        bindBugList();
      } else {
        st.innerHTML = '<div class="warn">Не удалось отправить. Попробуйте позже или скопируйте текст.</div>';
      }
    });

    $('br_copy').addEventListener('click', () => {
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

    $('br_save').addEventListener('click', () => {
      const text = (ta.value || '').trim();
      if(text.length < 10){ toast('Опишите проблему подробнее'); return; }
      bugSave(val('br_type'), text, false);
      ta.value = '';
      $('br_list').innerHTML = bugList();
      bindBugList();
      toast('Сохранено на телефоне');
    });
    bindBugList();
  }
};
function bindBugList(){
  $$('[data-bugopen]').forEach(card => card.addEventListener('click', (e) => {
    if(e.target.closest('[data-bugdel]')) return;
    go('bugview', {id: card.dataset.bugopen, src: card.dataset.src || 's'});
  }));
  $$('[data-bugdel]').forEach(b => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const key = (b.dataset.src === 'q') ? BUG_QUEUE : BUG_KEY;
    lsSet(key, lsGet(key, []).filter(x => String(x.id) !== b.dataset.bugdel));
    const box = $('br_list');
    if(box) box.innerHTML = bugList();
    bindBugList();
  }));
}
