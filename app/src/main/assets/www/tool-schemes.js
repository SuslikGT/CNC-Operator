/* Динамические схемы: пластины и державки */
function polyD(pts){
  return 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L') + ' Z';
}
function shapePts(shape, cx, cy, r){
  const k = {
    C: 0.84, D: 0.52, V: 0.315, M: 1.04
  }[shape];
  if(k !== undefined){
    return [[cx, cy - r], [cx + r * k, cy], [cx, cy + r], [cx - r * k, cy]];
  }
  switch(shape){
    case 'S': return [[cx - r, cy - r], [cx + r, cy - r], [cx + r, cy + r], [cx - r, cy + r]];
    case 'L': return [[cx - r * 0.8, cy - r * 0.55], [cx + r * 0.8, cy - r * 0.55],
                      [cx + r * 0.8, cy + r * 0.55], [cx - r * 0.8, cy + r * 0.55]];
    case 'T': return [
      [cx, cy - r], [cx + r * 1.08, cy + r * 0.62], [cx - r * 1.08, cy + r * 0.62]];
    case 'W': return [
      [cx, cy - r * 0.92], [cx + r * 1.06, cy + r * 0.5], [cx - r * 1.06, cy + r * 0.5]];
    case 'H': {
      const p = [];
      for(let i = 0; i < 6; i++){
        const a = Math.PI / 3 * i - Math.PI / 2;
        p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
      return p;
    }
    case 'O': {
      const p = [];
      for(let i = 0; i < 8; i++){
        const a = Math.PI / 4 * i + Math.PI / 8;
        p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
      return p;
    }
    case 'P': {
      const p = [];
      for(let i = 0; i < 5; i++){
        const a = -Math.PI / 2 + Math.PI * 2 / 5 * i;
        p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
      return p;
    }
    case 'K': return [[cx - r * 0.85, cy - r], [cx + r * 0.85, cy - r * 0.4],
                      [cx + r * 0.85, cy + r], [cx - r * 0.85, cy + r * 0.4]];
    default: return [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
  }
}
function hasHole(clamp){ return 'MGTW'.indexOf(clamp) >= 0 || clamp === 'A' || clamp === 'F'; }

/* ---------- пластина ---------- */
function renderInsertSvg(code){
  const raw = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const m = raw.match(/^([A-Z]{4})(\d{2})([0-9A-Z]{2})(\d{2})/);
  if(!m) return '<div class="mini" style="padding:14px;text-align:center">Введите обозначение, например CNMG 120408</div>';
  const L = m[1], size = m[2], thick = m[3], rad = m[4];
  const shape = L[0];
  const icMm = D.insertSize[size] || 12.7;
  const thMm = D.insertThick[thick] || 0;
  const rMm = D.noseR[rad];
  const s = 78 / icMm;                       // px на мм для вида сверху
  const cx = 96, cy = 108;
  const r = icMm * s / 1.7;
  const rp = Math.max(5, (rMm || 0.4) * s * 2.4);
  const pts = shapePts(shape, cx, cy, r);
  const isRound = shape === 'R';
  const body = isRound
    ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(1) + '" fill="url(#ins-am)" stroke="#ffb454" stroke-width="1"/>'
    : '<path d="' + polyD(pts) + '" fill="#ffb454" stroke="#ffb454" stroke-width="' + (rp * 2).toFixed(1) +
      '" stroke-linejoin="round"/>' +
      '<path d="' + polyD(pts) + '" fill="none" stroke="#ffd79a" stroke-width="1" opacity=".55"/>';
  const hole = hasHole(L[3])
    ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.26).toFixed(1) + '" fill="#0E1318" stroke="#0E1318"/>'
    : '';
  const sideW = icMm * s * 0.92;
  const sideH = Math.max(10, thMm * 7);
  const sideX = 218, sideY = cy - sideH / 2;
  const side = thMm
    ? '<path d="M' + sideX + ',' + sideY + ' h' + sideW.toFixed(0) + ' v' + sideH.toFixed(0) +
      ' h-' + sideW.toFixed(0) + ' Z" fill="#ffb454" opacity=".85"/>' +
      '<text class="calc" x="' + (sideX + 4) + '" y="' + (sideY - 6) + '">' + fmt(thMm, 2) + ' мм</text>'
    : '';
  const vx = cx + r * (shape === 'S' || shape === 'L' ? 1 : 0.84);
  const radiusMark = isRound ? '' :
    '<path class="dim" d="M' + vx.toFixed(1) + ',' + cy + ' L' + (vx + 14).toFixed(1) + ',' + (cy - 22) +
      ' h8"/>' +
    '<text class="hint" x="' + (vx + 26).toFixed(1) + '" y="' + (cy - 24) + '">r ' +
      (rMm !== undefined ? fmt(rMm, 2) : '—') + '</text>';
  return '<svg viewBox="0 0 320 190">' +
    '<defs><linearGradient id="ins-am" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#FFC873"/><stop offset="1" stop-color="#FF8A2B"/></linearGradient></defs>' +
    body + hole + side +
    '<text x="' + cx + '" y="' + (cy - r - 16) + '" text-anchor="middle" class="calc">' +
      (D.insertShapes[shape] ? D.insertShapes[shape].name : 'форма ' + shape) + '</text>' +
    '<text x="' + cx + '" y="' + (cy + r + 22) + '" text-anchor="middle">IC ' + fmt(icMm, 2) + ' мм</text>' +
    radiusMark +
    '<text class="hint" x="' + (sideX + sideW / 2) + '" y="' + (cy + sideH / 2 + 22) + '" text-anchor="middle">торец</text>' +
    '</svg>';
}

/* ---------- державка ---------- */
function parseHolderCode(code){
  const s = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  let m = s.match(/^([A-Z])([A-Z])([A-Z])([A-Z])([LR])(\d{2})(\d{2})([A-Z])?(\d{2})?$/);
  if(m) return {clamp: m[1], shape: m[2], style: m[3], relief: m[4], hand: m[5],
                h: +m[6], w: +m[7], len: m[8] || 'M', ins: m[9] ? +m[9] : 0};
  m = s.match(/^A(\d{2})([A-Z])([A-Z])([A-Z])([A-Z])([A-Z])([LR])(\d{2})$/);
  if(m) return {clamp: m[3], shape: m[4], style: m[5], relief: m[6], hand: m[7],
                h: +m[1], w: +m[1], len: 'A', ins: +m[8], boring: true};
  return null;
}
function renderHolderSvg(code){
  const p = parseHolderCode(code);
  if(!p) return '<div class="mini" style="padding:14px;text-align:center">Введите обозначение, например MCLNR 2525 M12</div>';
  const cy = 104;
  const lenPx = p.len === 'K' ? 118 : p.len === 'P' ? 178 : 150;
  const h = Math.max(20, Math.min(52, (p.w || 20) * 1.7));
  const x0 = 26, x1 = x0 + lenPx;
  const ins = Math.max(14, Math.min(40, (p.ins || 12) * 2.2));
  const icx = x1 - 6, icy = cy - h / 2 - ins * 0.55;
  const pts = shapePts(p.shape, icx, icy, ins);
  const mirror = p.hand === 'L' ? ' transform="translate(320,0) scale(-1,1)"' : '';
  const handTxt = p.boring ? 'расточная' : (p.hand === 'L' ? 'левая' : 'правая');
  const shapeName = D.insertShapes[p.shape] ? D.insertShapes[p.shape].name : 'пластина ' + p.shape;
  const lx = p.hand === 'L' ? 320 - icx : icx;
  return '<svg viewBox="0 0 320 178">' +
    '<g' + mirror + '>' +
      '<path d="M' + x0 + ',' + (cy - h / 2) + ' H' + (x1 - 16) + ' L' + x1 + ',' + (cy - h / 2 + 11) +
        ' V' + (cy + h / 2) + ' H' + x0 + ' Z" fill="#c9d6e2" stroke="#e6eef6" stroke-width="1"/>' +
      '<path d="' + polyD(pts) + '" fill="#ffb454" stroke="#ff8a2b" stroke-width="1.6" stroke-linejoin="round"/>' +
    '</g>' +
    '<text class="calc" x="' + (x0 + 2) + '" y="' + (cy - h / 2 - 10) + '">' + p.h + '×' + p.w + ' мм</text>' +
    '<text class="hint" x="' + (x0 + 2) + '" y="' + (cy + h / 2 + 20) + '">державка · ' + handTxt + '</text>' +
    '<text x="' + lx + '" y="' + (icy - ins - 12) + '" text-anchor="middle">' + shapeName + '</text>' +
    '<text class="hint" x="' + (320 - 16) + '" y="' + (cy + h / 2 + 20) + '" text-anchor="end">пластина ' +
      (p.ins || '—') + ' мм</text>' +
    '</svg>';
}
