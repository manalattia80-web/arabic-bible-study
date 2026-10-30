const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function query(sql) {
  const tmp = path.resolve(__dirname, 'tmp_reader.sql');
  fs.writeFileSync(tmp, '.mode json\n' + sql, 'utf8');
  try {
    const res = execSync(`"${sqlite}" "${dbPath}" < "${tmp}"`, { maxBuffer: 50 * 1024 * 1024 });
    const t = res.toString('utf8').trim();
    return t ? JSON.parse(t) : [];
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

// 5 completely fresh verses across OT and NT (strictly outside training and historical sample)
const testVerses = [
  { book_id: 1, chapter: 1, verse: 1, desc: 'التكوين ١: ١ (التوراة العبرية)' },
  { book_id: 23, chapter: 9, verse: 6, desc: 'إشعياء ٩: ٦ (النبوات العبرية)' },
  { book_id: 40, chapter: 5, verse: 3, desc: 'متى ٥: ٣ (الموعظة على الجبل - اليونانية)' },
  { book_id: 45, chapter: 8, verse: 28, desc: 'رومية ٨: ٢٨ (الرسائل التعليمية - اليونانية)' },
  { book_id: 66, chapter: 22, verse: 20, desc: 'رؤيا ٢٢: ٢٠ (سفر الرؤيا - ختام العهد الجديد)' }
];

console.log('========================================================================');
console.log('   INTERACTIVE READER SIMULATION TEST (محاكاة قارئ الكتاب المقدس)         ');
console.log('   Simulating user tapping words to inspect Strongs, original, & context');
console.log('========================================================================\n');

let totalTaps = 0;
let successfulDisplays = 0;
const results = [];

for (const tv of testVerses) {
  const vRec = query(`SELECT id, text_avd_ar, text_original FROM verses WHERE book_id=${tv.book_id} AND chapter_num=${tv.chapter} AND verse_num=${tv.verse}`)[0];
  console.log(`\n📖 [${tv.desc}]`);
  console.log(`نص الفانديك: «${vRec.text_avd_ar}»`);
  
  const words = query(`
    SELECT wm.id, wm.ar_word_position, wm.ar_word, wm.orig_surface, wm.orig_word,
           wm.strongs_id, wm.morph_pos, wm.orig_morphology, wm.relation_type, wm.grammar_notes,
           se.transliteration, sat.definition_ar, sat.lexical_def_ar
    FROM word_mappings wm
    LEFT JOIN strongs_entries se ON wm.strongs_id = se.strongs_id
    LEFT JOIN strongs_ar_translations sat ON wm.strongs_id = sat.strongs_id
    WHERE wm.verse_id = '${vRec.id}'
    ORDER BY wm.ar_word_position ASC
  `);

  // Simulate tapping each word in the verse
  for (const w of words) {
    totalTaps++;

    // Fetch multi-component sub-chips (if any)
    const components = query(`
      SELECT wms.strongs_id, wms.link_role, wms.orig_component, wms.orig_morphology,
             sat.definition_ar
      FROM word_mapping_strongs wms
      LEFT JOIN strongs_ar_translations sat ON wms.strongs_id = sat.strongs_id
      WHERE wms.mapping_id = '${w.id}'
      ORDER BY wms.link_order ASC
    `);

    // Determine what the user popup shows
    const isSyntactic = w.morph_pos === 'syntactic_ar' || w.relation_type === 'syntactic_ar';
    const isCompound = w.relation_type === 'compound_phrase';
    
    let modalTitle = w.ar_word;
    let modalOriginal = w.orig_surface || '—';
    let modalStrongs = w.strongs_id || (isSyntactic ? 'إضافة صياغية' : 'مركب تركيبي');
    let modalMeaning = w.definition_ar || w.lexical_def_ar || (isSyntactic ? 'أداة ربط / حرف في الصياغة العربية' : '—');
    
    // Check if the tap produces a valid, rich modal display
    const hasMeaningfulContent = (w.strongs_id && w.orig_surface) || isSyntactic || isCompound;
    if (hasMeaningfulContent) {
      successfulDisplays++;
    }

    results.push({
      verse: tv.desc,
      pos: w.ar_word_position,
      word: w.ar_word,
      original: modalOriginal,
      strongs: modalStrongs,
      transliteration: w.transliteration || '',
      meaning: modalMeaning ? modalMeaning.substring(0, 40) : '',
      components_count: components.length
    });

    console.log(`  👉 ضغط المستخدم على: «${w.ar_word}» (موضع ${w.ar_word_position})`);
    console.log(`     • اللفظ الأصلي: ${modalOriginal} | سترونج: ${modalStrongs} | النطق: ${w.transliteration || '—'}`);
    console.log(`     • الشرح العربي: ${modalMeaning ? modalMeaning.substring(0, 60) : '—'}...`);
    if (components.length > 1) {
      console.log(`     • رقائق المكونات المتعددة (${components.length}): ${components.map(c => `[${c.orig_component || c.strongs_id}: ${c.strongs_id}]`).join(', ')}`);
    }
  }
}

console.log('\n========================================================================');
console.log(`SIMULATION SUMMARY:`);
console.log(`  Total Words Tapped: ${totalTaps}`);
console.log(`  Successful Informative Displays: ${successfulDisplays} (${((successfulDisplays/totalTaps)*100).toFixed(2)}%)`);
console.log('========================================================================');

fs.writeFileSync('scripts/interactive_reader_simulation_report.json', JSON.stringify(results, null, 2));
