const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve(__dirname, 'before_after_163_records.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Update John 3:16 pos 1 & 2
for (const r of data) {
  if (r.ref === 'يوحنا ٣:١٦') {
    if (r.ar_pos === 1) {
      r.after.token_pos = 2;
      r.after.locator = 'SBLGNT:B43.C3.V16.w2';
      r.after.orig_morphology = 'C- --------';
      r.after.notes = 'تصحيح موضع الأصل إلى 2 والمرجع إلى w2 لمطابقة γάρ في SBLGNT بدقة';
      r.is_modified = true;
    } else if (r.ar_pos === 2) {
      r.after.token_pos = 1;
      r.after.locator = 'SBLGNT:B43.C3.V16.w1';
      r.after.orig_morphology = 'D- --------';
      r.after.notes = 'تصحيح موضع الأصل إلى 1 والمرجع إلى w1 لمطابقة Οὕτως في SBLGNT بدقة وفصلها عن γάρ';
      r.is_modified = true;
    }
  } else if (r.ref === 'إشعياء ٥٣:٥' && r.ar_pos === 12) {
    r.after.notes = 'فصل صرف الفعل نִרְפָּא (HVNp3ms، موضع 10) وتوثيق الجار والمجرور לָנוּ (HR/Sp1cp، موضع 11) كبيانات مهيكلة مستقلة في جدول المكونات';
    r.is_modified = true;
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');

const modifiedCount = data.filter(r => r.is_modified).length;
const unchangedCount = data.length - modifiedCount;

let md = `# كشف التعديلات المقارن (قبل / بعد) لعينّة الـ 163 سجلاً في 10 آيات كاملة\n\n`;
md += `**الإصدار:** v1.0.315 (قاعدة البيانات v44)\n`;
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
    ? (r.after.notes || (r.changes ? r.changes.join('; ') : '')) 
    : 'مطابق للأصل الصرفي والمعجمي';
  
  md += `| ${r.ref} | ${r.ar_pos} | ${r.ar_word} | ${status} | ${beforeStr} | ${afterStr} | ${reason} |\n`;
}

const outPath = 'C:/Users/manal/.gemini/antigravity/brain/6d627a05-53e4-4c46-8d77-9c11b867e94a/v315_163_records_before_after_disclosure.md';
fs.writeFileSync(outPath, md, 'utf8');
console.log(`Generated disclosure report at ${outPath}`);
