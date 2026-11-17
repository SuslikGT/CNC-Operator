/* Обновления: репозиторий зашит в приложении, настраивать ничего не нужно */
window.__cb = window.__cb || {};
window.__nativeHttp = function(cbId, body){
  const fn = window.__cb[cbId];
  if(fn){ delete window.__cb[cbId]; fn(body || ''); }
};
window.UPDATE = null;

const UPD_REPO = 'SuslikGT/CNC-Operator';
const UPD_AUTO_KEY = 'upd.auto';
const UPD_LAST_KEY = 'upd.last';

function appVersion(){
  try{
    if(window.Native && Native.versionName){
      const n = Native.versionName();
      if(n) return {name: n, code: Native.versionCode()};
    }
  }catch(e){}
  return {name: '1.5', code: 6};
}
function httpGetText(url){
  return new Promise(resolve => {
    if(window.Native && Native.httpGet){
      const id = 'cb' + Date.now() + Math.floor(Math.random() * 10000);
      window.__cb[id] = resolve;
      try{ Native.httpGet(url, id); }catch(e){ delete window.__cb[id]; resolve(''); return; }
      setTimeout(() => {
        if(window.__cb[id]){ delete window.__cb[id]; resolve(''); }
      }, 12000);
    } else {
      fetch(url, {cache: 'no-store'})
        .then(r => r.text()).then(resolve)
        .catch(() => resolve(''));
    }
  });
}
function vparts(v){
  return String(v).replace(/^v/i, '').split(/[.\-+]/).map(x => parseInt(x, 10) || 0);
}
function isNewer(remote, local){
  const a = vparts(remote), b = vparts(local);
  for(let i = 0; i < Math.max(a.length, b.length); i++){
    const x = a[i] || 0, y = b[i] || 0;
    if(x > y) return true;
    if(x < y) return false;
  }
  return false;
}
function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function releaseUrl(){
  return 'https://api.github.com/repos/' + UPD_REPO + '/releases/latest';
}
function parseRelease(text){
  let j;
  try{ j = JSON.parse(text); }catch(e){ return {err: 'badjson'}; }
  if(j && j.message && !j.tag_name){
    return {err: 'norelease', message: String(j.message)};
  }
  if(!j || !j.tag_name && !j.name){
    return {err: 'norelease'};
  }
  const apk = (j.assets || []).filter(a => /\.apk$/i.test(a.name || ''));
  if(!apk.length){
    return {err: 'noapk', version: String(j.tag_name || j.name || '').replace(/^v/i, '')};
  }
  return {
    version: String(j.tag_name || j.name || '').replace(/^v/i, ''),
    url: apk[0].browser_download_url,
    notes: String(j.body || '').slice(0, 700),
    size: apk[0].size || 0,
    published: j.published_at || ''
  };
}
function renderStatus(html){ const st = $('up_status'); if(st) st.innerHTML = html; }

async function checkUpdates(silent){
  const cur = appVersion();
  if(!silent) renderStatus('<div class="mini">Проверяю обновления…</div>');
  const body = await httpGetText(releaseUrl());
  lsSet(UPD_LAST_KEY, Date.now());

  if(!body){
    if(!silent) renderStatus('<div class="warn">Нет соединения. Проверьте интернет — ' +
      'остальные разделы работают офлайн.</div>');
    return;
  }
  const rel = parseRelease(body);

  if(rel.err === 'norelease' || rel.err === 'noapk'){
    window.UPDATE = null;
    renderStatus('<div class="note" style="margin-top:0">Установлена версия <b>' + esc(cur.name) +
      '</b>. Опубликованных релизов пока нет — проверка повторится автоматически при следующем запуске.</div>');
    return;
  }
  if(rel.err){
    if(!silent) renderStatus('<div class="warn">Сервер обновлений ответил ошибкой. Попробуйте позже.</div>');
    return;
  }
  const avail = isNewer(rel.version, cur.name);
  window.UPDATE = avail ? rel : null;

  renderStatus(avail
    ? '<div class="upd-new"><div class="upd-v">Доступна версия ' + esc(rel.version) + '</div>' +
      (rel.notes ? '<div class="mini" style="margin-top:4px">' + esc(rel.notes).replace(/\n/g, '<br>') + '</div>' : '') +
      '<button class="btn pri" type="button" id="up_install" style="margin-top:10px">Скачать и установить</button></div>'
    : '<div class="note" style="margin-top:0">У вас последняя версия: <b>' + esc(cur.name) +
      '</b>.</div>');

  const ib = $('up_install');
  if(ib) ib.addEventListener('click', doInstall);
  if(avail && silent) toast('Доступно обновление ' + rel.version);
}

function doInstall(){
  const u = window.UPDATE;
  if(!u || !u.url){ toast('Нет ссылки на файл'); return; }
  if(window.Native && Native.installUpdate){
    try{
      if(Native.canInstall && !Native.canInstall()){
        toast('Разрешите установку приложений из этого источника');
      }
      Native.installUpdate(u.url, 'Версия ' + u.version);
    }catch(e){ toast('Ошибка запуска загрузки'); }
  } else {
    try{ window.open(u.url, '_blank'); }catch(e){ toast('Откройте ссылку вручную'); }
  }
}
function updateBanner(){
  const u = window.UPDATE;
  if(!u) return '';
  return '<button class="banner" data-go="updates" type="button">' +
    '<span class="banner-ic">↑</span>' +
    '<span><b>Доступно обновление ' + esc(u.version) + '</b>' +
    '<span class="banner-sub">Нажмите, чтобы установить</span></span></button>';
}

SCREENS.updates = {
  title: 'Обновления',
  render(){
    const cur = appVersion();
    const auto = lsGet(UPD_AUTO_KEY, true);
    const can = (window.Native && Native.canInstall) ? Native.canInstall() : true;
    const last = lsGet(UPD_LAST_KEY, 0);
    const lastTxt = last ? new Date(last).toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : '—';
    return '<div class="card">' +
        '<div class="kv"><span class="k">Установленная версия</span><span class="v">' + esc(cur.name) + '</span></div>' +
        '<div class="kv"><span class="k">Последняя проверка</span><span class="v">' + lastTxt + '</span></div>' +
      '</div>' +
      '<div class="card">' +
        '<label class="switchrow"><span>Проверять при запуске</span>' +
          '<span class="switch"><input type="checkbox" id="up_auto"' + (auto ? ' checked' : '') + '><i></i></span></label>' +
        '<button class="btn pri" type="button" id="up_check">Проверить обновления</button>' +
        '<div id="up_status" style="margin-top:10px"></div>' +
      '</div>' +
      '<div class="note">Обновления проверяются автоматически при запуске. ' +
      'Если выйдет новая версия, приложение предложит её установить.</div>' +
      (can ? '' : '<div class="warn">Разрешите установку приложений из этого источника в настройках телефона, ' +
        'иначе обновление не установится.</div>');
  },
  mount(){
    const au = $('up_auto');
    if(au) au.addEventListener('change', () => lsSet(UPD_AUTO_KEY, au.checked));
    const btn = $('up_check');
    if(btn) btn.addEventListener('click', () => checkUpdates(false));
    if(window.UPDATE){
      renderStatus('<div class="upd-new"><div class="upd-v">Доступна версия ' + esc(window.UPDATE.version) +
        '</div><button class="btn pri" type="button" id="up_install" style="margin-top:10px">Скачать и установить</button></div>');
      const ib = $('up_install');
      if(ib) ib.addEventListener('click', doInstall);
    } else {
      renderStatus('<div class="mini">Нажмите «Проверить обновления» или подождите автопроверки.</div>');
    }
  }
};
window.updatesInit = function(){
  if(!lsGet(UPD_AUTO_KEY, true)) return;
  setTimeout(() => { checkUpdates(true); }, 1200);
};
