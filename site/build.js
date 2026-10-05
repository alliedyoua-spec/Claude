// รัน: node site/build.js
//  exam.html     = เอกสารเต็ม ฝัง CSS/JS/ข้อมูลทุกอย่าง เปิดจากไฟล์ได้เลย
//  artifact.html = ส่วนเนื้อหา (title/link/style/body) สำหรับเผยแพร่เป็น Artifact (ระบบห่อ doctype/head/body ให้เอง)
const fs = require('fs'), path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8'), out = (f, s) => fs.writeFileSync(path.join(__dirname, f), s);
const full = read('index.html').replace(/<link rel="stylesheet" href="app\.css">/, () => `<style>\n${read('app.css')}\n</style>`).replace(/<script src="([^"]+)"><\/script>/g, (_, f) => `<script>\n${read(f)}\n</script>`);
out('exam.html', full);
const head = full.match(/<head>([\s\S]*?)<\/head>/)[1].replace(/<meta[^>]*>\s*/g, ''), body = full.match(/<body>([\s\S]*?)<\/body>/)[1];
out('artifact.html', head.trim() + '\n' + body.trim() + '\n');
console.log('exam.html', full.length, 'artifact.html', (head + body).length);
