/* Обфускация JS для релизной сборки APK.
   Использование: node tools/obfuscate.js <папка с assets/www> */
const fs = require('fs');
const path = require('path');
const os = require('os');

function loadTerser(){
  const tries = [
    'terser',
    path.join(os.tmpdir(), 'gigatool', 'obf', 'node_modules', 'terser'),
    path.join(__dirname, '..', 'node_modules', 'terser')
  ];
  for(const p of tries){
    try { return require(p); } catch(e) {}
  }
  throw new Error('terser не найден. Установите: npm i terser');
}

const dir = process.argv[2];
if(!dir || !fs.existsSync(dir)) { console.error('нет папки:', dir); process.exit(1); }

const htmlPath = path.join(dir, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const srcs = [];
const re = /<script src="([^"]+\.js)"><\/script>\s*/g;
let m;
while((m = re.exec(html))) srcs.push(m[1]);
if(!srcs.length){ console.error('не найдено script src в index.html'); process.exit(1); }

let code = '';
for(const f of srcs){
  const p = path.join(dir, f);
  if(!fs.existsSync(p)){ console.error('нет файла:', f); process.exit(1); }
  code += '\n' + fs.readFileSync(p, 'utf8');
}

const keep = ['start', 'appBack', '__nativeHttp', '__cb', 'updatesInit', 'bugQueueInit', 'UPDATE'];

loadTerser().minify(code, {
  compress: { passes: 2, drop_console: false },
  mangle: { toplevel: true, reserved: keep },
  format: { comments: false, ascii_only: true },
  ecma: 2020
}).then(res => {
  if(res.error){ console.error('terser:', res.error.message); process.exit(1); }
  fs.writeFileSync(path.join(dir, 'app.min.js'), res.code, 'utf8');
  for(const f of srcs){
    try { fs.unlinkSync(path.join(dir, f)); } catch(e) {}
  }
  html = html.replace(/<script src="[^"]+\.js"><\/script>\s*/g, '');
  html = html.replace('<script>start();</script>', '<script src="app.min.js"></script>\n<script>start();</script>');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('обфускация:', srcs.length, 'файлов →', 'app.min.js', Math.round(res.code.length / 1024), 'КБ');
}).catch(e => { console.error('ошибка:', e.message); process.exit(1); });
