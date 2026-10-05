// ค่าตั้งต้น รอผู้ใช้ยืนยันจำนวนข้อ/คะแนน/เวลา — แก้ที่นี่ที่เดียว
window.CONFIG = {
  mcqCount: 30, mcqPoints: 1,
  writtenByTopic: { 'อัตราแลกเปลี่ยน': 2, 'AD-AS': 2, 'การเงินการคลัง': 3 }, writtenPoints: 10, graphShare: 0.4, // ข้อเขียนที่มีกราฟ: 40% จากกราฟ (ตรวจอัตโนมัติ) 60% จากคำอธิบาย
  minutes: 90,
  // ระดับชุดสอบ: จำนวนชุด, จำนวนข้อกาต่อระดับข้อ, ระดับของข้อเขียนที่อนุญาต
  levels: [
    { name: 'ง่าย', papers: 3, mcq: { 1: 24, 2: 6 }, written: [1, 2] },
    { name: 'ปานกลาง', papers: 4, mcq: { 1: 6, 2: 18, 3: 6 }, written: [2] },
    { name: 'ยาก', papers: 3, mcq: { 2: 8, 3: 18, 4: 4 }, written: [3] },
    { name: 'ท้าทาย', papers: 3, mcq: { 3: 8, 4: 22 }, written: [3, 4] },
  ],
};
window.SETS = [];
window.registerSet = s => window.SETS.push(s);
