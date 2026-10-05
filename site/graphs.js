// กราฟ SVG นิ่ง: ตลาดเงินตรา (fx) และ AD-AS (adas) สีมาจาก token ในหน้า (class gl-*, gt-*)
(() => {
  const L = (x1, y1, x2, y2, c, d) => `<line class="${c}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${d ? 'stroke-dasharray="5 4"' : ''}/>`;
  const T = (x, y, v, c) => `<text class="gt ${c || ''}" x="${x}" y="${y}">${v}</text>`;
  const P = (x, y, v) => `<circle class="gp" cx="${x}" cy="${y}" r="3.2"/>` + T(x + 6, y - 6, v);
  // shifts: ['S+','D-',...] (+ = ขวา) ; เส้น S: y = 180 - 0.7(x-50-ds), D: y = 40 + 0.7(x-50-dd)
  function fx(g) {
    const sh = g.shifts || [g.shift], ds = sh.includes('S+') ? 40 : sh.includes('S-') ? -40 : 0, dd = sh.includes('D+') ? 40 : sh.includes('D-') ? -40 : 0;
    const S = o => L(50 + o, 180, 250 + o, 40, 'gl-s', o), D = o => L(50 + o, 40, 250 + o, 180, 'gl-d', o);
    const x2 = 150 + (ds + dd) / 2, y2 = 110 + .35 * (ds - dd);
    return `<svg viewBox="0 0 300 232" role="img" aria-label="กราฟตลาดเงินตรา">${L(50, 22, 50, 200, 'gax') + L(50, 200, 292, 200, 'gax')}${S(0)}${D(0)}${ds ? S(ds) : ''}${dd ? D(dd) : ''}
    ${T(54, 15, 'e (เงินตราต่างประเทศ/เงินในประเทศ)')}${T(150, 220, 'ปริมาณเงินในประเทศ')}${T(252, 40, 'S', 'gt-s')}${T(252, 190, 'D', 'gt-d')}${ds ? T(252 + ds, 40, 'S′', 'gt-s') : ''}${dd ? T(252 + dd, 190, 'D′', 'gt-d') : ''}${P(150, 110, 'E₁')}${P(x2, y2, 'E₂')}</svg>`;
  }
  // ad / lras: ระยะเลื่อนของ AD / LRAS (+ = ขวา) ตามสไลด์: SRAS แนวนอน LRAS แนวตั้ง; AD: y = 110 + 0.7(x-150-ad)
  function adas(g) {
    const ad = g.ad || 0, lr = g.lras || 0, eq = lr ? [150 + lr, 110 + .7 * (lr - ad)] : [150, 110 - .7 * ad];
    const A = o => L(60 + o, 40, 240 + o, 180, 'gl-d', o), SR = y => L(60, y, 262, y, 'gl-s', y !== 110);
    return `<svg viewBox="0 0 300 232" role="img" aria-label="กราฟ AD-AS">${L(50, 22, 50, 200, 'gax') + L(50, 200, 292, 200, 'gax')}
    ${A(0)}${ad ? A(ad) : ''}${L(150, 30, 150, 200, 'gl-l')}${lr ? L(150 + lr, 30, 150 + lr, 200, 'gl-l', 1) : ''}${SR(110)}${lr || ad ? SR(Math.round(eq[1])) : ''}
    ${T(54, 15, 'P (ระดับราคา)')}${T(190, 220, 'Y (ผลผลิตจริง)')}${T(236, 178, 'AD', 'gt-d')}${ad ? T(236 + ad, 178, 'AD′', 'gt-d') : ''}${T(152, 26, 'LRAS', 'gt-l')}${lr ? T(152 + lr, 26, 'LRAS′', 'gt-l') : ''}${T(266, 106, 'SRAS', 'gt-s')}
    ${P(150, 110, 'E₁')}${!lr && ad ? P(150 + ad, 110, 'E₂') : ''}${P(Math.round(eq[0]), Math.round(eq[1]), lr ? 'E₂' : 'E₃')}</svg>`;
  }
  window.graphSvg = g => g ? `<figure class="graph">${g.type === 'fx' ? fx(g) : adas(g)}</figure>` : '';
})();
