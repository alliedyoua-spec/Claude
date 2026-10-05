// ระดับความยาก 1 = ง่าย (นิยาม/ขั้นเดียว), 2 = ปานกลาง (ประยุกต์/หลายขั้น), 3 = ยาก (ผสมแนวคิด/ตัวเลือกใกล้กัน)
// ประเมินโดยเอเจนต์ ไม่ได้เทียบกับข้อสอบจริง — ข้อที่ไม่ได้ระบุในไฟล์ชุดโจทย์ ใช้ตารางนี้
(() => {
  const byId = {
    'ch45-mcq': { 2: [2, 6, 7, 8, 9, 17, 19, 21, 23, 24, 26, 27, 29, 31, 35, 36, 38, 49, 51, 52, 53, 54, 55, 59, 60, 64, 65], 3: [34] },
    'fx-orig': { 1: [4, 6], 2: [1, 3, 5], 3: [2] },
    'adas-orig': { 1: [1, 2, 3, 4], 2: [5.1, 5.2, 5.4, 5.5, 6, 7], 3: [5.3, 8] },
    'fm-extra': { 1: [4], 2: [1, 2, 3] },
    'gen-fm': { 2: [1, 2, 3, 5, 6], 3: [4, 7] },
  };
  const byRule = {
    'gen-mcq': q => /แห่งที่สอง/.test(q.q) ? 3 : /สำรองตามกฎหมายคือ|มีผู้ว่างงานกี่คน|ปริมาณเงินรวมสูงสุด|แห่งแรก/.test(q.q) ? 2 : 1,
    'gen-fx': q => q.graph && q.graph.shifts && q.graph.shifts.length > 1 ? 3 : 2,
    'gen-adas': () => 2,
    'ch45-mcq': () => 1,
  };
  for (const s of window.SETS) for (const q of s.questions) {
    if (q.lvl) continue;
    const m = byId[s.id]; if (m) for (const [l, ids] of Object.entries(m)) if (ids.includes(q.id)) q.lvl = +l;
    if (!q.lvl && byRule[s.id]) q.lvl = byRule[s.id](q);
  }
})();
