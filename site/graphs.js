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
    const ad = g.ad || 0, lr = g.lras || 0, show = g.lrShow !== false, eq = lr ? [150 + lr, 110 + .7 * (lr - ad)] : [150, 110 - .7 * ad];
    const A = o => L(60 + o, 40, 240 + o, 180, 'gl-d', o), SR = y => L(60, y, 262, y, 'gl-s', y !== 110), lrOn = show && (lr || ad);
    return `<svg viewBox="0 0 300 232" role="img" aria-label="กราฟ AD-AS">${L(50, 22, 50, 200, 'gax') + L(50, 200, 292, 200, 'gax')}
    ${A(0)}${ad ? A(ad) : ''}${L(150, 30, 150, 200, 'gl-l')}${lr ? L(150 + lr, 30, 150 + lr, 200, 'gl-l', 1) : ''}${SR(110)}${lrOn ? SR(Math.round(eq[1])) : ''}
    ${T(54, 15, 'P (ระดับราคา)')}${T(190, 220, 'Y (ผลผลิตจริง)')}${T(236, 178, 'AD', 'gt-d')}${ad ? T(236 + ad, 178, 'AD′', 'gt-d') : ''}${T(152, 26, 'LRAS', 'gt-l')}${lr ? T(152 + lr, 26, 'LRAS′', 'gt-l') : ''}${T(266, 106, 'SRAS', 'gt-s')}
    ${P(150, 110, 'E₁')}${ad ? P(150 + ad, 110, 'E₂') : ''}${lrOn ? P(Math.round(eq[0]), Math.round(eq[1]), ad ? 'E₃' : 'E₂') : ''}</svg>`;
  }
  window.graphSvg = g => g ? `<figure class="graph">${g.type === 'fx' ? fx(g) : adas(g)}</figure>` : '';
  // ข้อเขียนกราฟ: ผู้เรียนเลือกเส้นที่เลื่อนและผลลัพธ์ ระบบวาดกราฟจากคำตอบและตรวจกับค่าที่ได้จากสเปกกราฟของเฉลย
  const sg = x => x > 0 ? '+' : x < 0 ? '-' : '0';
  const SHIFT = [['0', 'ไม่เลื่อน'], ['+', 'เลื่อนขวา'], ['-', 'เลื่อนซ้าย']], DIR = [['+', 'เพิ่มขึ้น'], ['-', 'ลดลง'], ['0', 'เท่าเดิม']], UP = [['+', 'เลื่อนขึ้น (ราคาสูงขึ้น)'], ['-', 'เลื่อนลง (ราคาต่ำลง)'], ['0', 'ไม่เลื่อน'], ['?', 'ไม่แน่นอน']];
  // ตัวเลือกเหตุผล: ข้อที่ถูกอยู่ดัชนี 0 เสมอ (ค่า '0') แต่หมุนลำดับที่แสดงตาม salt เพื่อไม่ให้เดาตำแหน่งได้
  const REASON = { sr: ['ระยะสั้นราคาตรึง (SRAS แนวนอน) ผลผลิตกำหนดโดยอุปสงค์ AD', 'ระยะสั้นผลผลิตกำหนดโดย LRAS ซึ่งเลื่อนตามทันที', 'ระยะสั้นราคาปรับเต็มที่ ผลผลิตจึงไม่เปลี่ยนเสมอ', 'ระยะสั้นเส้น AD ไม่มีผลต่อผลผลิต'],
    lr: ['ระยะยาวราคาและค่าจ้างปรับตัว (SRAS เลื่อน) จนผลผลิตกลับไปที่ระดับการจ้างงานเต็มที่ตาม LRAS', 'ระยะยาวผลผลิตเปลี่ยนตาม AD อย่างถาวร', 'ระยะยาวราคายังตรึงอยู่ จึงไม่มีอะไรเปลี่ยน', 'ระยะยาว LRAS เลื่อนตาม AD เสมอ'] };
  const reason = (arr, salt) => { const o = arr.map((t, i) => [String(i), t]), k = salt % o.length; return [...o.slice(k), ...o.slice(0, k)]; };
  const kit = window.graphKit = {
    fields(g, salt = 0) {
      const why = g.why ? [['why', 'เหตุผลที่เส้นเลื่อน', reason([g.why.ok, ...g.why.bads], salt + 1), g.type === 'fx' ? 'ขั้นที่ 1 ตลาดเงินตรา' : 'ขั้นที่ 1 อะไรเลื่อน']] : [];
      if (g.type === 'fx') return [['S', 'เส้นอุปทานเงินสกุลในประเทศ (S)', SHIFT, 'ขั้นที่ 1 ตลาดเงินตรา'], ['D', 'เส้นอุปสงค์เงินสกุลในประเทศ (D)', SHIFT, 'ขั้นที่ 1 ตลาดเงินตรา'], ...why,
        ['e', 'อัตราแลกเปลี่ยน e ที่ดุลยภาพใหม่', [['+', 'เพิ่มขึ้น (แข็งค่า)'], ['-', 'ลดลง (อ่อนค่า)']], 'ขั้นที่ 1 ตลาดเงินตรา'],
        ...(g.nx ? [['nx', 'ผลโดยตรงต่อส่งออกสุทธิ (NX) จากตัวกำหนดอัตราแลกเปลี่ยน', DIR.slice(0, 2), 'ขั้นที่ 2 ส่งผลต่อ AD-AS'], ['ad', 'เส้น AD เลื่อนอย่างไรจากผลของ NX (ปัจจัยอื่นคงที่)', SHIFT, 'ขั้นที่ 2 ส่งผลต่อ AD-AS'], ['srY', 'ผลผลิตระยะสั้น', DIR, 'ขั้นที่ 2 ส่งผลต่อ AD-AS'], ['lrP', 'ระดับราคาระยะยาว', [...DIR, ['?', 'ไม่แน่นอน']], 'ขั้นที่ 2 ส่งผลต่อ AD-AS']] : [])];
      return [['AD', 'เส้น AD', SHIFT, 'ขั้นที่ 1 อะไรเลื่อน'], ['LRAS', 'เส้น LRAS', SHIFT, 'ขั้นที่ 1 อะไรเลื่อน'], ...why,
        ['srY', 'ผลผลิต Y ระยะสั้น', DIR, 'ขั้นที่ 2 ระยะสั้น'], ['srP', 'ระดับราคา P ระยะสั้น', DIR, 'ขั้นที่ 2 ระยะสั้น'], ['srWhy', 'เหตุผลของผลระยะสั้น', reason(REASON.sr, salt + 2), 'ขั้นที่ 2 ระยะสั้น'],
        ['sras', 'เส้น SRAS ปรับตัวในระยะยาวอย่างไร', UP, 'ขั้นที่ 3 ระยะยาว'], ['lrY', 'ผลผลิต Y ระยะยาว', DIR, 'ขั้นที่ 3 ระยะยาว'], ['lrP', 'ระดับราคา P ระยะยาว', [...DIR, ['?', 'ไม่แน่นอน']], 'ขั้นที่ 3 ระยะยาว'], ['lrWhy', 'เหตุผลของผลระยะยาว', reason(REASON.lr, salt + 3), 'ขั้นที่ 3 ระยะยาว']];
    },
    expect(g) {
      const w = g.why ? { why: '0' } : {};
      if (g.type === 'fx') { const sh = g.shifts || [g.shift], S = sh.includes('S+') ? '+' : sh.includes('S-') ? '-' : '0', D = sh.includes('D+') ? '+' : sh.includes('D-') ? '-' : '0';
        return Object.assign({ S, D }, w, { e: D === '+' || S === '-' ? '+' : '-' }, g.nx ? { nx: g.nx, ad: g.nx, srY: g.nx, lrP: g.nx } : {}); }
      const a = Math.sign(g.ad || 0), l = Math.sign(g.lras || 0), P = !l ? sg(a) : !a ? sg(-l) : a !== l ? sg(a) : '?';
      return Object.assign({ AD: sg(a), LRAS: sg(l) }, w, { srY: sg(a), srP: '0', srWhy: '0', sras: P, lrY: sg(l), lrP: P, lrWhy: '0' });
    },
    score(g, v) { const ex = kit.expect(g), F = Object.keys(ex); return F.filter(f => (v || {})[f] === ex[f]).length / F.length; },
    draw(g, v) { v = v || {}; const d = x => x === '+' ? 40 : x === '-' ? -40 : 0;
      if (g.type === 'fx') return window.graphSvg({ type: 'fx', shifts: [d(v.S) ? 'S' + v.S : '', d(v.D) ? 'D' + v.D : ''].filter(Boolean) });
      return window.graphSvg({ type: 'adas', ad: d(v.AD), lras: d(v.LRAS), lrShow: v.sras === '+' || v.sras === '-' }); },
  };
})();
