// สร้างชุดสอบตามระดับ: ไล่หยิบจากสำรับที่สับแบบ seed คงที่ (ชุดเดิมได้ข้อเดิมทุกครั้ง ภายในชุดไม่ซ้ำ ข้ามชุดซ้ำน้อยที่สุด)
(() => {
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const C = window.CONFIG, all = window.SETS.flatMap(s => s.questions.map(q => ({ set: s, q })));
  const topic = i => i.q.topic || i.set.topic, decks = {};
  const take = (name, pool, n) => { // หยิบ n ข้อต่อเนื่องจากสำรับ วนกลับเมื่อหมด
    if (pool.length < n) throw new Error(`pool ${name} มี ${pool.length} ข้อ ไม่พอ ${n}`);
    const d = decks[name] ??= { cards: shuffle(pool, rng(name.length * 977 + pool.length)), i: 0 };
    return Array.from({ length: n }, () => d.cards[d.i++ % d.cards.length]);
  };
  const mcq = l => all.filter(i => i.set.mcqPool && i.q.type === 'mcq' && i.q.lvl === l);
  const written = (t, ls) => all.filter(i => i.set.exam && i.q.type === 'written' && topic(i) === t && ls.includes(i.q.lvl));
  const first = x => topic(x) === 'การว่างงาน' ? 0 : 1;
  let n = 0;
  window.PAPERS = C.levels.flatMap((L, li) => Array.from({ length: L.papers }, () => {
    n++;
    const m = Object.entries(L.mcq).flatMap(([l, k]) => take('mcq' + l, mcq(+l), k)).sort((a, b) => first(a) - first(b));
    const w = Object.entries(C.writtenByTopic).flatMap(([t, k]) => take('w' + t + L.written, written(t, L.written), k));
    return { id: 'p' + n, n, level: li, levelName: L.name, title: 'ชุดที่ ' + n, items: [...m, ...w] };
  }));
})();
