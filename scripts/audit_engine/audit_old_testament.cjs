// scripts/audit_engine/audit_old_testament.cjs
// Comprehensive Scientific Audit Engine for the Old Testament (Hebrew & Aramaic - 323,570 records)

const fs = require('fs');
const { execFileSync } = require('child_process');
const { cleanWord, normalizeArabic, getCandidateStems } = require('./arabic_morphology.cjs');
const { isBiblicalAramaic } = require('./aramaic_detector.cjs');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study_v18_work.db';

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 });
  return res && res.trim() ? JSON.parse(res) : [];
}

function stripHebrew(text) {
  if (!text) return '';
  return text.replace(/[\u0591-\u05C7]/gu, '').replace(/[־\s]+/g, ' ').trim();
}

console.log('Loading books and dictionaries for Old Testament...');

// Load OT Books
const books = q("SELECT id, name_ar, name_en, total_chapters FROM books WHERE id <= 39 ORDER BY id;");
const bookMap = new Map();
for (const b of books) {
  bookMap.set(b.id, b);
}

// Load all Strong's entries for Hebrew and Aramaic
console.log("Loading Strong's H entries...");
const strongsMap = new Map();
const sRows = q("SELECT strongs_id, original_word, definition_en FROM strongs_entries WHERE strongs_id LIKE 'H%';");
for (const r of sRows) {
  strongsMap.set(r.strongs_id, {
    ...r,
    stripped: stripHebrew(r.original_word)
  });
}

// Build Hebrew to Aramaic corresponding map
console.log('Building Hebrew -> Aramaic correspondence map...');
const hebrewToAramaic = new Map();
for (const [sid, entry] of strongsMap.entries()) {
  if (entry.definition_en.includes('(Aramaic)')) {
    const match = entry.definition_en.match(/corresponding to (H\d+)/i);
    if (match) {
      hebrewToAramaic.set(match[1], {
        aramaicSid: sid,
        aramaicOrig: entry.original_word,
        definition: entry.definition_en
      });
    }
  }
}
console.log(`Mapped ${hebrewToAramaic.size} Hebrew Strong's IDs to Biblical Aramaic entries.`);

// Build empirical OT dictionary from existing verified/consistent mappings
console.log('Building empirical OT dictionary...');
const dictRows = q("SELECT ar_word, strongs_id, orig_word, count(*) as cnt FROM word_mappings WHERE orig_word_lang IN ('hebrew', 'aramaic') AND strongs_id IS NOT NULL AND strongs_id != '' GROUP BY ar_word, strongs_id;");
const exactDict = new Map();
const normDict = new Map();

for (const r of dictRows) {
  const cl = cleanWord(r.ar_word);
  const s = r.strongs_id;
  const cnt = r.cnt;
  
  if (!exactDict.has(cl)) exactDict.set(cl, []);
  exactDict.get(cl).push({ sid: s, cnt, orig: r.orig_word });
  
  const nm = normalizeArabic(cl);
  if (!normDict.has(nm)) normDict.set(nm, []);
  normDict.get(nm).push({ sid: s, cnt, orig: r.orig_word });
}

// Hebrew inseparable prefixes and suffixes
const HEBREW_PREFIXES = ['וה', 'וב', 'ול', 'וכ', 'ומ', 'מש', 'כש', 'בש', 'לש', 'ו', 'ה', 'ב', 'ל', 'כ', 'מ', 'ש', ''];
const HEBREW_SUFFIXES = ['יכם', 'יהם', 'ינו', 'תכם', 'תهم', 'יך', 'יה', 'יו', 'כם', 'כן', 'הם', 'הן', 'נו', 'ות', 'ים', 'תי', 'ת', 'ך', 'ה', 'ו', 'י', ''];

function matchConsonantal(wordConsonantal, lemmaConsonantal, sid) {
  if (!wordConsonantal || !lemmaConsonantal) return false;
  if (wordConsonantal === lemmaConsonantal) return true;
  
  // Special particle rules
  if (sid === 'H4480') { // מן
    if (wordConsonantal === 'מן' || wordConsonantal.startsWith('מ') || wordConsonantal.startsWith('ומ')) return true;
  }
  if (sid === 'H834') { // אשר
    if (wordConsonantal === 'אשר' || wordConsonantal.startsWith('ש') || wordConsonantal.startsWith('כש') || wordConsonantal.startsWith('מש')) return true;
  }
  if (sid === 'H853') { // את
    if (wordConsonantal === 'את' || wordConsonantal === 'ואت' || wordConsonantal.startsWith('את') || wordConsonantal.startsWith('אות')) return true;
  }
  if (sid === 'H413') { // אל
    if (wordConsonantal === 'אל' || wordConsonantal.startsWith('אל') || wordConsonantal.startsWith('ואל')) return true;
  }
  if (sid === 'H5921') { // על
    if (wordConsonantal === 'על' || wordConsonantal.startsWith('על') || wordConsonantal.startsWith('ועל')) return true;
  }
  
  // Plural masculine construct: פנים -> פני, בנים -> בני
  let lemmaConstruct = lemmaConsonantal;
  if (lemmaConsonantal.endsWith('ים') && lemmaConsonantal.length > 2) {
    lemmaConstruct = lemmaConsonantal.slice(0, -2) + 'י';
  }
  
  for (const lem of [lemmaConsonantal, lemmaConstruct]) {
    for (const pref of HEBREW_PREFIXES) {
      if (wordConsonantal.startsWith(pref)) {
        const afterPref = wordConsonantal.slice(pref.length);
        if (afterPref === lem) return true;
        for (const suf of HEBREW_SUFFIXES) {
          if (afterPref === lem + suf) return true;
          if (lem.endsWith('ה') && afterPref === lem.slice(0, -1) + 'ת' + suf) return true;
        }
      }
    }
  }
  
  return false;
}

// Arabic prepositions that should not be wrongly reassigned
const ARABIC_PREPOSITIONS = new Set(['من', 'الى', 'إلى', 'على', 'عن', 'في', 'مع', 'تحت', 'بين', 'نحو']);

async function runOTAudit(startBook = 1, endBook = 39) {
  console.log(`Starting Scientific Audit of Old Testament (Books ${startBook} to ${endBook})...`);
  
  let stats = {
    totalRecords: 0,
    validVerified: 0,
    correctedDocumented: 0,
    syntacticCompound: 0,
    translationalFiller: 0,
    unresolvedAmbiguous: 0,
    aramaicDetectedAndFixed: 0
  };
  
  const auditBatch = [];
  const updateBatch = [];
  
  for (let bId = startBook; bId <= endBook; bId++) {
    const bInfo = bookMap.get(bId);
    if (!bInfo) continue;
    console.log(`Auditing سفر ${bInfo.name_ar} (${bInfo.name_en} - Book ${bId})...`);
    
    // Fetch all verses for this book
    const verses = q(`
      SELECT v.id, v.chapter_num, v.verse_num, v.text_avd_ar, v.text_original
      FROM verses v
      WHERE v.book_id = ${bId}
      ORDER BY v.chapter_num, v.verse_num;
    `);
    
    // Fetch all mappings for this book in one single query
    const allMappings = q(`
      SELECT wm.id, wm.verse_id, wm.ar_word_position, wm.orig_word_position, wm.ar_word, wm.orig_word, wm.orig_word_lang, wm.strongs_id, wm.is_verified
      FROM word_mappings wm
      JOIN verses v ON wm.verse_id = v.id
      WHERE v.book_id = ${bId}
      ORDER BY wm.verse_id, wm.ar_word_position;
    `);
    
    // Group mappings by verse_id
    const mappingsByVerse = new Map();
    for (const m of allMappings) {
      if (!mappingsByVerse.has(m.verse_id)) mappingsByVerse.set(m.verse_id, []);
      mappingsByVerse.get(m.verse_id).push(m);
    }
    
    for (const v of verses) {
      const citation = `${bInfo.name_ar} ${v.chapter_num}: ${v.verse_num}`;
      const isAramaicPassage = isBiblicalAramaic(bId, v.chapter_num, v.verse_num);
      const expectedLang = isAramaicPassage ? 'aramaic' : 'hebrew';
      
      const vTextOriginal = v.text_original || '';
      const vStrippedWords = stripHebrew(vTextOriginal).split(/\s+/).filter(Boolean);
      
      const mappings = mappingsByVerse.get(v.id) || [];
      
      for (const m of mappings) {
        stats.totalRecords++;
        
        const raw = m.ar_word;
        const cl = cleanWord(raw);
        const nm = normalizeArabic(cl);
        const stems = getCandidateStems(raw);
        let currentSid = m.strongs_id || '';
        let currentOrig = m.orig_word || '';
        let currentLang = m.orig_word_lang || '';
        
        let classification = 'VALID_VERIFIED';
        let evidence = '';
        let newSid = currentSid;
        let newOrig = currentOrig;
        let newLang = currentLang;
        let needsDbUpdate = false;
        
        // 1. Language validation (Hebrew vs Aramaic boundary enforcement)
        if (isAramaicPassage && currentLang !== 'aramaic') {
          newLang = 'aramaic';
          needsDbUpdate = true;
          stats.aramaicDetectedAndFixed++;
        }
        
        // 2. Biblical Aramaic Strong's conversion
        if (isAramaicPassage && currentSid && hebrewToAramaic.has(currentSid)) {
          const arEntry = hebrewToAramaic.get(currentSid);
          newSid = arEntry.aramaicSid;
          newOrig = arEntry.aramaicOrig;
          newLang = 'aramaic';
          classification = 'CORRECTED_DOCUMENTED';
          evidence = `تصحيح المدخل من العبري (${currentSid}) إلى المقابل الآرامي الدقيق (${newSid} ${newOrig}) لسياق النص الآرامي الكتابي.`;
          needsDbUpdate = true;
          stats.correctedDocumented++;
        } else if (!currentSid || currentOrig === '---' || currentSid === '') {
          // 3. Unlinked / Dash records
          // Check if it's an Arabic particle, conjunction, or filler
          if (['و', 'ف', 'في', 'من', 'إلى', 'على', 'عن', 'أن', 'قد', 'ثم', 'لكن', 'ما', 'هو', 'هي', 'هم', 'يا', 'إن', 'إذ', 'كان', 'كانت'].includes(nm) && cl.length <= 4) {
            classification = 'TRANSLATIONAL_FILLER';
            evidence = `أداة وصل/جر/تفسير عربية لا يقابلها جذر مستقل في نص الاستناد ${isAramaicPassage ? 'الآرامي' : 'العبري'}.`;
            stats.translationalFiller++;
          } else {
            // Check if there is an unassigned Hebrew/Aramaic word matching this stem
            let foundMatch = null;
            for (const stem of stems) {
              if (normDict.has(stem)) {
                for (const item of normDict.get(stem)) {
                  const sEntry = strongsMap.get(item.sid);
                  if (sEntry) {
                    // Check if this lemma appears in this verse's consonantal text
                    const inVerse = vStrippedWords.some(vw => matchConsonantal(vw, sEntry.stripped, item.sid));
                    if (inVerse) {
                      foundMatch = { sid: item.sid, orig: sEntry.original_word, def: sEntry.definition_en };
                      break;
                    }
                  }
                }
              }
              if (foundMatch) break;
            }
            
            if (foundMatch) {
              classification = 'CORRECTED_DOCUMENTED';
              newSid = foundMatch.sid;
              newOrig = foundMatch.orig;
              evidence = `استدراك ربط مفقود: الكلمة تقابل اللفظ الأصلي ${newOrig} (${newSid}: ${foundMatch.def}).`;
              needsDbUpdate = true;
              stats.correctedDocumented++;
            } else {
              classification = 'TRANSLATIONAL_FILLER';
              evidence = `كلمة تفسيرية أو صيغة لا يقابلها مدخل معجمي مستقل في الآية.`;
              stats.translationalFiller++;
            }
          }
        } else {
          // 4. Record has a Strong's ID
          const sEntry = strongsMap.get(currentSid);
          
          if (!sEntry) {
            classification = 'UNRESOLVED_AMBIGUOUS';
            evidence = `رقم سترونج المسجل (${currentSid}) غير موجود في المعجم المعتمد.`;
            stats.unresolvedAmbiguous++;
          } else {
            // Check if the lemma matches any word in the verse's Hebrew text
            const matchesVerse = vStrippedWords.some(vw => matchConsonantal(vw, sEntry.stripped, currentSid));
            
            if (matchesVerse) {
              // Word is genuinely attested in the verse text!
              if (!currentOrig || currentOrig === '---' || stripHebrew(currentOrig) !== sEntry.stripped) {
                classification = 'CORRECTED_DOCUMENTED';
                newOrig = sEntry.original_word;
                evidence = `تصحيح الرسم المعجمي للكلمة إلى ${newOrig} مع الاحتفاظ برقم سترونج الصحيح ${currentSid}.`;
                needsDbUpdate = true;
                stats.correctedDocumented++;
              } else {
                classification = 'VALID_VERIFIED';
                evidence = `مطابقة لغوية مؤكدة في نص الآية: المقابل الأصلي ${sEntry.original_word} (${currentSid}: ${sEntry.definition_en}).`;
                stats.validVerified++;
              }
            } else {
              // Strong ID does not match any consonantal word in the verse!
              // Guard: If it's an Arabic preposition, do NOT assign an unrelated noun/verb
              let candidate = null;
              if (!ARABIC_PREPOSITIONS.has(nm)) {
                for (const stem of stems) {
                  if (normDict.has(stem)) {
                    for (const item of normDict.get(stem)) {
                      const cEntry = strongsMap.get(item.sid);
                      if (cEntry && vStrippedWords.some(vw => matchConsonantal(vw, cEntry.stripped, item.sid))) {
                        candidate = { sid: item.sid, orig: cEntry.original_word, def: cEntry.definition_en };
                        break;
                      }
                    }
                  }
                  if (candidate) break;
                }
              }
              
              if (candidate) {
                classification = 'CORRECTED_DOCUMENTED';
                newSid = candidate.sid;
                newOrig = candidate.orig;
                evidence = `تصحيح رقم سترونج الخاطئ (${currentSid}) إلى المقابل الفعلي في الآية: ${newOrig} (${newSid}: ${candidate.def}).`;
                needsDbUpdate = true;
                stats.correctedDocumented++;
              } else {
                // Ambiguous or syntactic relation
                classification = 'UNRESOLVED_AMBIGUOUS';
                evidence = `رقم سترونج المسجل (${currentSid}) لا يظهر صراحة في النص الأصلي للآية؛ يحتاج مراجعة سياقية دقيقة.`;
                stats.unresolvedAmbiguous++;
              }
            }
          }
        }
        
        auditBatch.push({
          record_id: m.id,
          verse_id: v.id,
          book_id: bId,
          chapter_num: v.chapter_num,
          verse_num: v.verse_num,
          citation,
          ar_word_position: m.ar_word_position,
          orig_word_position: m.orig_word_position,
          ar_word: raw,
          orig_word_old: currentOrig,
          orig_word_new: newOrig,
          strongs_old: currentSid,
          strongs_new: newSid,
          classification,
          linguistic_evidence: evidence
        });
        
        if (needsDbUpdate) {
          updateBatch.push({
            id: m.id,
            orig_word: newOrig,
            strongs_id: newSid,
            orig_word_lang: newLang
          });
        }
      }
    }
  }
  
  console.log(`\n=== OT AUDIT SUMMARY (Books ${startBook}-${endBook}) ===`);
  console.log(`Total records audited: ${stats.totalRecords}`);
  console.log(`Valid & Verified: ${stats.validVerified} (${(100.0 * stats.validVerified / stats.totalRecords).toFixed(1)}%)`);
  console.log(`Corrected with Documentation: ${stats.correctedDocumented} (${(100.0 * stats.correctedDocumented / stats.totalRecords).toFixed(1)}%)`);
  console.log(`Translational Fillers: ${stats.translationalFiller} (${(100.0 * stats.translationalFiller / stats.totalRecords).toFixed(1)}%)`);
  console.log(`Unresolved / Ambiguous: ${stats.unresolvedAmbiguous} (${(100.0 * stats.unresolvedAmbiguous / stats.totalRecords).toFixed(1)}%)`);
  console.log(`Aramaic records fixed: ${stats.aramaicDetectedAndFixed}`);
  
  // Save to audit_log in SQLite
  console.log(`Saving ${auditBatch.length} audit records to audit_log table...`);
  const auditSqlFile = `temp_ot_audit_${startBook}_${endBook}.sql`;
  let sqlContent = 'BEGIN TRANSACTION;\n';
  
  function esc(s) {
    if (s === null || s === undefined) return "''";
    return "'" + String(s).replace(/'/g, "''") + "'";
  }
  
  for (const r of auditBatch) {
    sqlContent += `INSERT OR REPLACE INTO audit_log (record_id, verse_id, book_id, chapter_num, verse_num, citation, ar_word_position, orig_word_position, ar_word, orig_word_old, orig_word_new, strongs_old, strongs_new, classification, linguistic_evidence) VALUES (${esc(r.record_id)}, ${esc(r.verse_id)}, ${r.book_id}, ${r.chapter_num}, ${r.verse_num}, ${esc(r.citation)}, ${r.ar_word_position}, ${r.orig_word_position}, ${esc(r.ar_word)}, ${esc(r.orig_word_old)}, ${esc(r.orig_word_new)}, ${esc(r.strongs_old)}, ${esc(r.strongs_new)}, ${esc(r.classification)}, ${esc(r.linguistic_evidence)});\n`;
  }
  sqlContent += 'COMMIT;\n';
  
  fs.writeFileSync(auditSqlFile, sqlContent, 'utf8');
  execFileSync(sqlite, [db], { input: fs.readFileSync(auditSqlFile, 'utf8'), maxBuffer: 100 * 1024 * 1024 });
  fs.unlinkSync(auditSqlFile);
  console.log('Saved OT audit log!');
  
  // Apply updates to word_mappings
  if (updateBatch.length > 0) {
    console.log(`Applying ${updateBatch.length} verified corrections to word_mappings...`);
    const updateSqlFile = `temp_ot_update_${startBook}_${endBook}.sql`;
    let uSql = 'BEGIN TRANSACTION;\n';
    for (const u of updateBatch) {
      let extra = u.orig_word_lang ? `, orig_word_lang = ${esc(u.orig_word_lang)}` : '';
      uSql += `UPDATE word_mappings SET orig_word = ${esc(u.orig_word)}, strongs_id = ${esc(u.strongs_id)}${extra} WHERE id = ${esc(u.id)};\n`;
    }
    uSql += 'COMMIT;\n';
    fs.writeFileSync(updateSqlFile, uSql, 'utf8');
    execFileSync(sqlite, [db], { input: fs.readFileSync(updateSqlFile, 'utf8'), maxBuffer: 100 * 1024 * 1024 });
    fs.unlinkSync(updateSqlFile);
    console.log('Updated word_mappings for OT!');
  }
}

// Check command line arguments for start and end book
const startArg = parseInt(process.argv[2], 10) || 1;
const endArg = parseInt(process.argv[3], 10) || 39;

runOTAudit(startArg, endArg).catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
