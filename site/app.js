(() => {
const C = window.CONFIG, SETS = window.SETS, PAPERS = window.PAPERS, root = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const key = it => it.set.id + ':' + it.q.id, topicOf = it => it.q.topic || it.set.topic;
const KIND = { mcq: 'ข้อกา', calc: 'คำนวณ', written: 'ข้อเขียน' }, mm = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
// ----- เก็บข้อมูลในเบราว์เซอร์ของผู้ใช้เอง (ถ้าใช้ไม่ได้ ก็ทำงานได้แต่ไม่จำข้ามการเปิดหน้า)
const mem = {}, store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? (mem[k] ?? d) : JSON.parse(v); } catch { return mem[k] ?? d; } },
  set(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
let DB = Object.assign({ attempts: [], wrong: [], draft: null }, store.get('econ.v1', {}));
const save = () => store.set('econ.v1', DB);
let S = { view: 'home' }, timer = 0;

// ----- ตรวจและให้คะแนน
const autoOk = (q, v) => {
  if (v === undefined || v === '') return null;
  if (q.type === 'mcq') return +v === q.answer;
  const x = parseFloat(String(v).replace(/,/g, '')); return isNaN(x) ? null : Math.abs(x - q.answer) <= q.tol;
};
const paperOf = id => PAPERS.find(p => p.id === id);
function grade(att) { // ผลรายข้อ: frac = 1 / 0.5 / 0 ; null = ยังไม่ประเมิน (ข้อเขียน)
  const p = paperOf(att.paper), rows = p.items.map((it, n) => {
    const k = key(it), v = att.ans[k];
    if (it.q.type === 'written') return { it, n, k, v, frac: att.marks[k] ?? null, pts: C.writtenPoints };
    const ok = autoOk(it.q, v); return { it, n, k, v, ok, frac: ok ? 1 : 0, pts: C.mcqPoints };
  });
  const got = rows.reduce((a, r) => a + (r.frac ?? 0) * r.pts, 0), max = rows.reduce((a, r) => a + r.pts, 0);
  return { rows, got, max, pending: rows.filter(r => r.frac === null).length };
}
const topicStats = rows => { const m = {}; rows.forEach(r => { if (r.frac === null) return; const t = topicOf(r.it), o = m[t] ??= { s: 0, n: 0 }; o.s += r.frac; o.n++; }); return m; };
function syncWrong(rows) {
  const w = new Set(DB.wrong);
  rows.forEach(r => { if (r.frac === null) return; r.frac >= 1 ? w.delete(r.k) : w.add(r.k); });
  DB.wrong = [...w]; save();
}
const bestOf = id => { const a = DB.attempts.filter(x => x.paper === id).map(x => { const g = grade(x); return g.got / g.max; }); return a.length ? Math.max(...a) : null; };

// ----- ส่วนประกอบของข้อสอบ
function optsHtml(it, n, val, reveal) {
  return `<div class="opts">${it.q.choices.map((c, i) => `<label class="opt ${reveal ? (i === it.q.answer ? 'ok' : val === i ? 'no' : '') : ''}"><input type="radio" name="r${n}" data-k="${esc(key(it))}" value="${i}" ${val === i ? 'checked' : ''} ${reveal ? 'disabled' : ''}><span>${esc(c)}</span></label>`).join('')}</div>`;
}
function inputHtml(it, n, val, reveal) {
  const q = it.q, k = esc(key(it));
  if (q.type === 'mcq') return optsHtml(it, n, val, reveal);
  if (q.type === 'calc') return `<input class="num" id="in${n}" data-k="${k}" inputmode="decimal" autocomplete="off" placeholder="ตอบเป็นตัวเลข" value="${esc(val ?? '')}" ${reveal ? 'disabled' : ''}>`;
  return reveal ? '' : `<textarea id="in${n}" data-k="${k}" rows="4" placeholder="พิมพ์คำตอบหรือสรุปแนวคิด (ไม่บังคับ — ประเมินตัวเองหลังดูเฉลย)">${esc(val ?? '')}</textarea>`;
}
const solHtml = it => `<div class="sol">${window.graphSvg(it.q.graph)}<div class="soltxt">${esc(it.q.a)}</div>${it.q.note ? `<p class="note">ตรวจเพิ่ม: ${esc(it.q.note)}</p>` : ''}</div>`;
const head = (it, n, extra = '') => `<div class="qhead"><span class="qno">${n + 1}.</span><span class="pill">${KIND[it.q.type]}</span><small>${esc(it.set.title)} · ${esc(it.q.ref || '')}</small>${extra}</div>`;
const marksHtml = (k, cur, act) => `<div class="marks"><span>ประเมินตัวเอง:</span>${[[1, 'ได้เต็ม'], [.5, 'ได้บางส่วน'], [0, 'ยังไม่ได้']].map(([v, t]) => `<button class="btn sm ${cur === v ? 'on' : ''}" data-act="${act}" data-k="${esc(k)}" data-v="${v}">${t}</button>`).join('')}</div>`;

// ----- หน้าต่างๆ
const views = {
  home() {
    const done = new Set(DB.attempts.map(a => a.paper)), latest = [...done].map(id => DB.attempts.filter(a => a.paper === id).slice(-1)[0]);
    const avg = latest.length ? Math.round(latest.reduce((a, x) => { const g = grade(x); return a + g.got / g.max; }, 0) / latest.length * 100) : null;
    const tm = {}; DB.attempts.forEach(a => Object.entries(topicStats(grade(a).rows)).forEach(([t, o]) => { const x = tm[t] ??= { s: 0, n: 0 }; x.s += o.s; x.n += o.n; }));
    const weak = Object.entries(tm).map(([t, o]) => [t, o.s / o.n, o.n]).sort((a, b) => a[1] - b[1]);
    const d = DB.draft;
    return `<div class="head"><div><div class="eyebrow">Economics for Business 01101102 · เศรษฐศาสตร์มหภาค</div><h1>ระบบฝึกข้อสอบเศรษฐศาสตร์</h1></div></div>
    <p class="muted">ข้อสอบ ${C.papers} ชุด ชุดละข้อกา ${C.mcqCount} ข้อ + ข้อเขียน ${Object.values(C.writtenByTopic).reduce((a, b) => a + b, 0)} ข้อ (${Object.entries(C.writtenByTopic).map(([t, n]) => t + ' ' + n).join(' · ')}) เวลา ${C.minutes} นาที</p>
    ${d ? `<div class="banner"><span>มีข้อสอบ ${esc(paperOf(d.paper).title)} ที่ทำค้างไว้ (เหลือ ${mm(Math.max(0, Math.round((d.endAt - Date.now()) / 1000)))})</span><span class="row"><button class="btn primary sm" data-act="resume">ทำต่อ</button><button class="btn sm" data-act="drop">ทิ้งฉบับร่าง</button></span></div>` : ''}
    <div class="stats"><div class="stat"><b>${done.size}/${C.papers}</b><span>ชุดที่ทำแล้ว</span></div><div class="stat"><b>${avg === null ? '-' : avg + '%'}</b><span>คะแนนเฉลี่ย (ครั้งล่าสุดของแต่ละชุด)</span></div><div class="stat"><b>${DB.wrong.length}</b><span>ข้อที่ควรทบทวน</span></div><div class="stat"><b>${DB.attempts.length}</b><span>ครั้งที่สอบทั้งหมด</span></div></div>
    <h2>ชุดข้อสอบ</h2><div class="papers">${PAPERS.map(p => { const b = bestOf(p.id), n = DB.attempts.filter(a => a.paper === p.id).length;
      return `<div class="paper"><div class="row" style="justify-content:space-between"><span class="no">${String(p.n).padStart(2, '0')}</span>${b === null ? '<span class="pill">ยังไม่ได้ทำ</span>' : `<span class="pill ${b >= .7 ? 'ok' : b >= .5 ? 'warn' : 'bad'}">สูงสุด ${Math.round(b * 100)}%</span>`}</div><h3>${p.title}</h3><small>${p.items.length} ข้อ · ทำแล้ว ${n} ครั้ง</small><div class="row"><button class="btn primary sm" data-act="intro" data-p="${p.id}">${n ? 'ทำอีกครั้ง' : 'เริ่มทำ'}</button>${n ? `<button class="btn sm" data-act="last" data-p="${p.id}">ดูผลล่าสุด</button>` : ''}</div></div>`; }).join('')}</div>
    ${weak.length ? `<h2>หัวข้อที่ควรเสริม</h2><div class="bars">${weak.map(([t, r, n]) => bar(t, r, n)).join('')}</div>` : ''}
    <h2>ฝึกทีละหัวข้อ</h2><div class="list"><div class="item"><div><b>สมุดข้อผิด</b><br><small>รวมข้อที่ตอบผิดหรือประเมินว่ายังไม่ได้ (${DB.wrong.length} ข้อ)</small></div><button class="btn sm" data-act="wrong" ${DB.wrong.length ? '' : 'disabled'}>ฝึกข้อผิด</button></div>
    ${SETS.map(s => `<div class="item"><div><b>${esc(s.title)}</b><br><small>${s.questions.length} ข้อ · ${s.kind === 'original' ? 'ต้นฉบับ' : 'เขียนเพิ่ม'}${s.exam ? '' : ' · นอกขอบเขตสอบ (ทบทวน)'}</small></div><button class="btn sm" data-act="set" data-id="${s.id}">เริ่มฝึก</button></div>`).join('')}</div>
    <p class="muted" style="margin-top:24px"><small>ข้อมูลความก้าวหน้าเก็บในเบราว์เซอร์นี้เท่านั้น เปลี่ยนเครื่องหรือล้างข้อมูลเว็บแล้วจะหาย ข้อที่มีป้าย "ตรวจเพิ่ม" คือเฉลยที่เกินจากสไลด์ ควรเทียบกับที่อาจารย์สอน โจทย์ต้นฉบับเป็นของอาจารย์ผู้สอน ใช้เพื่อการเรียนส่วนตัว</small></p>`;
  },
  intro() {
    const p = S.paper, cnt = t => p.items.filter(i => topicOf(i) === t).length;
    const mc = p.items.filter(i => i.q.type === 'mcq').length, w = p.items.length - mc;
    return `<button class="btn sm" data-act="home">← กลับ</button><h1 style="margin-top:12px">${p.title}</h1>
    <div class="list" style="margin-block:16px"><div class="item"><span>ส่วน ก ข้อกา</span><b class="mono">${mc} ข้อ × ${C.mcqPoints} = ${mc * C.mcqPoints} คะแนน</b></div>
    <div class="item"><span>ส่วน ข ข้อเขียน (${Object.entries(C.writtenByTopic).map(([t, n]) => t + ' ' + n).join(', ')})</span><b class="mono">${w} ข้อ × ${C.writtenPoints} = ${w * C.writtenPoints} คะแนน</b></div>
    <div class="item"><span>เวลา</span><b class="mono">${C.minutes} นาที</b></div></div>
    <ul><li>ข้อกาและข้อคำนวณตรวจให้อัตโนมัติ ข้อเขียนให้พิมพ์ร่างคำตอบ แล้วดูเฉลยและประเมินตัวเองหลังส่ง</li><li>ทำค้างไว้ได้ ระบบเก็บฉบับร่างและเวลาที่เหลือ</li><li>คะแนนต่อข้อและเวลาเป็นค่าตั้งต้น ปรับได้ใน config</li></ul>
    <button class="btn primary" data-act="start">เริ่มจับเวลา</button>`;
  },
  exam() {
    const p = S.paper; let part = '';
    return `<div class="exambar"><div class="row"><b>${p.title}</b><span id="timer" class="mono"></span><span class="row"><small id="prog" class="mono"></small><button class="btn sm" data-act="nav">เลขข้อ</button><button class="btn primary sm" data-act="ask">ส่งข้อสอบ</button></span></div>
    <div class="nav" id="navbox" hidden>${p.items.map((it, n) => `<button class="nv" id="nv${n}" data-act="jump" data-n="${n}" aria-label="ไปข้อ ${n + 1}">${n + 1}</button>`).join('')}</div><div class="confirm" id="confirm" hidden></div></div>
    ${p.items.map((it, n) => { const sec = it.q.type === 'written' ? 'ส่วน ข ข้อเขียน' : 'ส่วน ก ข้อกา', h = sec !== part ? `<div class="section"><h2>${sec}</h2><small>${sec[5] === 'ก' ? 'ข้อกาและข้อคำนวณ' : 'พิมพ์ร่างคำตอบ แล้วเทียบเฉลยหลังส่งข้อสอบ'}</small></div>` : ''; part = sec;
      return h + `<div class="q" id="q${n}">${head(it, n, `<button class="btn sm" data-act="flag" data-k="${esc(key(it))}" id="fl${n}" style="margin-left:auto">ทำเครื่องหมายไว้</button>`)}<div class="qtext">${esc(it.q.q)}</div>${inputHtml(it, n, S.ans[key(it)], false)}</div>`; }).join('')}
    <div class="row" style="margin-top:20px"><button class="btn primary" data-act="ask">ส่งข้อสอบ</button></div>`;
  },
  result() {
    const a = S.att, p = paperOf(a.paper), g = grade(a), ts = topicStats(g.rows), f = S.filter || 'all';
    const mcq = g.rows.filter(r => r.it.q.type !== 'written'), okN = mcq.filter(r => r.ok).length;
    const rows = g.rows.filter(r => f === 'all' || (f === 'miss' ? (r.it.q.type === 'written' ? r.frac !== 1 : !r.ok) : r.it.q.type === 'written'));
    return `<button class="btn sm" data-act="home">← หน้าแรก</button><h1 style="margin-top:12px">ผลสอบ ${p.title}</h1>
    <div class="score"><div class="big">${Math.round(g.got * 10) / 10}<small>/${g.max}</small></div><div><b>ข้อกา/คำนวณ ${okN}/${mcq.length} ข้อ</b><br><span class="muted">ข้อเขียน ${g.pending ? `ยังไม่ประเมิน ${g.pending} ข้อ (เลื่อนลงไปดูเฉลยแล้วกดประเมินตัวเอง)` : 'ประเมินครบแล้ว'}</span><br><small>ใช้เวลา ${mm(Math.round(a.dur))} จาก ${C.minutes}:00 นาที</small></div></div>
    <h2>คะแนนตามหัวข้อ</h2><div class="bars">${Object.entries(ts).map(([t, o]) => bar(t, o.s / o.n, o.n)).join('')}</div>
    <div class="row" style="margin-top:20px"><button class="btn primary" data-act="intro" data-p="${p.id}">ทำชุดนี้อีกครั้ง</button><button class="btn" data-act="home">เลือกชุดอื่น</button></div>
    <h2>เฉลยรายข้อ</h2><div class="tabs">${[['all', 'ทั้งหมด'], ['miss', 'ข้อที่ผิด/ยังไม่ได้'], ['written', 'ข้อเขียน']].map(([v, t]) => `<button class="btn sm ${f === v ? 'on' : ''}" data-act="filter" data-v="${v}">${t}</button>`).join('')}</div>
    ${rows.map(r => reviewCard(r, a)).join('') || '<p class="muted">ไม่มีข้อในกลุ่มนี้</p>'}`;
  },
  practice() {
    return `<button class="btn sm" data-act="home">← กลับ</button><h1 style="margin-top:12px">${esc(S.title)}</h1><p class="muted">${S.items.length} ข้อ · <span id="pscore" class="mono"></span></p>
    ${S.items.map((it, n) => `<div class="q" id="q${n}">${head(it, n)}<div class="qtext">${esc(it.q.q)}</div>${inputHtml(it, n, undefined, false)}<div class="row" style="margin-top:10px"><button class="btn sm" data-act="${it.q.type === 'written' ? 'show' : 'check'}" data-n="${n}">${it.q.type === 'written' ? 'ดูเฉลย' : 'ตรวจ'}</button></div><div id="fb${n}"></div></div>`).join('')}`;
  },
};
const bar = (t, r, n) => `<div class="bar"><span>${esc(t)}</span><i class="${r >= .7 ? 'hi' : r >= .5 ? 'mid' : 'low'}"><b style="width:${Math.round(r * 100)}%"></b></i><span class="mono">${Math.round(r * 100)}% <small>(${n})</small></span></div>`;
function reviewCard(r, a) {
  const q = r.it.q, w = q.type === 'written', st = w ? (r.frac === null ? ['warn', 'รอประเมิน'] : r.frac === 1 ? ['ok', 'ได้เต็ม'] : r.frac === .5 ? ['warn', 'ได้บางส่วน'] : ['bad', 'ยังไม่ได้']) : r.v === undefined || r.v === '' ? ['bad', 'ไม่ได้ตอบ'] : r.ok ? ['ok', 'ถูก'] : ['bad', 'ผิด'];
  const mine = w ? (r.v ? `<div class="yours"><small>คำตอบของคุณ</small><br>${esc(r.v)}</div>` : '<p class="muted">ไม่ได้พิมพ์คำตอบ</p>') : q.type === 'calc' ? `<div class="yours">คำตอบของคุณ: ${esc(r.v ?? '-')} · เฉลย: ${esc(q.answer)}</div>` : '';
  return `<div class="q ${w ? '' : r.ok ? 'ok' : 'no'}" id="rq${r.n}">${head(r.it, r.n, `<span class="pill ${st[0]}" style="margin-left:auto">${st[1]}</span>`)}<div class="qtext">${esc(q.q)}</div>${q.type === 'mcq' ? optsHtml(r.it, 'r' + r.n, r.v, true) : mine}${solHtml(r.it)}${w ? marksHtml(r.k, r.frac, 'mark') : ''}</div>`;
}

// ----- การเปลี่ยนหน้า
function go(v, extra = {}) { clearInterval(timer); S = Object.assign({ view: v }, extra); root.innerHTML = views[v](); window.scrollTo(0, 0); if (v === 'exam') startTimer(); if (v === 'practice') pscore(); }
function startTimer() {
  paint(); const tick = () => { const left = Math.round((S.endAt - Date.now()) / 1000), el = document.getElementById('timer'); if (!el) return; el.textContent = mm(Math.max(0, left)); el.classList.toggle('low', left < 300); if (left <= 0) finish(); };
  tick(); timer = setInterval(tick, 1000);
}
function paint() { // ปรับแถบเลขข้อและปุ่มธง โดยไม่วาดหน้าใหม่ (ไม่ให้ช่องพิมพ์เสียโฟกัส)
  let done = 0; S.paper.items.forEach((it, n) => { const k = key(it), v = S.ans[k], on = v !== undefined && String(v).trim() !== ''; if (on) done++;
    const b = document.getElementById('nv' + n); b.classList.toggle('on', on); b.classList.toggle('fl', !!S.flags[k]); document.getElementById('fl' + n).textContent = S.flags[k] ? 'ยกเลิกเครื่องหมาย' : 'ทำเครื่องหมายไว้'; });
  document.getElementById('prog').textContent = done + '/' + S.paper.items.length;
}
const draft = () => { DB.draft = { paper: S.paper.id, ans: S.ans, flags: S.flags, endAt: S.endAt }; save(); };
function finish() {
  const att = { id: Date.now(), paper: S.paper.id, ts: Date.now(), dur: Math.min(C.minutes * 60, C.minutes * 60 - (S.endAt - Date.now()) / 1000), ans: S.ans, marks: {} };
  DB.attempts.push(att); DB.draft = null; syncWrong(grade(att).rows); go('result', { att });
}
const pscore = () => { const el = document.getElementById('pscore'); if (!el) return; const v = Object.values(S.res || {}); el.textContent = `ตอบถูก ${v.filter(Boolean).length}/${v.length} ที่ทำแล้ว`; };

// ----- ตัวจัดการเหตุการณ์
root.addEventListener('input', e => {
  const k = e.target.dataset.k; if (!k || S.view !== 'exam') return;
  S.ans[k] = e.target.type === 'radio' ? +e.target.value : e.target.value; draft(); paint();
});
root.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; const d = b.dataset, act = d.act, n = +d.n;
  if (act === 'home') go('home');
  else if (act === 'intro') go('intro', { paper: paperOf(d.p) });
  else if (act === 'start') { go('exam', { paper: S.paper, ans: {}, flags: {}, endAt: Date.now() + C.minutes * 60000 }); draft(); }
  else if (act === 'resume') go('exam', { paper: paperOf(DB.draft.paper), ans: DB.draft.ans, flags: DB.draft.flags, endAt: DB.draft.endAt });
  else if (act === 'drop') { DB.draft = null; save(); go('home'); }
  else if (act === 'last') go('result', { att: DB.attempts.filter(a => a.paper === d.p).slice(-1)[0] });
  else if (act === 'nav') { const nb = document.getElementById('navbox'); nb.hidden = !nb.hidden; }
  else if (act === 'jump') { document.getElementById('navbox').hidden = true; document.getElementById('q' + n).scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else if (act === 'flag') { S.flags[d.k] = !S.flags[d.k]; draft(); paint(); }
  else if (act === 'ask') { const un = S.paper.items.filter(it => { const v = S.ans[key(it)]; return v === undefined || String(v).trim() === ''; }).length, c = document.getElementById('confirm');
    c.hidden = false; c.innerHTML = `<p style="margin:0 0 8px">${un ? `ยังไม่ได้ตอบ ${un} ข้อ` : 'ตอบครบทุกข้อแล้ว'} ต้องการส่งข้อสอบหรือไม่</p><div class="row"><button class="btn primary sm" data-act="submit">ส่งข้อสอบ</button><button class="btn sm" data-act="cancel">ทำต่อ</button></div>`; }
  else if (act === 'cancel') document.getElementById('confirm').hidden = true;
  else if (act === 'submit') finish();
  else if (act === 'filter') { S.filter = d.v; const y = scrollY; root.innerHTML = views.result(); scrollTo(0, y); }
  else if (act === 'mark') { S.att.marks[d.k] = +d.v; const g = grade(S.att); syncWrong(g.rows); save(); const y = scrollY; root.innerHTML = views.result(); scrollTo(0, y); }
  else if (act === 'set') { const s = SETS.find(x => x.id === d.id); go('practice', { title: s.title, items: s.questions.map(q => ({ set: s, q })), res: {} }); }
  else if (act === 'wrong') { const w = new Set(DB.wrong), items = SETS.flatMap(s => s.questions.map(q => ({ set: s, q }))).filter(it => w.has(key(it))); go('practice', { title: 'สมุดข้อผิด', items, res: {} }); }
  else if (act === 'check' || act === 'show') practiceReveal(n);
  else if (act === 'pmark') { setWrong(d.k, +d.v === 1); }
});
function setWrong(k, ok) { const w = new Set(DB.wrong); ok ? w.delete(k) : w.add(k); DB.wrong = [...w]; save(); }
function practiceReveal(n) {
  const it = S.items[n], q = it.q, fb = document.getElementById('fb' + n), box = document.getElementById('q' + n); let ok = null;
  if (q.type === 'mcq') { const r = box.querySelector('input:checked'); if (!r) { fb.innerHTML = '<p class="note">เลือกคำตอบก่อน</p>'; return; } ok = +r.value === q.answer; box.querySelectorAll('.opt').forEach((o, i) => o.classList.add(i === q.answer ? 'ok' : i === +r.value ? 'no' : 'x')); }
  else if (q.type === 'calc') { ok = autoOk(q, document.getElementById('in' + n).value); if (ok === null) { fb.innerHTML = '<p class="note">กรอกตัวเลขก่อน</p>'; return; } }
  box.querySelector('.row').hidden = true;
  fb.innerHTML = (ok === null ? marksHtml(key(it), undefined, 'pmark') : `<span class="pill ${ok ? 'ok' : 'bad'}">${ok ? 'ถูก' : 'ผิด'}</span>`) + solHtml(it);
  if (ok !== null) { S.res[key(it)] = ok; setWrong(key(it), ok); pscore(); }
}
document.addEventListener('click', e => { const b = e.target.closest('[data-act=pmark]'); if (b) { b.parentElement.querySelectorAll('.btn').forEach(x => x.classList.remove('on')); b.classList.add('on'); } });
go('home');
})();
