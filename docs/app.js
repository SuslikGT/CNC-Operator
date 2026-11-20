/* Ядро: роутер, хранилище, помощники */
const SCREENS = {};
window.SCREENS = SCREENS;
const APP_VERSION = '2.0.33';
const APP_VERSION_CODE = 40;
const $ = id => document.getElementById(id);
const $$ = sel => Array.prototype.slice.call(document.querySelectorAll(sel));

function num(id, def){
  const el = $(id); if(!el) return def === undefined ? NaN : def;
  const v = String(el.value).replace(',', '.').replace(/\s/g, '');
  const n = parseFloat(v);
  return isFinite(n) ? n : (def === undefined ? NaN : def);
}
function val(id){ const el = $(id); return el ? el.value : ''; }
function fmt(v, d){
  if(!isFinite(v)) return '—';
  const s = (d === undefined ? 2 : d) === 0 ? Math.round(v).toString() : v.toFixed(d === undefined ? 2 : d);
  return s.replace('.', ',');
}
function fmt0(v){ if(!isFinite(v)) return '—'; return Math.round(v).toString(); }

/* ---------- хранилище ---------- */
function lsGet(k, def){
  try{ const r = localStorage.getItem(k); return r === null ? def : JSON.parse(r); }
  catch(e){ return def; }
}
function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }

let toastT = null;
function toast(msg){
  let d = $('toast');
  if(!d){ d = document.createElement('div'); d.id = 'toast'; d.className = 'toast'; document.body.appendChild(d); }
  d.textContent = msg; d.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(()=>d.classList.remove('on'), 1800);
}

/* ---------- разметка ---------- */
function fld(id, label, value, unit, extra){
  extra = extra || {};
  const u = unit ? '<i>' + unit + '</i>' : '';
  return '<label class="f"><span>' + label + '</span><div class="iw' + (unit ? ' has-u' : '') + '">' +
    '<input class="inp" id="' + id + '" type="text" inputmode="' + (extra.text ? 'text' : 'decimal') +
    '" autocomplete="off" value="' + (value === undefined ? '' : value) + '"' +
    (extra.ph ? ' placeholder="' + extra.ph + '"' : '') + '>' + u + '</div></label>';
}
function selFld(id, label, items, value){
  let o = '<option value="">—</option>';
  items.forEach(it => {
    const v = Array.isArray(it) ? it[0] : it.value;
    const t = Array.isArray(it) ? it[1] : it.text;
    o += '<option value="' + v + '"' + (String(v) === String(value) ? ' selected' : '') + '>' + t + '</option>';
  });
  return '<label class="f"><span>' + label + '</span><div class="iw"><select class="inp" id="' + id + '">' + o + '</select></div></label>';
}
function rbox(k, v, unit, cls){
  return '<div class="rbox ' + (cls || '') + '"><div class="k">' + k + '</div><div class="v">' + v +
    (unit ? '<small>' + unit + '</small>' : '') + '</div></div>';
}
function table(head, rows, cls){
  let h = '<div class="tw"><table>';
  if(head){ h += '<tr>' + head.map((x, i) => '<th' + (i ? ' class="n"' : '') + '>' + x + '</th>').join('') + '</tr>'; }
  rows.forEach(r => {
    h += '<tr>' + r.map((x, i) => '<td' + (i ? ' class="n"' : '') + '>' + x + '</td>').join('') + '</tr>';
  });
  return h + '</table></div>';
}

/* ---------- сворачиваемые блоки ---------- */
function collapseKey(id){ return 'ui.collapse.' + id; }
function setCollapse(id, open, head){
  const body = $(id);
  if(!body) return;
  const h = head || document.querySelector('[data-collapse="' + id + '"]');
  body.classList.toggle('open', open);
  if(h){
    h.classList.toggle('open', open);
    h.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if(open){
    body.style.maxHeight = body.scrollHeight + 'px';
    setTimeout(() => { if(body.classList.contains('open')) body.style.maxHeight = 'none'; }, 360);
  } else {
    if(getComputedStyle(body).maxHeight === 'none') body.style.maxHeight = body.scrollHeight + 'px';
    requestAnimationFrame(() => { body.style.maxHeight = '0px'; });
  }
  lsSet(collapseKey(id), open);
}
function restoreCollapse(){
  $$('[data-collapse]').forEach(h => {
    const id = h.dataset.collapse;
    if(lsGet(collapseKey(id), false)) setCollapse(id, true, h);
  });
}

/* ---------- навигация ---------- */
let stack = [];
let navDir = 'home';
function go(id, p){ stack.push({id:id, p:p}); navDir = 'right'; paint(); }
function homeNav(){ stack = []; navDir = 'home'; paint(); }
function backNav(){
  if(stack.length <= 1){ homeNav(); return; }
  stack.pop(); navDir = 'left'; paint();
}
window.go = go;

function animateResults(root){
  if(!root || !root.querySelectorAll) return;
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = root.querySelectorAll('.rbox .v');
  Array.prototype.forEach.call(els, el => {
    const small = el.querySelector('small');
    const txt = el.textContent.replace(/\u00a0/g, ' ').trim();
    if(!/^-?[\d\s]*(?:[.,]\d+)?$/.test(txt)) return;
    const m = txt.match(/^(-?[\d\s]*(?:[.,]\d+)?)/);
    if(!m || !m[1] || !/\d/.test(m[1])) return;
    const target = parseFloat(m[1].replace(/\s/g, '').replace(',', '.'));
    if(!isFinite(target) || Math.abs(target) < 0.05) return;
    const dec = (m[1].split(',')[1] || '').length;
    const unit = small ? small.outerHTML : '';
    const t0 = performance.now(), dur = 460;
    const step = t => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.innerHTML = fmt(target * e, dec) + unit;
      if(k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function paint(){
  const cur = stack[stack.length - 1];
  const bar = $('topbar');
  const inSection = stack.length > 0;
  $('back').hidden = !inSection;
  $('home').hidden = !inSection;
  const view = $('view');
  view.dataset.nav = 'none';
  void view.offsetWidth;
  view.dataset.nav = navDir;
  window.scrollTo(0, 0);
  if(!cur){
    bar.querySelector('.ttl').textContent = 'ЧПУ · Оператор';
    view.innerHTML = homeHTML();
    return;
  }
  const sc = SCREENS[cur.id];
  if(!sc){ view.innerHTML = '<div class="empty">Раздел не найден</div>'; return; }
  bar.querySelector('.ttl').textContent = sc.title;
  view.innerHTML = sc.render(cur.p);
  restoreInputs(cur.id);
  if(sc.mount) sc.mount(cur.p);
  restoreCollapse();
  requestAnimationFrame(() => animateResults(view));
}

/* ---------- домашний экран ---------- */
const ICONS = {
  gauge:'<svg viewBox="0 0 24 24"><path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4.2-5"/><circle cx="12" cy="18" r="1.4"/></svg>',
  clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  shape:'<svg viewBox="0 0 24 24"><path d="M12 3l9 17H3z"/><path d="M8.5 15h7"/></svg>',
  thread:'<svg viewBox="0 0 24 24"><path d="M8 21l3-18"/><path d="M11 5h5M10 9h5M9 13h5M8 17h5"/></svg>',
  wave:'<svg viewBox="0 0 24 24"><path d="M2 12h3l2.5-7 3.5 14 3-9 2 2H22"/></svg>',
  ruler:'<svg viewBox="0 0 24 24"><rect x="2.5" y="8.5" width="19" height="7" rx="1.5"/><path d="M7 8.5v3M10.5 8.5v4M14 8.5v3M17.5 8.5v4"/></svg>',
  swap:'<svg viewBox="0 0 24 24"><path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/></svg>',
  diamond:'<svg viewBox="0 0 24 24"><path d="M12 3l7.5 9-7.5 9-7.5-9z"/><path d="M8 12h8"/></svg>',
  holder:'<svg viewBox="0 0 24 24"><path d="M3 9h10l6 3-6 3H3z"/><path d="M3 9v6"/></svg>',
  drill:'<svg viewBox="0 0 24 24"><path d="M12 3v9"/><path d="M8.5 12h7l-3.5 9z"/><path d="M10 15h4"/></svg>',
  layers:'<svg viewBox="0 0 24 24"><path d="M12 3l8 4.5-8 4.5-8-4.5z"/><path d="M4 12.5L12 17l8-4.5"/><path d="M4 16.5L12 21l8-4.5"/></svg>',
  chip:'<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2.5"/><path d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3"/></svg>',
  target:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.4"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/></svg>',
  stack:'<svg viewBox="0 0 24 24"><path d="M4 20V11M9.4 20V4M14.7 20v-6M20 20V8"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="M4 12.5l5.2 5.2L20 6.5"/></svg>',
  book:'<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5z"/><path d="M8 7.5h8M8 11h6"/></svg>',
  history:'<svg viewBox="0 0 24 24"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4.5V10h5.4"/><path d="M12 8v4.3l3 1.8"/></svg>',
  machine:'<svg viewBox="0 0 24 24"><rect x="2.5" y="8" width="19" height="10" rx="2"/><circle cx="8.5" cy="13" r="2.6"/><path d="M14 11h4.5M14 15h4.5"/></svg>',
  code:'<svg viewBox="0 0 24 24"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/></svg>',
  link:'<svg viewBox="0 0 24 24"><path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5"/><path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 19.2l1.5-1.5"/></svg>',
  download:'<svg viewBox="0 0 24 24"><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>',
  user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>'
};
const TILES = [
  {id:'speed',  ic:'gauge',   c:'#ffb454', g:'Расчёты', t:'Режимы резания', s:'обороты, подача, мощность'},
  {id:'time',   ic:'clock',   c:'#5ec8ff', g:'Расчёты', t:'Время и стоимость', s:'машинное время, цена'},
  {id:'geo',    ic:'shape',   c:'#4ad991', g:'Расчёты', t:'Геометрия и вес', s:'фаска, конус, масса'},
  {id:'thread', ic:'thread',  c:'#c78bd8', g:'Расчёты', t:'Резьба и отверстия', s:'метрика, трубная, UNC'},
  {id:'rough',  ic:'wave',    c:'#ffc75f', g:'Расчёты', t:'Шероховатость', s:'Ra ↔ подача, допуски'},
  {id:'toler',  ic:'ruler',   c:'#9b8cff', g:'Расчёты', t:'Допуски и посадки', s:'14h14 или 40-0,2-0,45'},
  {id:'contour',ic:'shape',   c:'#5ec8ff', g:'Расчёты', t:'Контур детали', s:'точки → программа'},
  {id:'insert', ic:'diamond', c:'#a9b8c8', g:'Инструмент', t:'Пластины ISO', s:'CNMG 120408 — разбор'},
  {id:'holder', ic:'holder',  c:'#a9b8c8', g:'Инструмент', t:'Державки', s:'MCLNR 2525 M12'},
  {id:'drill',  ic:'drill',   c:'#a9b8c8', g:'Инструмент', t:'Свёрла, метчики, фрезы', s:'обозначения'},
  {id:'wear',   ic:'stack',   c:'#4ad991', g:'Инструмент', t:'Стойкость', s:'учёт наработки'},
  {id:'machine',ic:'machine', c:'#5ec8ff', g:'Станок и ЧПУ', t:'Станок T65M II/750', s:'узлы, функции, приёмы'},
  {id:'siemens',ic:'chip',    c:'#5ec8ff', g:'Станок и ЧПУ', t:'Sinumerik', s:'циклы, G-код, шаблон'},
  {id:'cmds',   ic:'code',    c:'#5ec8ff', g:'Станок и ЧПУ', t:'Команды Sinumerik', s:'G, M, программирование'},
  {id:'corr',   ic:'target',  c:'#ff6b73', g:'Станок и ЧПУ', t:'Корректоры', s:'пересчёт по промеру'},
  {id:'metals', ic:'layers',  c:'#e09a63', g:'Справочники', t:'Марки сталей', s:'30ХГСА и другие'},
  {id:'refs',   ic:'book',    c:'#a9b8c8', g:'Справочники', t:'Шпаргалки', s:'крепёж, конусы, HB'},
  {id:'sources',ic:'link',    c:'#a9b8c8', g:'Справочники', t:'Источники', s:'ссылки и стандарты'},
  {id:'check',  ic:'check',   c:'#4ad991', g:'Сервис', t:'Чек-лист', s:'перед запуском'},
  {id:'hist',   ic:'history', c:'#a9b8c8', g:'Сервис', t:'История', s:'сохранённые расчёты'},
  {id:'updates',ic:'download', c:'#5ec8ff', g:'Сервис', t:'Обновления', s:'проверка версии'},
  {id:'about',  ic:'user',    c:'#ffb454', g:'Сервис', t:'О приложении', s:'автор SuslikGT'}
];
const TILE_GROUPS = ['Расчёты', 'Инструмент', 'Станок и ЧПУ', 'Справочники', 'Сервис'];
function cncInfo(){
  const m = (typeof curMachine === 'function') ? curMachine() : null;
  const id = (m && m.cncId) || 'siemens';
  return (D.cnc && D.cnc[id]) ? D.cnc[id] : {id:'siemens', name:'SINUMERIK 828D', short:'Sinumerik'};
}
function tint(hex, a){
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}
function homeHTML(){
  const mach = (typeof curMachine === 'function') ? curMachine() : {name:'T65M II/750', short:'T65M II/750', kind:'Токарный центр'};
  const cnc = cncInfo();
  let out = '<div class="hero">' +
    '<div class="kick">' + cnc.name + ' · ' + mach.kind + '</div>' +
    '<h1>ЧПУ Оператор</h1>' +
    '<p>' + mach.name + ' — расчёты, справочники и наладка офлайн</p>' +
    '<div class="acts">' +
      '<button data-go="speed">Режимы</button>' +
      '<button data-go="corr">Корректоры</button>' +
      '<button data-go="machine">Станок</button>' +
      '<button data-go="cmds">Команды</button>' +
    '</div></div>';
  if(typeof updateBanner === 'function') out += updateBanner();
  const hidden = mach.grind ? ['thread', 'insert', 'holder', 'drill', 'contour'] : [];
  TILE_GROUPS.forEach(g => {
    const list = TILES.filter(t => (t.g || 'Сервис') === g && hidden.indexOf(t.id) < 0);
    if(!list.length) return;
    out += '<div class="h">' + g + '</div><div class="grid">';
    list.forEach(t => {
      let title = t.t, sub = t.s;
      if(t.id === 'machine'){ title = mach.short; sub = mach.kind + ' · ' + cnc.short; }
      else if(t.id === 'speed' && mach.grind){ title = 'Режимы шлифования'; sub = 'круг, обороты, подача'; }
      else if(t.id === 'siemens'){ title = cnc.name; sub = 'циклы, G-код, шаблон'; }
      else if(t.id === 'cmds'){ title = 'Команды ' + cnc.short; sub = 'G, M, программирование'; }
      const lb = mach.labels && mach.labels[t.id];
      if(lb){ title = lb[0] || lb.t || title; sub = lb[1] || lb.s || sub; }
      out += '<button class="tile" data-go="' + t.id + '">' +
        '<span class="ic" style="color:' + t.c + ';background:' + tint(t.c, .13) +
          ';border-color:' + tint(t.c, .26) + '">' + (ICONS[t.ic] || '') + '</span>' +
        '<span><span class="cap">' + title + '</span><span class="sub">' + sub + '</span></span></button>';
    });
    out += '</div>';
  });
  out += '<div class="note" style="margin-top:18px">Расчёты и таблицы — справочные. ' +
    'Перед запуском сверяйтесь с документацией станка и каталогом инструмента.</div>';
  const ver = (typeof appVersion === 'function') ? appVersion().name : '1.1';
  out += '<div class="footer"><span>© 2026 <b data-egg="1" style="color:#e3edf6">SuslikGT</b> · v' + ver + '</span>' +
    '<button class="linkbtn" data-go="about" type="button">О приложении</button></div>';
  return out;
}

/* ---------- сохранение введённых значений ---------- */
function keyFor(screen, id){ return 'inp.' + screen + '.' + id; }
function restoreInputs(screen){
  $$('#view input[id], #view select[id]').forEach(el => {
    if(el.dataset.nosave) return;
    const v = lsGet(keyFor(screen, el.id), null);
    if(v !== null && v !== '') el.value = v;
  });
}
function bindInputs(){
  const view = $('view');
  const save = el => {
    const cur = stack[stack.length - 1];
    if(!cur || !el.id) return;
    if(el.closest('.search')) return;
    lsSet(keyFor(cur.id, el.id), el.value);
  };
  view.addEventListener('input', e => {
    const el = e.target;
    if(el.id && (el.tagName === 'INPUT' || el.tagName === 'SELECT')) save(el);
  });
  view.addEventListener('change', e => {
    const el = e.target;
    if(el.id && el.tagName === 'SELECT') save(el);
  });
}

/* ---------- история расчётов ---------- */
function saveCalc(title, rows){
  const h = lsGet('hist', []);
  h.unshift({t: Date.now(), title: title, rows: rows});
  lsSet('hist', h.slice(0, 120));
  toast('Расчёт сохранён в историю');
}
function clearHist(){ lsSet('hist', []); }

/* ---------- старт ---------- */
function start(){
  $('back').addEventListener('click', backNav);
  $('home').addEventListener('click', homeNav);
  const mb = $('mach');
  if(mb) mb.addEventListener('click', () => go('machines'));
  bindInputs();
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-go]');
    if(b){ go(b.dataset.go); return; }
    const act = e.target.closest('[data-act]');
    if(act && window.ACT && ACT[act.dataset.act]){ ACT[act.dataset.act](act); }
  });
  document.addEventListener('click', e => {
    const h = e.target.closest('[data-collapse]');
    if(!h) return;
    const body = $(h.dataset.collapse);
    setCollapse(h.dataset.collapse, !(body && body.classList.contains('open')), h);
  });
  document.addEventListener('click', e => {
    const el = e.target.closest('input,select,textarea');
    if(el) setTimeout(() => { try{ el.scrollIntoView({block:'center', behavior:'smooth'}); }catch(_){} }, 120);
  });
  homeNav();
  if(typeof window.updatesInit === 'function') window.updatesInit();
  if(typeof window.bugQueueInit === 'function') window.bugQueueInit();
}
window.appBack = function(){
  if(stack.length > 0){ backNav(); return true; }
  return false;
};
window.start = start;
const ACT = {};
window.ACT = ACT;
