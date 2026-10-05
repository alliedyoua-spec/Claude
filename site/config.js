// ค่าตั้งต้น รอผู้ใช้ยืนยันจำนวนข้อ/เวลา — แก้ที่นี่ที่เดียว
window.CONFIG = {
  mcqCount: 30,
  minutes: 90,
  writtenByTopic: { 'อัตราแลกเปลี่ยน': 2, 'AD-AS': 2, 'การเงินการคลัง': 3 },
};
window.SETS = [];
window.registerSet = s => window.SETS.push(s);
