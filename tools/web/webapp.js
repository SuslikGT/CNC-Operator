/* Доработки для веб-версии: офлайн-кэш и раздел «Обновления» без APK */
(function(){
  const native = !!(window.Native && window.Native.versionName);

  const secure = location.protocol === 'https:' ||
    location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if(!native && 'serviceWorker' in navigator && secure){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  if(native) return;

  /* На веб-версии обновления приходят вместе со страницей, проверять APK не нужно */
  window.updatesInit = function(){};

  /* На главной веб-версии пункт «Обновления» не нужен */
  if(typeof TILES !== 'undefined' && TILES.splice){
    for(let i = TILES.length - 1; i >= 0; i--){
      if(TILES[i].id === 'updates') TILES.splice(i, 1);
    }
  }

  const ver = (typeof appVersion === 'function') ? appVersion().name : '—';
  SCREENS.updates = {
    title: 'Обновления',
    render(){
      return '<div class="card">' +
          '<div class="kv"><span class="k">Версия</span><span class="v">' + esc(ver) + '</span></div>' +
          '<div class="kv"><span class="k">Режим</span><span class="v">веб-версия (PWA)</span></div>' +
        '</div>' +
        '<div class="card"><ul class="list">' +
          '<li>Веб-версия обновляется сама: при открытии с интернетом подгружается свежий код.</li>' +
          '<li>Для установки на iPhone: Safari → «Поделиться» → «На экран Домой».</li>' +
          '<li>На Android: меню браузера → «Установить приложение».</li>' +
          '<li>Без интернета приложение продолжает работать — данные уже сохранены в телефоне.</li>' +
        '</ul>' +
        '<button class="btn pri" type="button" id="web_reload">Обновить страницу</button></div>' +
        ((typeof CHANGELOG !== 'undefined') ?
          '<div class="h">История обновлений</div>' +
          CHANGELOG.map(r => '<div class="card"><div style="display:flex;justify-content:space-between;gap:10px">' +
            '<div style="font-weight:600">Версия ' + esc(r[0]) + '</div>' +
            '<div class="mini" style="white-space:nowrap">' + esc(r[1]) + '</div></div>' +
            '<div class="mini" style="margin-top:4px">' + esc(r[2]) + '</div></div>').join('') : '') +
        '<div class="note">Версия для Android с установщиком APK распространяется в разделе Releases репозитория.</div>';
    },
    mount(){
      const b = $('web_reload');
      if(b) b.addEventListener('click', () => {
        if('serviceWorker' in navigator && navigator.serviceWorker.controller){
          navigator.serviceWorker.getRegistrations()
            .then(rs => Promise.all(rs.map(r => r.unregister())))
            .then(() => caches.keys())
            .then(keys => Promise.all(keys.map(k => caches.delete(k))))
            .then(() => location.reload())
            .catch(() => location.reload());
        } else {
          location.reload();
        }
      });
    }
  };
})();
