/* Обновления: проверка версии, скачивание APK, GitHub Releases / Obtainium */
window.__cb = window.__cb || {};
window.__nativeHttp = function(cbId, body){
  const fn = window.__cb[cbId];
  if(fn){ delete window.__cb[cbId]; fn(body || ''); }
};
window.UPDATE = null;

const UPD_URL_KEY = 'upd.url';
const UPD_AUTO_KEY = 'upd.auto';
const UPD_DEFAULT = 'SuslikGT/CNC-Operator';

function appVersion(){
  try{
    if(window.Native && Native.versionName){
      const n = Native.versionName();
      if(n) return {name: n, code: Native.versionCode()};
    }
  }catch(e){}
  return {name: '1.1', code: 2};
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
function updSourceUrl(raw){
  let s = String(raw || '').trim();
  if(!s) return '';
  if(/^https?:\/\//i.test(s)) return s;
  if(/^[\w.\-]+\/[\w.\-]+$/.test(s)) return 'https://api.github.com/repos/' + s + '/releases/latest';
  return '';
}
function parseUpdate(text, src){
  let j;
  try{ j = JSON.parse(text); }catch(e){ return null; }
  if(j && j.assets && j.assets.length){
    const apk = j.assets.filter(a => /\.apk$/i.test(a.name || ''));
    if(!apk.length) return null;
    const a = apk[0];
    return {
      version: String(j.tag_name || j.name || '').replace(/^v/i, ''),
      url: a.browser_download_url,
      notes: String(j.body || '').slice(0, 600),
      size: a.size
    };
  }
  if(j && (j.version || j.versionName) && (j.url || j.apk)){
    return {
      version: String(j.version || j.versionName),
      url: String(j.url || j.apk),
      notes: String(j.notes || j.changelog || '').slice(0, 600),
      size: j.size || 0
    };
  }
  return null;
}

async function checkUpdates(silent){
  const src = updSourceUrl(lsGet(UPD_URL_KEY, UPD_DEFAULT));
  const st = $('up_status');
  const cur = appVersion();
  if(!src){
    if(st) st.innerHTML = '<div class="warn">Адрес не задан: укажите ссылку на JSON или <b>пользователь/репозиторий</b> GitHub.</div>';
    return;
  }
  if(st && !silent) st.innerHTML = '<div class="mini">Проверяю…</div>';
  const body = await httpGetText(src);
  if(!body){
    if(st) st.innerHTML = '<div class="warn">Не удалось получить данные. Проверьте интернет и адрес источника.</div>';
    return;
  }
  const rel = parseUpdate(body, src);
  if(!rel || !rel.url){
    if(st) st.innerHTML = '<div class="warn">Ответ получен, но разобрать его не удалось. Нужен релиз GitHub с APK или JSON вида <b>{"version":"1.2","url":"…apk"}</b>.</div>';
    return;
  }
  const avail = isNewer(rel.version, cur.name);
  window.UPDATE = avail ? rel : null;
  if(st){
    st.innerHTML = avail
      ? '<div class="upd-new"><div class="upd-v">Доступна версия ' + esc(rel.version) + '</div>' +
        (rel.notes ? '<div class="mini" style="margin-top:4px">' + esc(rel.notes).replace(/\n/g, '<br>') + '</div>' : '') +
        '<button class="btn pri" type="button" id="up_install" style="margin-top:10px">Скачать и установить</button></div>'
      : '<div class="note" style="margin-top:0">Установлена последняя версия: <b>' + esc(cur.name) + '</b></div>';
    const ib = $('up_install');
    if(ib) ib.addEventListener('click', doInstall);
  }
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
    const url = lsGet(UPD_URL_KEY, UPD_DEFAULT);
    const auto = lsGet(UPD_AUTO_KEY, true);
    const can = (window.Native && Native.canInstall) ? Native.canInstall() : true;
    return '<div class="card">' +
        '<div class="kv"><span class="k">Установленная версия</span><span class="v">' + esc(cur.name) + '</span></div>' +
        '<div class="kv"><span class="k">Сборка</span><span class="v">' + esc(cur.code) + '</span></div>' +
        '<div class="kv"><span class="k">Установка из источника</span><span class="v">' +
          (can ? 'разрешена' : 'запрещена — включите в настройках') + '</span></div>' +
      '</div>' +
      '<div class="h">Источник обновлений</div>' +
      '<div class="card">' +
        fld('up_url', 'Ссылка на JSON или GitHub «пользователь/репозиторий»', url,
          '', {ph: 'ivan/cnc-operator', text: true}) +
        '<label class="switchrow"><span>Проверять при запуске</span>' +
          '<span class="switch"><input type="checkbox" id="up_auto"' + (auto ? ' checked' : '') + '><i></i></span></label>' +
        '<button class="btn pri" type="button" id="up_check">Проверить обновления</button>' +
        '<div id="up_status" style="margin-top:10px"></div>' +
      '</div>' +
      '<div class="h">Как это настроить</div>' +
      '<div class="card"><ul class="list">' +
        '<li><b>GitHub (рекомендуется)</b>: создайте публичный репозиторий, затем Releases → New release, ' +
        'тег <b>v1.2</b> и прикрепите файл <b>app-release.apk</b>. В поле выше впишите «логин/репозиторий».</li>' +
        '<li><b>Свой JSON</b>: разместите файл и рядом APK, укажите ссылку на JSON.</li>' +
        '<li><b>Obtainium</b>: установите его и добавьте ссылку на страницу релизов репозитория — ' +
        'он сам будет проверять обновления и предлагать установку.</li>' +
        '<li>После публикации нажмите «Проверить обновления» — приложение скачает APK и откроет установщик.</li>' +
      '</ul>' +
      '<pre class="code">{\n  "version": "1.2",\n  "url": "https://example.com/cnc-1.2.apk",\n' +
      '  "notes": "Добавлен расчёт ..."\n}</pre>' +
      '</div>' +
      '<div class="warn">Приложение работает офлайн: сеть используется только для этой проверки. ' +
      'Установку система всегда подтверждает вручную — обойти это без MDM нельзя.</div>';
  },
  mount(){
    const inp = $('up_url');
    if(inp){
      inp.setAttribute('data-nosave', '1');
      inp.addEventListener('change', () => {
        lsSet(UPD_URL_KEY, inp.value.trim());
        toast('Источник сохранён');
      });
      inp.addEventListener('blur', () => lsSet(UPD_URL_KEY, inp.value.trim()));
    }
    const au = $('up_auto');
    if(au) au.addEventListener('change', () => lsSet(UPD_AUTO_KEY, au.checked));
    const btn = $('up_check');
    if(btn) btn.addEventListener('click', () => {
      lsSet(UPD_URL_KEY, val('up_url').trim());
      checkUpdates(false);
    });
    if(window.UPDATE){
      const st = $('up_status');
      if(st) st.innerHTML = '<div class="upd-new"><div class="upd-v">Доступна версия ' + esc(window.UPDATE.version) +
        '</div><button class="btn pri" type="button" id="up_install" style="margin-top:10px">Скачать и установить</button></div>';
      const ib = $('up_install');
      if(ib) ib.addEventListener('click', doInstall);
    }
  }
};
window.updatesInit = function(){
  if(lsGet(UPD_AUTO_KEY, true)) setTimeout(() => checkUpdates(true), 1200);
};
