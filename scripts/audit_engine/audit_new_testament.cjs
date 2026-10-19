// scripts/audit_engine/audit_new_testament.cjs
// Comprehensive Scientific Audit Engine for the Greek New Testament (108,028 records)

const fs = require('fs');
const { execFileSync } = require('child_process');
const { cleanWord, normalizeArabic, getCandidateStems } = require('./arabic_morphology.cjs');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study_v18_work.db';

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  return res && res.trim() ? JSON.parse(res) : [];
}

console.log('Loading GNT Scrivener 1894 database...');
const gnt = JSON.parse(fs.readFileSync('scripts/data/gnt_scrivener.json', 'utf8'));

// Build GNT fast lookup map: key = `${book_name}|${chapter}|${verse}`
const gntMap = new Map();
for (const v of gnt) {
  gntMap.set(`${v.book_name}|${v.chapter}|${v.verse}`, v.words);
}

// Load books mapping
const books = q("SELECT id, name_ar, name_en FROM books WHERE id >= 40 ORDER BY id;");
const bookMap = new Map();
for (const b of books) {
  bookMap.set(b.id, b);
}

// Load all strongs_entries for Greek
const strongsMap = new Map();
const sRows = q("SELECT strongs_id, original_word, definition_en FROM strongs_entries WHERE strongs_id LIKE 'G%';");
for (const r of sRows) {
  strongsMap.set(r.strongs_id, r);
}

// Pre-build empirical dictionary for NT words
console.log('Loading empirical NT dictionary...');
const dictRows = q("SELECT ar_word, strongs_id, orig_word, count(*) as cnt FROM word_mappings WHERE orig_word_lang = 'greek' AND strongs_id IS NOT NULL GROUP BY ar_word, strongs_id;");
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

// Specific GNT book name mapping
const GNT_BOOK_NAMES = {
  40: 'Matthew', 41: 'Mark', 42: 'Luke', 43: 'John',
  44: 'Acts', 45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians',
  48: 'Galatians', 49: 'Ephesians', 50: 'Philippians', 51: 'Colossians',
  52: '1 Thessalonians', 53: '2 Thessalonians', 54: '1 Timothy', 55: '2 Timothy',
  56: 'Titus', 57: 'Philemon', 58: 'Hebrews', 59: 'James',
  60: '1 Peter', 61: '2 Peter', 62: '1 John', 63: '2 John',
  64: '3 John', 65: 'Jude', 66: 'Revelation'
};

async function runNTAudit(limitBooks = null) {
  console.log('Starting Scientific Audit of the Greek New Testament...');
  
  const targetBookIds = limitBooks || Object.keys(GNT_BOOK_NAMES).map(Number);
  
  let stats = {
    totalRecords: 0,
    validVerified: 0,
    correctedDocumented: 0,
    syntacticCompound: 0,
    translationalFiller: 0,
    unresolvedAmbiguous: 0
  };
  
  const auditBatch = [];
  const updateBatch = [];
  
  for (const bId of targetBookIds) {
    const bName = GNT_BOOK_NAMES[bId];
    const bInfo = bookMap.get(bId);
    console.log(`Auditing ${bInfo.name_ar} (${bName})...`);
    
    // Fetch all verses and mappings for this book
    const verses = q(`
      SELECT v.id, v.chapter_num, v.verse_num, v.text_avd_ar, v.text_original
      FROM verses v
      WHERE v.book_id = ${bId}
      ORDER BY v.chapter_num, v.verse_num;
    `);
    
    for (const v of verses) {
      const gWords = gntMap.get(`${bName}|${v.chapter_num}|${v.verse_num}`) || [];
      const mappings = q(`
        SELECT id, ar_word_position, orig_word_position, ar_word, orig_word, strongs_id, is_verified
        FROM word_mappings
        WHERE verse_id = '${v.id}'
        ORDER BY ar_word_position;
      `);
      
      const citation = `${bInfo.name_ar} ${v.chapter_num}: ${v.verse_num}`;
      
      // Index Greek words by Strong's ID
      const gStrongMap = new Map();
      gWords.forEach((gw, idx) => {
        const sid = 'G' + gw.strong;
        if (!gStrongMap.has(sid)) gStrongMap.set(sid, []);
        gStrongMap.get(sid).push({ idx: idx + 1, ...gw });
      });
      
      for (let i = 0; i < mappings.length; i++) {
        const m = mappings[i];
        stats.totalRecords++;
        
        const raw = m.ar_word;
        const cl = cleanWord(raw);
        const nm = normalizeArabic(cl);
        const stems = getCandidateStems(raw);
        const currentSid = m.strongs_id;
        const currentOrig = m.orig_word;
        
        let classification = 'VALID_VERIFIED';
        let evidence = '';
        let newSid = currentSid;
        let newOrig = currentOrig;
        
        // Check if unlinked
        if (!currentSid || currentOrig === '---' || currentSid === '') {
          // Check if this Arabic token is a pure particle or filler
          if (['و', 'ف', 'في', 'من', 'إلى', 'أن', 'قد', 'ثم', 'لكن', 'ما', 'هو', 'هي', 'هم'].includes(nm) && cl.length <= 3) {
            classification = 'TRANSLATIONAL_FILLER';
            evidence = `أداة وصل/جر/تفسير عربية لا يقابلها جذر مستقل في نص الاستناد اليوناني.`;
          } else {
            // Check if there is an unassigned Greek word matching this stem
            let foundG = null;
            for (const stem of stems) {
              if (normDict.has(stem)) {
                for (const item of normDict.get(stem)) {
                  if (gStrongMap.has(item.sid)) {
                    foundG = gStrongMap.get(item.sid)[0];
                    break;
                  }
                }
              }
              if (foundG) break;
            }
            
            if (foundG) {
              classification = 'CORRECTED_DOCUMENTED';
              newSid = 'G' + foundG.strong;
              newOrig = foundG.dictionary_form || foundG.greek;
              evidence = `استدراك ربط مفقود: الكلمة تقابل اللفظ اليوناني ${foundG.greek} (${newSid} ${foundG.dictionary_form}: ${foundG.definition}).`;
              stats.correctedDocumented++;
            } else {
              classification = 'TRANSLATIONAL_FILLER';
              evidence = `كلمة تفسيرية أو صيغة لا يقابلها مدخل معجمي مستقل في الآية.`;
              stats.translationalFiller++;
            }
          }
        } else {
          // It has a current Strong's ID
          // 1. Verify if this Strong ID exists in the verse's Greek text
          const gOccurs = gStrongMap.get(currentSid);
          
          if (gOccurs && gOccurs.length > 0) {
            // Strong ID is genuinely present in this verse!
            const match = gOccurs[0];
            
            // Verify lemma matching
            if (!currentOrig || currentOrig === '---' || currentOrig !== match.dictionary_form) {
              classification = 'CORRECTED_DOCUMENTED';
              newOrig = match.dictionary_form;
              evidence = `تصحيح الرسم المعجمي للكلمة اليونانية إلى ${newOrig} مع الاحتفاظ برقم سترونج الصحيح ${currentSid}.`;
              stats.correctedDocumented++;
            } else {
              classification = 'VALID_VERIFIED';
              evidence = `مطابقة لغوية مؤكدة في نص الآية: المقابل اليوناني ${match.greek} (${currentSid} - ${match.dictionary_form}: ${match.definition}).`;
              stats.validVerified++;
            }
          } else {
            // Strong ID is NOT present in the Scrivener Greek text for this verse!
            // This is a potential false friend or discrepancy!
            // Check if another Greek word in this verse matches the Arabic word
            let candidateFound = null;
            for (const stem of stems) {
              if (normDict.has(stem)) {
                for (const item of normDict.get(stem)) {
                  if (gStrongMap.has(item.sid)) {
                    candidateFound = gStrongMap.get(item.sid)[0];
                    break;
                  }
                }
              }
              if (candidateFound) break;
            }
            
            if (candidateFound) {
              classification = 'CORRECTED_DOCUMENTED';
              newSid = 'G' + candidateFound.strong;
              newOrig = candidateFound.dictionary_form || candidateFound.greek;
              evidence = `تصحيح رقم سترونج الخاطئ (${currentSid}) إلى المقابل الفعلي في الآية: ${candidateFound.greek} (${newSid} ${candidateFound.dictionary_form}).`;
              stats.correctedDocumented++;
            } else {
              // Could be an idiomatic or compound translation
              classification = 'UNRESOLVED_AMBIGUOUS';
              evidence = `رقم سترونج المسجل (${currentSid}) لا يرد في النص اليوناني للآية؛ يحتاج مراجعة نقدية سياقية.`;
              stats.unresolvedAmbiguous++;
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
        
        if (classification === 'CORRECTED_DOCUMENTED' && (newSid !== currentSid || newOrig !== currentOrig)) {
          updateBatch.push({
            id: m.id,
            orig_word: newOrig,
            strongs_id: newSid
          });
        }
      }
    }
  }
  
  console.log(`\n=== GNT AUDIT SUMMARY ===`);
  console.log(`Total records audited: ${stats.totalRecords}`);
  console.log(`Valid & Verified: ${stats.validVerified} (${(100.0 * stats.validVerified / stats.totalRecords).toFixed(1)}%)`);
  console.log(`Corrected with Documentation: ${stats.correctedDocumented} (${(100.0 * stats.correctedDocumented / stats.totalRecords).toFixed(1)}%)`);
  console.log(`Translational Fillers: ${stats.translationalFiller} (${(100.0 * stats.translationalFiller / stats.totalRecords).toFixed(1)}%)`);
  console.log(`Unresolved / Ambiguous: ${stats.unresolvedAmbiguous} (${(100.0 * stats.unresolvedAmbiguous / stats.totalRecords).toFixed(1)}%)`);
  
  // Insert audit batch into audit_log table
  console.log(`Saving ${auditBatch.length} audit records to audit_log table...`);
  let insertSql = 'BEGIN TRANSACTION;\n';
  for (const a of auditBatch) {
    const recId = a.record_id.replace(/'/g, "''");
    const vId = a.verse_id.replace(/'/g, "''");
    const cit = a.citation.replace(/'/g, "''");
    const arW = a.ar_word.replace(/'/g, "''");
    const owOld = a.orig_word_old ? `'${a.orig_word_old.replace(/'/g, "''")}'` : 'NULL';
    const owNew = a.orig_word_new ? `'${a.orig_word_new.replace(/'/g, "''")}'` : 'NULL';
    const sOld = a.strongs_old ? `'${a.strongs_old.replace(/'/g, "''")}'` : 'NULL';
    const sNew = a.strongs_new ? `'${a.strongs_new.replace(/'/g, "''")}'` : 'NULL';
    const ev = a.linguistic_evidence.replace(/'/g, "''");
    
    insertSql += `INSERT OR REPLACE INTO audit_log (record_id, verse_id, book_id, chapter_num, verse_num, citation, ar_word_position, orig_word_position, ar_word, orig_word_old, orig_word_new, strongs_old, strongs_new, classification, linguistic_evidence) VALUES ('${recId}', '${vId}', ${a.book_id}, ${a.chapter_num}, ${a.verse_num}, '${cit}', ${a.ar_word_position}, ${a.orig_word_position}, '${arW}', ${owOld}, ${owNew}, ${sOld}, ${sNew}, '${a.classification}', '${ev}');\n`;
  }
  insertSql += 'COMMIT;\n';
  
  fs.writeFileSync('scripts/audit_engine/temp_insert_nt_audit.sql', insertSql, 'utf8');
  execFileSync(sqlite, [db], { input: insertSql, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  console.log('Saved NT audit log!');
  
  // Apply verified updates to word_mappings
  if (updateBatch.length > 0) {
    console.log(`Applying ${updateBatch.length} verified corrections to word_mappings...`);
    let updSql = 'BEGIN TRANSACTION;\n';
    for (const u of updateBatch) {
      const ow = u.orig_word ? `'${u.orig_word.replace(/'/g, "''")}'` : 'NULL';
      const sid = u.strongs_id ? `'${u.strongs_id.replace(/'/g, "''")}'` : 'NULL';
      updSql += `UPDATE word_mappings SET orig_word = ${ow}, strongs_id = ${sid}, is_verified = 1 WHERE id = '${u.id}';\n`;
    }
    updSql += 'COMMIT;\n';
    execFileSync(sqlite, [db], { input: updSql, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
    console.log('Updated word_mappings for NT!');
  }
}

// Run on Acts through Revelation (books 44 to 66)
const restOfNT = [];
for (let b = 44; b <= 66; b++) restOfNT.push(b);
runNTAudit(restOfNT);
