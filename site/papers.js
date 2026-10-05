// สร้างชุดสอบ: แจกไพ่จากคลังโจทย์แบบกำหนดตายตัว (seed คงที่) ชุดเดิมได้ข้อเดิมทุกครั้ง ภายในชุดไม่ซ้ำ
(() => {
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const C = window.CONFIG, all = window.SETS.flatMap(s => s.questions.map(q => ({ set: s, q })));
  const topic = i => i.q.topic || i.set.topic;
  const deal = (pool, per, seed) => { const d = shuffle(pool, rng(seed)); return Array.from({ length: C.papers }, (_, p) => Array.from({ length: per }, (_, k) => d[(p * per + k) % d.length])); };
  const mc = deal(all.filter(i => i.set.mcqPool && i.q.type === 'mcq'), C.mcqCount, 11);
  const wr = Object.entries(C.writtenByTopic).map(([t, n], i) => deal(all.filter(x => x.set.exam && x.q.type === 'written' && topic(x) === t), n, 23 + i));
  const first = x => topic(x) === 'การว่างงาน' ? 0 : 1;
  window.PAPERS = Array.from({ length: C.papers }, (_, p) => ({ id: 'p' + (p + 1), n: p + 1, title: 'ชุดที่ ' + (p + 1),
    items: [...mc[p].sort((a, b) => first(a) - first(b)), ...wr.flatMap(w => w[p])] }));
})();
