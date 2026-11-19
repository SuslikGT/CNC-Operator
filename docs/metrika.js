/* Анонимная статистика Яндекс.Метрики. 0 = выключена */
(function(){
  var ID = 114374282;
  if(!ID) return;
  if(!/^https?:$/.test(location.protocol)) return;

  (function(m, e, t, r, i, k, a){
    m[i] = m[i] || function(){
      (m[i].a = m[i].a || []).push(arguments);
    };
    m[i].l = 1 * new Date();
    for(var j = 0; j < document.scripts.length; j++){
      if(document.scripts[j].src === r) return;
    }
    k = e.createElement(t);
    a = e.getElementsByTagName(t)[0];
    k.async = 1;
    k.src = r;
    a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=' + ID, 'ym');

  try{
    ym(ID, 'init', {
      ssr: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true
    });
    ym(ID, 'params', {
      ver: (typeof appVersion === 'function') ? appVersion().name : '',
      plat: (window.Native && window.Native.versionName) ? 'android' : 'web',
      mach: (typeof curMachine === 'function') ? curMachine().short : ''
    });
  }catch(e){}
})();
