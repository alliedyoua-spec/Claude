// รัน: node site/check.js — โหลดทุกชุด ตรวจโครงสร้าง คำนวณเฉลยซ้ำ และตรวจชุดสอบทั้ง 10 ชุด
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
const run = f => vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), ctx);
run('config.js'); fs.readdirSync(path.join(__dirname, 'sets')).forEach(f => run('sets/' + f)); run('graph-meta.js'); run('graphs.js'); run('levels.js'); run('papers.js');
let bad = 0; const fail = m => { console.error('FAIL', m); bad++; };
for (const s of ctx.SETS) for (const q of s.questions) {
  const id = s.id + ':' + q.id;
  if (!q.q || !q.a) fail(id + ' missing q/a');
  if (q.type === 'calc' && !(Math.abs(vm.runInContext(q.expr, ctx) - q.answer) <= q.tol)) fail(id + ' calc mismatch');
  for (const [e, v] of q.checks || []) if (!(Math.abs(vm.runInContext(e, ctx) - v) <= Math.max(1e-6, Math.abs(v) * 1e-4))) fail(id + ' check ' + e);
  if (q.type === 'mcq' && !(q.choices && q.choices[q.answer] !== undefined && new Set(q.choices).size === q.choices.length)) fail(id + ' bad mcq answer/dup choices');
}
for (const s of ctx.SETS) if (s.exam) for (const q of s.questions) if (![1, 2, 3, 4].includes(q.lvl)) fail(s.id + ':' + q.id + ' missing lvl');
const ids = ctx.SETS.map(s => s.id); if (new Set(ids).size !== ids.length) fail('duplicate set id');
const C = ctx.CONFIG, W = Object.values(C.writtenByTopic).reduce((a, b) => a + b, 0);
ctx.PAPERS.forEach(p => {
  const keys = p.items.map(i => i.set.id + ':' + i.q.id);
  if (new Set(keys).size !== keys.length) fail(p.id + ' duplicate question');
  if (p.items.filter(i => i.q.type === 'mcq').length !== C.mcqCount) fail(p.id + ' mcq count');
  const L = C.levels[p.level]; Object.entries(L.mcq).forEach(([l, k]) => { if (p.items.filter(i => i.q.type === 'mcq' && i.q.lvl === +l).length !== k) fail(p.id + ' lvl' + l + ' count'); });
  p.items.filter(i => i.q.type === 'written').forEach(i => { if (!L.written.includes(i.q.lvl)) fail(p.id + ' written lvl'); });
  if (p.items.filter(i => i.q.type === 'written').length !== W) fail(p.id + ' written count');
});
const uniq = new Set(ctx.PAPERS.flatMap(p => p.items.map(i => i.set.id + ':' + i.q.id)));
const lv = {}; for (const s of ctx.SETS) if (s.exam) for (const q of s.questions) { const k = q.type + (q.q && (q.topic || s.topic)) + ' L' + q.lvl; lv[k] = (lv[k] || 0) + 1; }
console.log(Object.entries(lv).sort().map(([k, v]) => k + '=' + v).join(' | '));
console.log(ctx.SETS.length + ' sets, ' + ctx.SETS.reduce((n, s) => n + s.questions.length, 0) + ' questions; ' + ctx.PAPERS.length + ' papers x ' + ctx.PAPERS[0].items.length + ' items (' + uniq.size + ' distinct used);', bad ? bad + ' FAILED' : 'all ok');
process.exit(bad ? 1 : 0);
