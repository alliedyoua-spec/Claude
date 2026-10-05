// ค่าตั้งต้น รอผู้ใช้ยืนยันจำนวนข้อ/คะแนน/เวลา — แก้ที่นี่ที่เดียว
window.CONFIG = {
  papers: 10,
  mcqCount: 30, mcqPoints: 1,
  writtenByTopic: { 'อัตราแลกเปลี่ยน': 2, 'AD-AS': 2, 'การเงินการคลัง': 3 }, writtenPoints: 10,
  minutes: 90,
};
window.SETS = [];
window.registerSet = s => window.SETS.push(s);
