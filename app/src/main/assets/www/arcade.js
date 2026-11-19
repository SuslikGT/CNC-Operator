/* Пасхалка: мини-игры (открывается 4 тапами по имени автора) */
const ARC_KEY = 'arcade.best';
let ARC = {game: null, raf: 0, timer: 0, snake: null, pos: 0, dir: 1};

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
  ARC.raf = 0;
  ARC.timer = 0;
}
function arcStop(){
  arcHalt();
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
        '<button class="tile" type="button" data-arc="pass" style="width:100%">' +
          '<span class="ic" style="color:#ffb454;background:rgba(255,180,84,.13);border-color:rgba(255,180,84,.26)">' +
          '<svg viewBox="0 0 24 24"><path d="M3 16h18"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-5"/></svg></span>' +
          '<span><span class="cap">Точный проход</span><span class="sub">останови бегунок в допуске' +
          (b.pass !== undefined ? ' · лучший ' + fmt(b.pass, 1) + ' %' : '') + '</span></span></button>' +
        '<button class="tile" type="button" data-arc="rpm" style="width:100%;margin-top:10px">' +
          '<span class="ic" style="color:#5ec8ff;background:rgba(94,200,255,.13);border-color:rgba(94,200,255,.26)">' +
          '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 12l4-4"/></svg></span>' +
          '<span><span class="cap">Обороты вслепую</span><span class="sub">угадай число оборотов' +
          (b.rpm !== undefined ? ' · лучший ' + fmt0(b.rpm) + ' поп.' : '') + '</span></span></button>' +
        '<button class="tile" type="button" data-arc="snake" style="width:100%;margin-top:10px">' +
          '<span class="ic" style="color:#4ad991;background:rgba(74,217,145,.13);border-color:rgba(74,217,145,.26)">' +
          '<svg viewBox="0 0 24 24"><path d="M4 16c3 0 3-4 6-4s3 4 6 4 4-2 4-6"/><circle cx="5" cy="16" r="1.6"/></svg></span>' +
          '<span><span class="cap">Стружка</span><span class="sub">собирай стружку, не врезайся' +
          (b.snake !== undefined ? ' · лучший ' + fmt0(b.snake) : '') + '</span></span></button>';
    }
    if(ARC.game === 'pass'){
      return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center">' +
          '<div style="font-weight:700">Точный проход</div>' +
          '<button class="del" type="button" data-arc="exit">×</button></div>' +
          '<div class="mini" style="margin-top:4px">Останови бегунок в зелёной зоне допуска.</div>' +
        '</div>' +
        '<div class="card"><div id="arc_bar" style="position:relative;height:46px;border-radius:12px;' +
          'background:rgba(255,255,255,.06);border:1px solid var(--line);overflow:hidden">' +
          '<div style="position:absolute;left:44%;width:12%;top:0;bottom:0;background:rgba(74,217,145,.25);' +
            'border-left:1px solid #4ad991;border-right:1px solid #4ad991"></div>' +
          '<div id="arc_mark" style="position:absolute;top:0;bottom:0;width:3px;left:0;background:#ffb454"></div>' +
        '</div>' +
        '<div class="res" id="arc_out" style="margin-top:12px"></div>' +
        '<button class="btn pri" type="button" id="arc_stop" style="margin-top:10px">Стоп</button></div>';
    }
    if(ARC.game === 'rpm'){
      return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center">' +
          '<div style="font-weight:700">Обороты вслепую</div>' +
          '<button class="del" type="button" data-arc="exit">×</button></div>' +
          '<div class="mini" style="margin-top:4px">Стойка загадала обороты от 200 до 3000. Угадай за минимум попыток.</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="row2">' + fld('arc_n', 'Твои обороты', '', 'об/мин') + '<div></div></div>' +
          '<button class="btn pri" type="button" id="arc_guess">Проверить</button>' +
          '<div id="arc_out" style="margin-top:12px"></div>' +
        '</div>';
    }
    return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center">' +
        '<div style="font-weight:700">Стружка</div>' +
        '<button class="del" type="button" data-arc="exit">×</button></div>' +
        '<div class="mini" style="margin-top:4px">Собирай стружку и не врезайся в стену и себя. ' +
          'Направление — свайпом по полю или стрелками.</div></div>' +
      '<div class="card" style="padding:10px">' +
        '<canvas id="arc_cv" width="300" height="300" style="width:100%;max-width:320px;display:block;margin:0 auto;' +
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
    if(!ARC.game) return;

    if(ARC.game === 'pass'){
      const mark = $('arc_mark'), out = $('arc_out');
      ARC.pos = 0;
      ARC.dir = 1;
      const step = () => {
        ARC.pos += ARC.dir * 0.55;
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
        const ok = dev <= 6;
        const best = dev;
        arcSaveBest('pass', best, (a, b) => a < b);
        out.innerHTML = rbox('Отклонение', fmt(dev, 1), '%', ok ? 'good' : 'bad') +
          rbox('Результат', ok ? 'в допуске' : 'брак', '', ok ? 'good' : 'bad') +
          rbox('Лучший', fmt(Math.min(best, arcBest().pass), 1), '%', 'lead') +
          '<div class="note" style="grid-column:1/-1">' +
            (ok ? 'Деталь годная — проход засчитан.' : 'Ушли из допуска. Ещё раз?') + '</div>';
        stop.textContent = 'Ещё раз';
        stop.onclick = null;
        stop.addEventListener('click', () => { ARC.game = 'pass'; paint(); }, {once: true});
      }, {once: true});
      return;
    }

    if(ARC.game === 'rpm'){
      const target = 200 + Math.floor(Math.random() * 2801);
      ARC.secret = target;
      ARC.tries = 0;
      const out = $('arc_out');
      out.innerHTML = '<div class="mini">Диапазон: 200…3000. Введи число и нажми «Проверить».</div>';
      const guess = () => {
        const v = Math.round(num('arc_n', 0));
        if(!(v > 0)){ toast('Введите число'); return; }
        ARC.tries++;
        if(v === target){
          arcSaveBest('rpm', ARC.tries, (a, b) => a < b);
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
          '. Попыток: ' + fmt0(ARC.tries) + '.</div>';
      };
      $('arc_guess').addEventListener('click', guess);
      const inp = $('arc_n');
      inp.addEventListener('keydown', e => { if(e.key === 'Enter') guess(); });
      return;
    }

    /* snake */
    const cv = $('arc_cv');
    if(!cv) return;
    const ctx = cv.getContext('2d');
    const N = 15, cell = 20;
    const st = {snake: [[7, 7]], dir: [1, 0], next: [1, 0], food: [11, 7], score: 0, dead: false};
    ARC.snake = st;
    const scoreEl = $('arc_score');
    const draw = () => {
      ctx.fillStyle = '#0b1116';
      ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = '#ffb454';
      ctx.fillRect(st.food[0] * cell + 4, st.food[1] * cell + 4, cell - 8, cell - 8);
      st.snake.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? '#4ad991' : 'rgba(74,217,145,.55)';
        ctx.fillRect(p[0] * cell + 2, p[1] * cell + 2, cell - 4, cell - 4);
      });
      if(st.dead){
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.fillRect(0, 0, 300, 300);
        ctx.fillStyle = '#ff6b73';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Врезался', 150, 142);
        ctx.fillStyle = '#c9d6e2';
        ctx.font = '14px system-ui, sans-serif';
        ctx.fillText('Счёт: ' + st.score, 150, 168);
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
        arcSaveBest('snake', st.score, (a, b) => a > b);
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
      st.next = nd;
    };
    $$('[data-dir]').forEach(b => b.addEventListener('click', () => turn(b.dataset.dir)));
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
    draw();
    ARC.timer = setInterval(tick, 150);
    const again = $('arc_again');
    if(again) again.addEventListener('click', () => { ARC.game = 'snake'; paint(); });
  }
};

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
