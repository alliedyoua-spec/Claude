// รัน: node site/check.js — คำนวณซ้ำเฉลยข้อ calc ทุกข้อ และตรวจโครงสร้างชุดโจทย์
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = { window: {} }; vm.createContext(ctx);
const dir = __dirname;
vm.runInContext(fs.readFileSync(path.join(dir, 'config.js'), 'utf8').replace(/window\./g, 'this.'), ctx);
let bad = 0;
const fail = m => { console.error('FAIL', m); bad++; };
for (const f of fs.readdirSync(path.join(dir, 'sets'))) vm.runInContext(fs.readFileSync(path.join(dir, 'sets', f), 'utf8'), ctx);
for (const s of ctx.SETS) for (const q of s.questions) {
  const id = s.id + ':' + q.id;
  if (!q.q || !q.a) fail(id + ' missing q/a');
  if (q.type === 'calc' && !(Math.abs(vm.runInContext(q.expr, ctx) - q.answer) <= q.tol)) fail(id + ' calc mismatch');
  for (const [e, v] of q.checks || []) if (!(Math.abs(vm.runInContext(e, ctx) - v) <= Math.max(1e-6, Math.abs(v) * 1e-4))) fail(id + ' check ' + e);
  if (q.type === 'mcq' && !(q.choices && q.choices[q.answer] !== undefined && new Set(q.choices).size === q.choices.length)) fail(id + ' bad mcq answer/dup choices');
}
const ids = ctx.SETS.map(s => s.id); if (new Set(ids).size !== ids.length) fail('duplicate set id');
console.log(ctx.SETS.length + ' sets, ' + ctx.SETS.reduce((n, s) => n + s.questions.length, 0) + ' questions,', bad ? bad + ' FAILED' : 'all ok');
process.exit(bad ? 1 : 0);
