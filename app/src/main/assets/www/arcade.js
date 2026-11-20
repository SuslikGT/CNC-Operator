/* Пасхалка: мини-игры (открывается 4 тапами по имени автора) */
const ARC_KEY = 'arcade.best';
let ARC = {game: null, raf: 0, timer: 0, snake: null, pos: 0, dir: 1};

const ARC_DIFF_NAMES = {easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный'};
function arcDiff(){
  const d = lsGet('arcade.diff', 'medium');
  return ARC_DIFF_NAMES[d] ? d : 'medium';
}
function arcDiffSet(d){ if(ARC_DIFF_NAMES[d]) lsSet('arcade.diff', d); }
function arcBestOf(game){
  const b = arcBest();
  const v = b[game + '|' + arcDiff()];
  return (v !== undefined) ? v : b[game];
}
function arcDiffSeg(){
  return seg('arc_diff', [['easy', 'Лёгкий'], ['medium', 'Средний'], ['hard', 'Сложный']], arcDiff(), 'wrap');
}

function arcBest(){
  return lsGet(ARC_KEY, {});
}
function arcSaveBest(game, value, better){
  const b = arcBest();
  if(b[game] === undefined || better(value, b[game])){
    b[game] = value;
    lsSet(ARC_KEY, b);
  }
}
function arcHalt(){
  if(ARC.raf) cancelAnimationFrame(ARC.raf);
  if(ARC.timer) clearInterval(ARC.timer);
  if(typeof MT !== 'undefined' && MT.raf){ cancelAnimationFrame(MT.raf); MT.raf = 0; }
  (ARC.timers || []).forEach(t => clearTimeout(t));
  ARC.timers = [];
  ARC.raf = 0;
  ARC.timer = 0;
}
function arcStop(){
  arcHalt();
  if(ARC.onVis){ document.removeEventListener('visibilitychange', ARC.onVis); ARC.onVis = null; }
  ARC.snake = null;
  ARC.game = null;
}
function arcExit(){ arcStop(); paint(); }

SCREENS.arcade = {
  title: 'Мастерская',
  render(){
    const b = arcBest();
    if(!ARC.game){
      return '<div class="card"><div class="kick">скрытый раздел</div>' +
          '<div style="font-size:18px;font-weight:700;margin-top:4px">Мастерская</div>' +
          '<div class="mini" style="margin-top:6px">Три короткие игры для перерыва между деталями.</div></div>' +
        '<div class="cap" style="margin-top:12px">Сложность</div>' + arcDiffSeg() +
        '<div class="mini" style="margin:4px 2px 12px">Лёгкий — шире допуск, медленнее темп. ' +
        'Сложный — узкий допуск, быстрее, меньше попыток. Рекорды считаются отдельно для каждого уровня.</div>' +
        '<button class="tile" type="button" data-arc="pass" style="width:100%">' +
          '<span class="ic" style="color:#ffb454;background:rgba(255,180,84,.13);border-color:rgba(255,180,84,.26)">' +
          '<svg viewBox="0 0 24 24"><path d="M3 16h18"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-5"/></svg></span>' +
          '<span><span class="cap">Точный проход</span><span class="sub">останови бегунок в допуске' +
          (arcBestOf('pass') !== undefined ? ' · лучший ' + fmt(arcBestOf('pass'), 1) + ' %' : '') + '</span></span></button>' +
        '<button class="tile" type="button" data-arc="rpm" style="width:100%;margin-top:10px">' +
          '<span class="ic" style="color:#5ec8ff;background:rgba(94,200,255,.13);border-color:rgba(94,200,255,.26)">' +
          '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 12l4-4"/></svg></span>' +
          '<span><span class="cap">Обороты вслепую</span><span class="sub">угадай число оборотов' +
          (arcBestOf('rpm') !== undefined ? ' · лучший ' + fmt0(arcBestOf('rpm')) + ' поп.' : '') + '</span></span></button>' +
        '<button class="tile" type="button" data-arc="snake" style="width:100%;margin-top:10px">' +
          '<span class="ic" style="color:#4ad991;background:rgba(74,217,145,.13);border-color:rgba(74,217,145,.26)">' +
          '<svg viewBox="0 0 24 24"><path d="M4 16c3 0 3-4 6-4s3 4 6 4 4-2 4-6"/><circle cx="5" cy="16" r="1.6"/></svg></span>' +
          '<span><span class="cap">Стружка</span><span class="sub">собирай стружку, не врезайся' +
          (arcBestOf('snake') !== undefined ? ' · лучший ' + fmt0(arcBestOf('snake')) : '') + '</span></span></button>' +
        '<button class="tile" type="button" data-arc="match" style="width:100%;margin-top:10px">' +
          '<span class="ic" style="color:#c78bd8;background:rgba(199,139,216,.13);border-color:rgba(199,139,216,.26)">' +
          '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1.4"/><rect x="14" y="4" width="6" height="6" rx="1.4"/><rect x="4" y="14" width="6" height="6" rx="1.4"/><rect x="14" y="14" width="6" height="6" rx="1.4"/></svg></span>' +
          '<span><span class="cap">Детали</span><span class="sub">три в ряд из деталей' +
          (arcBestOf('match') !== undefined ? ' · лучший ' + fmt0(arcBestOf('match')) : '') + '</span></span></button>';
    }
    if(ARC.game === 'pass'){
      const pz = arcDiff() === 'easy' ? 24 : arcDiff() === 'hard' ? 5 : 12;
      return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center">' +
          '<div style="font-weight:700">Точный проход</div>' +
          '<button class="del" type="button" data-arc="exit">×</button></div>' +
          '<div class="mini" style="margin-top:4px">Останови бегунок в зелёной зоне допуска. ' +
          'Сложность: ' + ARC_DIFF_NAMES[arcDiff()] + ' — зона ' + fmt(pz, 0) + ' %.</div>' +
        '</div>' +
        '<div class="card"><div id="arc_bar" style="position:relative;height:46px;border-radius:12px;' +
          'background:rgba(255,255,255,.06);border:1px solid var(--line);overflow:hidden">' +
          '<div style="position:absolute;left:' + (50 - pz / 2) + '%;width:' + pz + '%;top:0;bottom:0;background:rgba(74,217,145,.25);' +
            'border-left:1px solid #4ad991;border-right:1px solid #4ad991"></div>' +
          '<div id="arc_mark" style="position:absolute;top:0;bottom:0;width:3px;left:0;background:#ffb454"></div>' +
        '</div>' +
        '<div class="res" id="arc_out" style="margin-top:12px"></div>' +
        '<button class="btn pri" type="button" id="arc_stop" style="margin-top:10px">Стоп</button></div>';
    }
    if(ARC.game === 'rpm'){
      const rhi = arcDiff() === 'easy' ? 1000 : arcDiff() === 'hard' ? 6000 : 3000;
      const rtr = arcDiff() === 'easy' ? 10 : arcDiff() === 'hard' ? 6 : 8;
      return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center">' +
          '<div style="font-weight:700">Обороты вслепую</div>' +
          '<button class="del" type="button" data-arc="exit">×</button></div>' +
          '<div class="mini" style="margin-top:4px">Стойка загадала обороты от 200 до ' + fmt0(rhi) +
          '. Сложность: ' + ARC_DIFF_NAMES[arcDiff()] + ' — попыток ' + rtr + '.</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="row2">' + fld('arc_n', 'Твои обороты', '', 'об/мин') + '<div></div></div>' +
          '<button class="btn pri" type="button" id="arc_guess">Проверить</button>' +
          '<div id="arc_out" style="margin-top:12px"></div>' +
        '</div>';
    }
    if(ARC.game === 'match'){
      return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center">' +
          '<div style="font-weight:700">Детали</div>' +
          '<button class="del" type="button" data-arc="exit">×</button></div>' +
          '<div class="mini" style="margin-top:4px">Меняйте местами соседние детали: три и больше в ряд ' +
          'исчезают, верхние падают вниз. Когда ходов нет — игра окончена.</div>' +
          '<div class="mini" style="margin-top:2px">Сложность: ' + ARC_DIFF_NAMES[arcDiff()] +
          ' — видов деталей ' + (arcDiff() === 'easy' ? 4 : arcDiff() === 'hard' ? 6 : 5) + '.</div></div>' +
        '<div class="card" style="padding:10px">' +
          '<canvas id="mt_cv" width="272" height="340" style="width:100%;max-width:300px;display:block;' +
            'margin:0 auto;border-radius:12px;background:#0b1116;border:1px solid var(--line);touch-action:none"></canvas>' +
          '<div id="mt_score" class="mini" style="text-align:center;margin-top:8px">Счёт: 0</div>' +
          '<div class="row2" style="margin-top:6px"><button class="btn sm" type="button" id="mt_again">Заново</button></div>' +
        '</div>';
    }
    return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center">' +
        '<div style="font-weight:700">Стружка</div>' +
        '<button class="del" type="button" data-arc="exit">×</button></div>' +
        '<div class="mini" style="margin-top:4px">Собирай стружку и не врезайся в стену и себя. ' +
          'Направление — свайпом по полю или стрелками. Сложность: ' + ARC_DIFF_NAMES[arcDiff()] +
          ' — шаг ' + (arcDiff() === 'easy' ? 210 : arcDiff() === 'hard' ? 110 : 150) + ' мс.</div></div>' +
      '<div class="card" style="padding:10px">' +
        '<canvas id="arc_cv" width="420" height="420" style="width:100%;max-width:420px;display:block;margin:0 auto;' +
          'border-radius:12px;background:#0b1116;border:1px solid var(--line);touch-action:none"></canvas>' +
        '<div id="arc_score" class="mini" style="text-align:center;margin-top:8px">Счёт: 0</div>' +
        '<div class="row3" style="margin-top:10px">' +
          '<div></div>' +
          '<button class="btn sm" type="button" data-dir="up">↑</button>' +
          '<div></div>' +
        '</div>' +
        '<div class="row3" style="margin-top:6px">' +
          '<button class="btn sm" type="button" data-dir="left">←</button>' +
          '<button class="btn sm" type="button" data-dir="down">↓</button>' +
          '<button class="btn sm" type="button" data-dir="right">→</button>' +
        '</div>' +
        '<div class="row2" style="margin-top:6px">' +
          '<button class="btn sm" type="button" id="arc_again">Заново</button>' +
        '</div>' +
      '</div>';
  },
  mount(){
    arcHalt();
    $$('[data-arc]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.arc;
      if(k === 'exit'){ arcExit(); return; }
      ARC.game = k;
      paint();
    }));
    const dsel = $('arc_diff');
    if(dsel) dsel.addEventListener('seg', () => { arcDiffSet(segVal('arc_diff')); paint(); });
    if(!ARC.game) return;

    if(ARC.game === 'pass'){
      const mark = $('arc_mark'), out = $('arc_out');
      const pz = arcDiff() === 'easy' ? 24 : arcDiff() === 'hard' ? 5 : 12;
      const spd = arcDiff() === 'easy' ? 0.35 : arcDiff() === 'hard' ? 0.85 : 0.55;
      ARC.pos = 0;
      ARC.dir = 1;
      const step = () => {
        ARC.pos += ARC.dir * spd;
        if(ARC.pos > 100){ ARC.pos = 100; ARC.dir = -1; }
        if(ARC.pos < 0){ ARC.pos = 0; ARC.dir = 1; }
        const m = $('arc_mark');
        if(!m) return;
        m.style.left = ARC.pos + '%';
        ARC.raf = requestAnimationFrame(step);
      };
      ARC.raf = requestAnimationFrame(step);
      const stop = $('arc_stop');
      stop.addEventListener('click', () => {
        if(!ARC.raf) return;
        cancelAnimationFrame(ARC.raf);
        ARC.raf = 0;
        const dev = Math.abs(ARC.pos - 50);
        const ok = dev <= pz / 2;
        const best = dev;
        arcSaveBest(arcKey('pass'), best, (a, b) => a < b);
        out.innerHTML = rbox('Отклонение', fmt(dev, 1), '%', ok ? 'good' : 'bad') +
          rbox('Результат', ok ? 'в допуске' : 'брак', '', ok ? 'good' : 'bad') +
          rbox('Лучший', fmt(Math.min(best, arcBestOf('pass')), 1), '%', 'lead') +
          '<div class="note" style="grid-column:1/-1">' +
            (ok ? 'Деталь годная — проход засчитан.' : 'Ушли из допуска. Ещё раз?') + '</div>';
        stop.textContent = 'Ещё раз';
        stop.onclick = null;
        stop.addEventListener('click', () => { ARC.game = 'pass'; paint(); }, {once: true});
      }, {once: true});
      return;
    }

    if(ARC.game === 'rpm'){
      const hi = arcDiff() === 'easy' ? 1000 : arcDiff() === 'hard' ? 6000 : 3000;
      const maxTries = arcDiff() === 'easy' ? 10 : arcDiff() === 'hard' ? 6 : 8;
      const target = 200 + Math.floor(Math.random() * (hi - 200 + 1));
      ARC.secret = target;
      ARC.tries = 0;
      const out = $('arc_out');
      out.innerHTML = '<div class="mini">Диапазон: 200…' + fmt0(hi) + '. Попыток: ' + maxTries +
        '. Введи число и нажми «Проверить».</div>';
      const guess = () => {
        const v = Math.round(num('arc_n', 0));
        if(!(v > 0)){ toast('Введите число'); return; }
        ARC.tries++;
        if(v === target){
          arcSaveBest(arcKey('rpm'), ARC.tries, (a, b) => a < b);
          out.innerHTML = rbox('Угадано', fmt0(v), 'об/мин', 'good') +
            rbox('Попыток', fmt0(ARC.tries), 'шт', 'lead') +
            '<div class="note" style="grid-column:1/-1">Верно! Столько же дал бы расчёт по Vc.</div>';
          $('arc_guess').textContent = 'Новая деталь';
          $('arc_guess').onclick = null;
          $('arc_guess').addEventListener('click', () => { ARC.game = 'rpm'; paint(); }, {once: true});
          return;
        }
        out.innerHTML = '<div class="note" style="margin-top:0">' +
          '<b>' + fmt0(v) + '</b> — нужно ' + (v < target ? '<b style="color:#ffc75f">больше</b>' : '<b style="color:#5ec8ff">меньше</b>') +
          '. Попыток: ' + fmt0(ARC.tries) + ' из ' + maxTries + '.</div>';
        if(ARC.tries >= maxTries){
          out.innerHTML = rbox('Ответ', fmt0(target), 'об/мин', 'bad') +
            rbox('Попыток', fmt0(ARC.tries) + ' из ' + maxTries, 'шт', 'bad') +
            '<div class="note" style="grid-column:1/-1">Лимит попыток исчерпан. Нажмите «Новая деталь».</div>';
          $('arc_guess').textContent = 'Новая деталь';
          $('arc_guess').onclick = null;
          $('arc_guess').addEventListener('click', () => { ARC.game = 'rpm'; paint(); }, {once: true});
        }
      };
      $('arc_guess').addEventListener('click', guess);
      const inp = $('arc_n');
      inp.addEventListener('keydown', e => { if(e.key === 'Enter') guess(); });
      return;
    }

    /* match-3 */
    if(ARC.game === 'match'){ mtInit(); return; }

    /* snake */
    const cv = $('arc_cv');
    if(!cv) return;
    const ctx = cv.getContext('2d');
    const N = 21, cell = 20, SIZE = N * cell;
    const st = {snake: [[10, 10]], dir: [1, 0], next: [1, 0], food: [15, 10], score: 0, dead: false};
    ARC.snake = st;
    const scoreEl = $('arc_score');
    const draw = () => {
      ctx.fillStyle = '#0b1116';
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = '#ffb454';
      ctx.fillRect(st.food[0] * cell + 4, st.food[1] * cell + 4, cell - 8, cell - 8);
      st.snake.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? '#4ad991' : 'rgba(74,217,145,.55)';
        ctx.fillRect(p[0] * cell + 2, p[1] * cell + 2, cell - 4, cell - 4);
      });
      if(st.dead){
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.fillRect(0, 0, SIZE, SIZE);
        ctx.fillStyle = '#ff6b73';
        ctx.font = 'bold 24px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Врезался', SIZE / 2, SIZE / 2 - 6);
        ctx.fillStyle = '#c9d6e2';
        ctx.font = '15px system-ui, sans-serif';
        ctx.fillText('Счёт: ' + st.score, SIZE / 2, SIZE / 2 + 22);
      }
    };
    const tick = () => {
      if(!document.getElementById('arc_cv')){
        clearInterval(ARC.timer);
        ARC.timer = 0;
        return;
      }
      if(st.dead) return;
      st.dir = st.next;
      const head = [st.snake[0][0] + st.dir[0], st.snake[0][1] + st.dir[1]];
      if(head[0] < 0 || head[0] >= N || head[1] < 0 || head[1] >= N ||
         st.snake.some(p => p[0] === head[0] && p[1] === head[1])){
        st.dead = true;
        clearInterval(ARC.timer);
        ARC.timer = 0;
        if(scoreEl) scoreEl.textContent = 'Счёт: ' + st.score + ' · нажмите на поле, чтобы начать заново';
        arcSaveBest(arcKey('snake'), st.score, (a, b) => a > b);
        draw();
        return;
      }
      st.snake.unshift(head);
      if(head[0] === st.food[0] && head[1] === st.food[1]){
        st.score++;
        scoreEl.textContent = 'Счёт: ' + st.score;
        let f;
        do{ f = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)]; }
        while(st.snake.some(p => p[0] === f[0] && p[1] === f[1]));
        st.food = f;
      } else {
        st.snake.pop();
      }
      draw();
    };
    const turn = d => {
      const map = {up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0]};
      const nd = map[d];
      if(!nd) return;
      if(nd[0] === -st.dir[0] && nd[1] === -st.dir[1]) return;
      if(nd[0] === -st.next[0] && nd[1] === -st.next[1]) return;
      st.next = nd;
    };
    $$('[data-dir]').forEach(b => b.addEventListener('click', () => turn(b.dataset.dir)));
    if(ARC.keys) window.removeEventListener('keydown', ARC.keys);
    ARC.keys = e => {
      if(!document.getElementById('arc_cv')){ window.removeEventListener('keydown', ARC.keys); return; }
      const map = {ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right'};
      if(map[e.key]){ e.preventDefault(); turn(map[e.key]); }
    };
    let sx = 0, sy = 0, swiped = false;
    cv.addEventListener('touchstart', e => {
      const t = e.changedTouches[0];
      sx = t.clientX; sy = t.clientY; swiped = false;
    }, {passive: true});
    cv.addEventListener('touchmove', e => {
      if(swiped) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if(Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
      swiped = true;
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }, {passive: true});
    cv.addEventListener('touchend', e => {
      if(swiped) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if(Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }, {passive: true});
    window.addEventListener('keydown', ARC.keys);
    const spd = arcDiff() === 'easy' ? 210 : arcDiff() === 'hard' ? 110 : 150;
    const startTimer = () => { if(!ARC.timer && ARC.snake && !ARC.snake.dead) ARC.timer = setInterval(tick, spd); };
    ARC.onVis = () => {
      if(document.hidden){
        if(ARC.timer){ clearInterval(ARC.timer); ARC.timer = 0; }
      } else if(ARC.game === 'snake'){
        startTimer();
      }
    };
    document.addEventListener('visibilitychange', ARC.onVis);
    cv.addEventListener('click', () => { if(st.dead){ ARC.game = 'snake'; paint(); } });
    draw();
    startTimer();
    const again = $('arc_again');
    if(again) again.addEventListener('click', () => { ARC.game = 'snake'; paint(); });
  }
};

/* ---------- «Детали»: три в ряд 8×10 ---------- */
const MT = {cols: 8, rows: 10, cell: 34, b: [], sel: null, score: 0, over: false, busy: false, cv: null, ctx: null};
const MT_TYPES = [
  {c: '#ffb454', s: 'gear'},
  {c: '#5ec8ff', s: 'hex'},
  {c: '#4ad991', s: 'square'},
  {c: '#c78bd8', s: 'tri'},
  {c: '#ff6b73', s: 'circle'},
  {c: '#9b8cff', s: 'star'}
];

function mtWouldMatch(b, c, r, t){
  if(c >= 2 && b[r][c - 1] === t && b[r][c - 2] === t) return true;
  if(r >= 2 && b[r - 1][c] === t && b[r - 2][c] === t) return true;
  return false;
}
function mtFind(){
  const set = new Set();
  for(let r = 0; r < MT.rows; r++){
    for(let c = 0; c < MT.cols - 2; c++){
      const t = MT.b[r][c];
      if(t < 0) continue;
      let n = 1;
      while(c + n < MT.cols && MT.b[r][c + n] === t) n++;
      if(n >= 3){ for(let i = 0; i < n; i++) set.add(r * MT.cols + c + i); }
      c += n - 1;
    }
  }
  for(let c = 0; c < MT.cols; c++){
    for(let r = 0; r < MT.rows - 2; r++){
      const t = MT.b[r][c];
      if(t < 0) continue;
      let n = 1;
      while(r + n < MT.rows && MT.b[r + n][c] === t) n++;
      if(n >= 3){ for(let i = 0; i < n; i++) set.add((r + i) * MT.cols + c); }
      r += n - 1;
    }
  }
  return set;
}
function mtSwapCells(a, b){
  const t = MT.b[a.r][a.c];
  MT.b[a.r][a.c] = MT.b[b.r][b.c];
  MT.b[b.r][b.c] = t;
}
function mtHasMoves(){
  for(let r = 0; r < MT.rows; r++){
    for(let c = 0; c < MT.cols; c++){
      if(c < MT.cols - 1){
        const a = {r: r, c: c}, b2 = {r: r, c: c + 1};
        mtSwapCells(a, b2);
        const ok = mtFind().size > 0;
        mtSwapCells(a, b2);
        if(ok) return true;
      }
      if(r < MT.rows - 1){
        const a = {r: r, c: c}, b2 = {r: r + 1, c: c};
        mtSwapCells(a, b2);
        const ok = mtFind().size > 0;
        mtSwapCells(a, b2);
        if(ok) return true;
      }
    }
  }
  return false;
}

function mtIcon(ctx, type, cx, cy, s){
  const t = MT_TYPES[type % MT_TYPES.length];
  ctx.fillStyle = t.c;
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.lineWidth = 1.5;
  const h = s / 2;
  if(t.s === 'gear'){
    ctx.beginPath();
    ctx.arc(cx, cy, h * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b1116';
    ctx.beginPath();
    ctx.arc(cx, cy, h * 0.26, 0, Math.PI * 2);
    ctx.fill();
  } else if(t.s === 'hex'){
    ctx.beginPath();
    for(let i = 0; i < 6; i++){
      const a = Math.PI / 3 * i - Math.PI / 6;
      const x = cx + Math.cos(a) * h * 0.78, y = cy + Math.sin(a) * h * 0.78;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  } else if(t.s === 'square'){
    ctx.fillRect(cx - h * 0.66, cy - h * 0.66, h * 1.32, h * 1.32);
  } else if(t.s === 'tri'){
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.8);
    ctx.lineTo(cx + h * 0.75, cy + h * 0.6);
    ctx.lineTo(cx - h * 0.75, cy + h * 0.6);
    ctx.closePath();
    ctx.fill();
  } else if(t.s === 'star'){
    ctx.beginPath();
    for(let i = 0; i < 10; i++){
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rr = i % 2 ? h * 0.34 : h * 0.8;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, h * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b1116';
    ctx.beginPath();
    ctx.arc(cx, cy, h * 0.34, 0, Math.PI * 2);
    ctx.fill();
  }
}

function mtNow(){ return (window.performance && performance.now) ? performance.now() : Date.now(); }
function mtEase(k){ return 1 - Math.pow(1 - k, 3); }
function mtAfter(ms, fn){ const t = setTimeout(fn, ms); ARC.timers.push(t); return t; }
function mtMove(r, c, fr, fc, dur){ MT.anims.push({kind: 'move', r: r, c: c, fr: fr, fc: fc, t0: mtNow(), dur: dur || 180}); }
function mtFade(r, c, dur){ MT.anims.push({kind: 'fade', r: r, c: c, fr: r, fc: c, t0: mtNow(), dur: dur || 180}); }

function mtDraw(){
  const ctx = MT.ctx; if(!ctx) return;
  const W = MT.cols * MT.cell, H = MT.rows * MT.cell;
  const now = mtNow();
  ctx.fillStyle = '#0b1116';
  ctx.fillRect(0, 0, W, H);
  for(let r = 0; r < MT.rows; r++){
    for(let c = 0; c < MT.cols; c++){
      ctx.fillStyle = 'rgba(255,255,255,.035)';
      ctx.fillRect(c * MT.cell + 2, r * MT.cell + 2, MT.cell - 4, MT.cell - 4);
    }
  }
  const over = {};
  MT.anims.forEach(a => {
    const k = Math.min(1, (now - a.t0) / a.dur);
    const e = mtEase(k);
    const key = a.r + ',' + a.c;
    const o = over[key] || (over[key] = {});
    if(a.kind === 'move'){
      o.x = (a.fc + (a.c - a.fc) * e) * MT.cell;
      o.y = (a.fr + (a.r - a.fr) * e) * MT.cell;
    } else {
      o.sc = 1 - e;
      o.al = 1 - e;
    }
  });
  for(let r = 0; r < MT.rows; r++){
    for(let c = 0; c < MT.cols; c++){
      const t = MT.b[r][c];
      if(t < 0) continue;
      const o = over[r + ',' + c] || {};
      const x = (o.x !== undefined) ? o.x : c * MT.cell;
      const y = (o.y !== undefined) ? o.y : r * MT.cell;
      const s = (o.sc !== undefined) ? o.sc : 1;
      if(s <= 0.02) continue;
      ctx.globalAlpha = (o.al !== undefined) ? o.al : 1;
      ctx.save();
      ctx.translate(x + MT.cell / 2, y + MT.cell / 2);
      ctx.scale(s, s);
      mtIcon(ctx, t, 0, 0, MT.cell - 8);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }
  if(MT.sel){
    ctx.strokeStyle = '#ffb454';
    ctx.lineWidth = 3;
    ctx.strokeRect(MT.sel.c * MT.cell + 2, MT.sel.r * MT.cell + 2, MT.cell - 4, MT.cell - 4);
  }
  if(MT.over){
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff6b73';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Ходов нет', W / 2, H / 2 - 10);
    ctx.fillStyle = '#c9d6e2';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('Счёт: ' + MT.score, W / 2, H / 2 + 20);
  }
  const sc = $('mt_score');
  if(sc) sc.textContent = 'Счёт: ' + MT.score;
  MT.anims = MT.anims.filter(a => now - a.t0 < a.dur);
  if(MT.anims.length) MT.raf = requestAnimationFrame(mtDraw);
}

function mtGravity(){
  for(let c = 0; c < MT.cols; c++){
    let write = MT.rows - 1;
    for(let r = MT.rows - 1; r >= 0; r--){
      const v = MT.b[r][c];
      if(v < 0) continue;
      if(write !== r){
        MT.b[write][c] = v;
        MT.b[r][c] = -1;
        mtMove(write, c, r, c, 210);
      }
      write--;
    }
    let spawn = -1;
    for(let r = write; r >= 0; r--){
      MT.b[r][c] = Math.floor(Math.random() * MT.types);
      mtMove(r, c, spawn--, c, 240);
    }
  }
}

function mtResolve(){
  const m = mtFind();
  if(!m.size){
    MT.busy = false;
    if(!mtHasMoves()){
      MT.over = true;
      arcSaveBest(arcKey('match'), MT.score, (a, b) => a > b);
    }
    mtDraw();
    return;
  }
  MT.score += m.size * 10;
  arcSaveBest(arcKey('match'), MT.score, (a, b) => a > b);
  m.forEach(k => mtFade(Math.floor(k / MT.cols), k % MT.cols, 170));
  mtDraw();
  mtAfter(185, () => {
    m.forEach(k => { MT.b[Math.floor(k / MT.cols)][k % MT.cols] = -1; });
    mtGravity();
    mtDraw();
    mtAfter(250, mtResolve);
  });
}

function mtTap(p){
  if(MT.busy || MT.over) return;
  if(!MT.sel){ MT.sel = p; mtDraw(); return; }
  const a = MT.sel;
  if(a.r === p.r && a.c === p.c){ MT.sel = null; mtDraw(); return; }
  if(Math.abs(a.r - p.r) + Math.abs(a.c - p.c) !== 1){ MT.sel = p; mtDraw(); return; }
  MT.sel = null;
  MT.busy = true;
  mtSwapCells(a, p);
  mtMove(a.r, a.c, p.r, p.c, 150);
  mtMove(p.r, p.c, a.r, a.c, 150);
  mtDraw();
  mtAfter(160, () => {
    if(mtFind().size){ mtResolve(); return; }
    mtSwapCells(a, p);
    mtMove(a.r, a.c, p.r, p.c, 150);
    mtMove(p.r, p.c, a.r, a.c, 150);
    mtDraw();
    mtAfter(170, () => { MT.busy = false; mtDraw(); });
  });
}

function mtInit(){
  const cv = $('mt_cv');
  if(!cv) return;
  MT.cv = cv;
  MT.ctx = cv.getContext('2d');
  MT.score = 0; MT.sel = null; MT.over = false; MT.busy = false;
  MT.anims = [];
  if(MT.raf){ cancelAnimationFrame(MT.raf); MT.raf = 0; }
  MT.types = arcDiff() === 'easy' ? 4 : arcDiff() === 'hard' ? 6 : 5;
  MT.b = [];
  for(let r = 0; r < MT.rows; r++){
    MT.b.push([]);
    for(let c = 0; c < MT.cols; c++){
      let t = 0, guard = 0;
      do { t = Math.floor(Math.random() * MT.types); guard++; }
      while(guard < 40 && mtWouldMatch(MT.b, c, r, t));
      MT.b[r].push(t);
    }
  }
  if(!mtHasMoves()){ mtInit(); return; }
  cv.onclick = e => {
    const rc = cv.getBoundingClientRect();
    const x = (e.clientX - rc.left) * (cv.width / rc.width);
    const y = (e.clientY - rc.top) * (cv.height / rc.height);
    const c = Math.floor(x / MT.cell), r = Math.floor(y / MT.cell);
    if(c < 0 || c >= MT.cols || r < 0 || r >= MT.rows) return;
    mtTap({r: r, c: c});
  };
  const ag = $('mt_again');
  if(ag) ag.onclick = () => { ARC.game = 'match'; paint(); };
  mtDraw();
}

/* При уходе с экрана игра останавливается и не продолжается в фоне */
(function(){
  const orig = paint;
  paint = function(){
    orig.apply(this, arguments);
    if(ARC.game){
      const cur = stack[stack.length - 1];
      if(!cur || cur.id !== 'arcade') arcStop();
    }
  };
})();

/* 4 тапа по имени автора в футере */
(function(){  let taps = 0, timer = 0;
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-egg]');
    if(!el) return;
    taps++;
    clearTimeout(timer);
    timer = setTimeout(() => { taps = 0; }, 1200);
    if(taps >= 4){
      taps = 0;
      clearTimeout(timer);
      if(window.SCREENS && SCREENS.arcade) go('arcade');
    }
  });
})();
