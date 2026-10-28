const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve(__dirname, 'before_after_163_records.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Update Eph 2:8 pos 5 and John 3:16 pos 2
for (const r of data) {
  if (r.ref === 'أفسس ٢:٨' && r.ar_pos === 5) {
    r.after.notes = 'توثيق τοῦτο (RD ----NSN-، موضع 9) وتوثيق καί بالرمز الصرفي الخام لمصدر MorphGNT كظرف D- -------- (موضع 8) في جدول المكونات';
    r.is_modified = true;
  } else if (r.ref === 'يوحنا ٣:١٦' && r.ar_pos === 2) {
    r.after.notes = 'تصحيح موضع الأصل إلى 1 والمرجع إلى w1 وتوثيق صيغة المكوّن Οὕτως بالمطابقة التامة مع SBLGNT';
    r.is_modified = true;
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');

const modifiedCount = data.filter(r => r.is_modified).length;
const unchangedCount = data.length - modifiedCount;

let md = `# كشف التعديلات المقارن (قبل / بعد) لعينّة الـ 163 سجلاً في 10 آيات كاملة\n\n`;
md += `**الإصدار:** v1.0.316 (قاعدة البيانات v45)\n`;
md += `**إجمالي السجلات المفحوصة:** ${data.length} سجلاً\n`;
md += `**السجلات المصححة:** ${modifiedCount} سجلاً\n`;
md += `**السجلات المثبتة دون تعديل:** ${unchangedCount} سجلاً\n\n`;

md += `### بيان منهجي حول اكتمال الحقول مقابل التحقق الكوديكسي:\n`;
md += `يحتوي جدول المكونات (\`word_mapping_strongs\`) على 404,700 سجلاً، منها 322,958 سجلاً مكتملاً في حقول الموضع والرمز والمصدر، و 81,742 ينقصها حقل أو أكثر (أغلبها سجلات مجردة من الصرف في الأصل الخام). نؤكد أن اكتمال الحقول أو نسخها من جدول الربط الأساسي هو مؤشر هندسي على اكتمال بنية البيانات، وليس دليلاً على مقابلتها كوديكسيًا مع المصادر الأصلية. التحقق الكوديكسي المقابل حرفيًا يقتصر بدقة علمية على العيّنات والشواهد المرجعية المفحوصة والمثبتة بالاختبارات الصارمة.\n\n`;

md += `## جدول الكشف المقارن التفصيلي (قبل وبعد)\n\n`;
md += `| الآية | الموضع | الكلمة العربية | الحالة | قبل التصحيح (Before) | بعد التصحيح (After) | التعليل اللغوي والتأصيلي |\n`;
md += `| :--- | :---: | :---: | :---: | :--- | :--- | :--- |\n`;

for (const r of data) {
  const status = r.is_modified ? '**مُصحَّح**' : 'مُثْبَت';
  const beforeStr = `Strong: ${r.before.strongs_id || '-'}<br>Orig: ${r.before.orig_surface || '-'}<br>Pos: ${r.before.morph_pos || '-'}<br>Morph: ${r.before.orig_morphology || '-'}<br>Loc: ${r.before.locator || '-'}`;
  const afterStr = `Strong: ${r.after.strongs_id || '-'}<br>Orig: ${r.after.orig_surface || '-'}<br>Pos: ${r.after.morph_pos || '-'}<br>Morph: ${r.after.orig_morphology || '-'}<br>Loc: ${r.after.locator || '-'}`;
  const reason = r.is_modified 
    ? (r.after.notes || (r.changes ? r.changes.join('; ') : '')) 
    : 'مطابق للأصل الصرفي والمعجمي';
  
  md += `| ${r.ref} | ${r.ar_pos} | ${r.ar_word} | ${status} | ${beforeStr} | ${afterStr} | ${reason} |\n`;
}

const outPath = 'C:/Users/manal/.gemini/antigravity/brain/6d627a05-53e4-4c46-8d77-9c11b867e94a/v316_163_records_before_after_disclosure.md';
fs.writeFileSync(outPath, md, 'utf8');
console.log(`Generated disclosure report at ${outPath}`);
