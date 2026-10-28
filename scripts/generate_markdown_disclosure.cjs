const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'before_after_163_records.json'), 'utf8'));

const modifiedCount = data.filter(r => r.is_modified).length;
const unchangedCount = data.length - modifiedCount;

let md = `# كشف التعديلات المقارن (قبل / بعد) لعينّة الـ 163 سجلاً في 10 آيات كاملة\n\n`;
md += `**الإصدار:** v1.0.314 (قاعدة البيانات v43)\n`;
md += `**إجمالي السجلات المفحوصة:** ${data.length} سجلاً\n`;
md += `**السجلات المصححة:** ${modifiedCount} سجلاً\n`;
md += `**السجلات المثبتة دون تعديل:** ${unchangedCount} سجلاً\n\n`;

md += `## جدول الكشف المقارن التفصيلي (قبل وبعد)\n\n`;
md += `| الآية | الموضع | الكلمة العربية | الحالة | قبل التصحيح (Before) | بعد التصحيح (After) | التعليل اللغوي والتأصيلي |\n`;
md += `| :--- | :---: | :---: | :---: | :--- | :--- | :--- |\n`;

for (const r of data) {
  const status = r.is_modified ? '**مُصحَّح**' : 'مُثْبَت';
  const beforeStr = `Strong: ${r.before.strongs_id || '-'}<br>Orig: ${r.before.orig_surface || '-'}<br>Pos: ${r.before.morph_pos || '-'}<br>Morph: ${r.before.orig_morphology || '-'}<br>Loc: ${r.before.locator || '-'}`;
  const afterStr = `Strong: ${r.after.strongs_id || '-'}<br>Orig: ${r.after.orig_surface || '-'}<br>Pos: ${r.after.morph_pos || '-'}<br>Morph: ${r.after.orig_morphology || '-'}<br>Loc: ${r.after.locator || '-'}`;
  const reason = r.is_modified 
    ? (r.after.notes || r.changes.join('; ')) 
    : 'مطابق للأصل الصرفي والمعجمي';
  
  md += `| ${r.ref} | ${r.ar_pos} | ${r.ar_word} | ${status} | ${beforeStr} | ${afterStr} | ${reason} |\n`;
}

const outPath = 'C:/Users/manal/.gemini/antigravity/brain/6d627a05-53e4-4c46-8d77-9c11b867e94a/v314_163_records_before_after_disclosure.md';
fs.writeFileSync(outPath, md, 'utf8');
console.log(`Generated disclosure report at ${outPath}`);
