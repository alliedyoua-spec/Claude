// รัน: node site/bundle.js → สร้าง site/exam.html ไฟล์เดียว (ฝัง config + ทุกชุดโจทย์) แจกหรือเปิดได้เลย
const fs = require('fs'), path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
fs.writeFileSync(path.join(__dirname, 'exam.html'), read('index.html').replace(/<script src="([^"]+)"><\/script>/g, (_, f) => `<script>\n${read(f)}\n</script>`));
