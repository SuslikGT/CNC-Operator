/* Сборка веб-версии (PWA) в docs/ из app/src/main/assets/www */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'app', 'src', 'main', 'assets', 'www');
const out = path.join(root, 'docs');
const web = path.join(__dirname, 'web');

function rmrf(p){
  if(!fs.existsSync(p)) return;
  for(const name of fs.readdirSync(p)){
    const f = path.join(p, name);
    if(fs.statSync(f).isDirectory()) rmrf(f); else fs.unlinkSync(f);
  }
  fs.rmdirSync(p);
}

rmrf(out);
fs.mkdirSync(out, {recursive: true});

for(const name of fs.readdirSync(src)){
  const from = path.join(src, name);
  if(!fs.statSync(from).isFile()) continue;
  fs.copyFileSync(from, path.join(out, name));
}

const head = [
  '<link rel="manifest" href="manifest.webmanifest">',
  '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="apple-mobile-web-app-title" content="ЧПУ Оператор">',
  '<meta name="application-name" content="ЧПУ Оператор">'
].join('\n');

let html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
html = html.replace('</head>', head + '\n</head>');
html = html.replace('<script src="bugreport.js"></script>',
  '<script src="bugreport.js"></script>\n<script src="webapp.js"></script>');
fs.writeFileSync(path.join(out, 'index.html'), html);

for(const f of ['manifest.webmanifest', 'sw.js', 'webapp.js', 'icon.svg']){
  let content = fs.readFileSync(path.join(web, f), 'utf8');
  if(f === 'sw.js'){
    const appJs = fs.readFileSync(path.join(out, 'app.js'), 'utf8');
    const ver = (appJs.match(/const APP_VERSION = '([^']+)'/) || [])[1] || 'dev';
    content = content.replace('__VERSION__', ver);
  }
  fs.writeFileSync(path.join(out, f), content);
}

const iconsSrc = path.join(web, 'icons');
fs.mkdirSync(path.join(out, 'icons'), {recursive: true});
if(fs.existsSync(iconsSrc)){
  for(const f of fs.readdirSync(iconsSrc)){
    if(/\.png$/i.test(f)) fs.copyFileSync(path.join(iconsSrc, f), path.join(out, 'icons', f));
  }
}

console.log('web build:', fs.readdirSync(out).length, 'файлов в docs/');
