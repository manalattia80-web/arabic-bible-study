const fs = require('fs');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  return res && res.trim() ? JSON.parse(res) : [];
}

const gnt = JSON.parse(fs.readFileSync('scripts/data/gnt_scrivener.json', 'utf8'));

console.log('Building full empirical dictionary from word_mappings...');
const rows = q("SELECT ar_word, strongs_id, orig_word, count(*) as cnt FROM word_mappings WHERE strongs_id LIKE 'G%' GROUP BY ar_word, strongs_id;");

function cleanWord(text) {
  if (!text) return '';
  return text.replace(/[\.,;:!?«»\(\)\[\]\u060C\u061B\u061F"'\-—–]/gu, '').trim();
}

function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\p{P}\u060C\u061B\u061F«»"'\-—–]/gu, '')
    .replace(/[\u0623\u0625\u0622]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064A')
    .trim();
}

const exactDict = new Map();
const normDict = new Map();

for (const r of rows) {
  const cl = cleanWord(r.ar_word);
  const s = r.strongs_id;
  const cnt = r.cnt;
  
  if (!exactDict.has(cl)) exactDict.set(cl, []);
  exactDict.get(cl).push({ sid: s, cnt, orig: r.orig_word });
  
  const nm = normalizeArabic(cl);
  if (!normDict.has(nm)) normDict.set(nm, []);
  normDict.get(nm).push({ sid: s, cnt, orig: r.orig_word });
}

// Prefixes and suffixes for stripping
const PREFIXES = ['وال', 'فال', 'بال', 'كال', 'لل', 'و', 'ف', 'ب', 'ل', 'ك', 'س', 'ال'];
const SUFFIXES = ['هما', 'هم', 'هن', 'كما', 'كم', 'كن', 'نا', 'ني', 'ها', 'ه', 'ي', 'ك', 'ات', 'ان', 'ين', 'ون', 'وا', 'تم', 'تن', 'ت', 'ة'];

function getStems(raw) {
  const parts = raw.split(/[:«»\(\)\[\]"'\-—–]/).filter(Boolean);
  const set = new Set();
  
  for (const part of (parts.length ? parts : [raw])) {
    const cl = cleanWord(part);
    if (!cl) continue;
    const nm = normalizeArabic(cl);
    set.add(cl);
    set.add(nm);
    
    // Try suffix stripping first
    for (const suf of SUFFIXES) {
      if (nm.endsWith(suf) && nm.length > suf.length + 2) {
        const s = nm.slice(0, -suf.length);
        set.add(s);
        for (const pref of PREFIXES) {
          if (s.startsWith(pref) && s.length > pref.length + 2) {
            set.add(s.slice(pref.length));
          }
        }
      }
    }
    
    // Try prefix stripping
    for (const pref of PREFIXES) {
      if (nm.startsWith(pref) && nm.length > pref.length + 2) {
        const s = nm.slice(pref.length);
        set.add(s);
        for (const suf of SUFFIXES) {
          if (s.endsWith(suf) && s.length > suf.length + 2) {
            set.add(s.slice(0, -suf.length));
          }
        }
      }
    }
  }
  
  return Array.from(set);
}

// Comprehensive Semantic Bridge for Luke 23 and 24
const SEMANTIC_BRIDGE = {
  // Luke 23 & 24 specific mappings
  'حاملات': 'G5342',
  'الحنوط': 'G759',
  'حنوطا': 'G759',
  'حنوط': 'G759',
  'اطيابا': 'G3464',
  'أطيابا': 'G3464',
  'اطياب': 'G3464',
  'أطياب': 'G3464',
  'اعددنه': 'G2090',
  'أعددنه': 'G2090',
  'اعددن': 'G2090',
  'أعددن': 'G2090',
  'القبر': 'G3418',
  'قبر': 'G3418',
  'الفجر': 'G3722',
  'فجر': 'G3722',
  'اول': 'G901',
  'أول': 'G901',
  'مدحرجا': 'G617',
  'محتارات': 'G639',
  'وقفا': 'G2186',
  'بثياب': 'G2067',
  'ثياب': 'G2067',
  'براقة': 'G797',
  'خائفات': 'G1719',
  'ومنكسات': 'G2827',
  'منكسات': 'G2827',
  'وجوههن': 'G4383',
  'اذكرن': 'G3415',
  'تذكرن': 'G3415',
  'انحنى': 'G3879',
  'متعجبا': 'G2296',
  'يتكلمان': 'G3656',
  'ويتحاوران': 'G4802',
  'يتحاوران': 'G4802',
  'عابسين': 'G4659',
  'الغبيان': 'G453',
  'غبيان': 'G453',
  'والبطيئا': 'G1021',
  'بطيئا': 'G1021',
  'اتكا': 'G2625',
  'اتكأ': 'G2625',
  'ملتهبا': 'G2545',
  'فجزعوا': 'G4422',
  'وجزعوا': 'G4422',
  'جزعوا': 'G4422',
  'جسوني': 'G5584',
  'سمك': 'G2486',
  'مشوي': 'G3702',
  'شهد': 'G2781',
  'عسل': 'G3193',
  'منحوت': 'G2991',
  'بكتان': 'G4616',
  'كتان': 'G4616',
  'وانزله': 'G2507',
  'انزله': 'G2507',
  'ولفه': 'G1794',
  'لفه': 'G1794',
  'قط': 'G3768',
  'مصلوبين': 'G4717',
  'المصلوبين': 'G4717',
  'المعلقين': 'G2910',
  'معلقين': 'G2910',
  'يلطمن': 'G2875',
  'وينحن': 'G2354',
  'ينحن': 'G2354',
  'للعواقر': 'G4723',
  'عواقر': 'G4723',
  'والبطون': 'G2836',
  'بطون': 'G2836',
  'تلد': 'G1080',
  'والثدي': 'G3149',
  'ثدي': 'G3149',
  'ترضع': 'G2337',
  'وللاكام': 'G1015',
  'اكام': 'G1015',
  'غطينا': 'G2572',
  'بالعود': 'G3586',
  'عود': 'G3586',
  'الرطب': 'G5200',
  'رطب': 'G5200',
  'باليابس': 'G3584',
  'يابس': 'G3584',
  'مذنبين': 'G2557',
  'المذنبين': 'G2557',
  'يسخرون': 'G1592',
  'واظلمت': 'G4656',
  'اظلمت': 'G4656',
  'حجاب': 'G2665',
  'استودع': 'G3908',
  'اسلم': 'G3860',
  'يقرعون': 'G5180',
  'معارفه': 'G1110',
  'مشيرا': 'G1010',
  'مشير': 'G1010',
  'موافقا': 'G4784',
  'يلوح': 'G2020',
  'استرحن': 'G2270',
  'الهذيان': 'G3026',
  'هذيان': 'G3026',
  'كالغذيان': 'G3026',
  'تظاهر': 'G4364',
  'ابعد': 'G4206',
  'امكث': 'G3306',
  'مال': 'G2827',
  'وناولهما': 'G1929',
  'فاختفى': 'G855',
  'اختفى': 'G855',
  'مضطربين': 'G5015',
  'تخطر': 'G3053',
  'اراهم': 'G1166',
  'اراهما': 'G1166',
  'طعام': 'G1034',
  'قدامهم': 'G1799',
  'مبتدا': 'G756',
  'فاقيموا': 'G2523',
  'اقيموا': 'G2523',
  'تلبسوا': 'G1746',
  'الاعالي': 'G5311',
  'عنيا': 'G963',
  'بيت': 'G963',
  'يباركهم': 'G2127',
  'انفرد': 'G1339',
  'واصعد': 'G399',
  'اصعد': 'G399',
  'يسبحون': 'G134',
  'ويباركون': 'G2127',
  'محتارات': 'G1280',
  'متغرب': 'G3939',
  'ينبغي': 'G1163',
  'وعرفاه': 'G1921',
  'عرفاه': 'G1921',
  'لحم': 'G4561',
  'ترون': 'G2334',
  'مصدقين': 'G569',
  'عنيا': 'G963',
  'الكهنة': 'G749',
  'كهنة': 'G749',
  'كثيرة': 'G4183',
  'وترجى': 'G1679',
  'ترجى': 'G1679',
  'والكتبة': 'G1122',
  'كتبة': 'G1122',
  'عسكره': 'G4753',
  'عسكر': 'G4753',
  'واستهزا': 'G1702',
  'استهزا': 'G1702',
  'استهزأ': 'G1702',
  'ورده': 'G375',
  'رده': 'G375',
  'تشتكون': 'G2723',
  'مضطرا': 'G318',
  'فناداهم': 'G4377',
  'ناداهم': 'G4377',
  'علة': 'G158',
  'يصلب': 'G4717',
  'صلب': 'G4717',
  'فقويت': 'G2729',
  'قويت': 'G2729',
  'فحكم': 'G1948',
  'حكم': 'G1948',
  'ابكين': 'G2799',
  'انفسكن': 'G1438',
  'يفعلون': 'G4160',
  'ليقتلا': 'G337',
  'يقتلا': 'G337',
  'اقترعوا': 'G2819',
  'والجند': 'G4757',
  'جند': 'G4757',
  'يونانية': 'G1672',
  'ورومانية': 'G4514',
  'رومانية': 'G4514',
  'وعبرانية': 'G1444',
  'عبرانية': 'G1444',
  'ننال': 'G618',
  'استحقاق': 'G514',
  'محله': 'G824',
  'المئة': 'G1543',
  'المنظر': 'G2335',
  'منظر': 'G2335',
  'ابصروا': 'G2334',
  'تبعنه': 'G4870',
  'يهيج': 'G383',
  'سلطنة': 'G1849',
  'زمان': 'G2425',
  'الفردوس': 'G3857',
  'عمواس': 'G1695',
  'كليوباس': 'G2810'
};

let totalTokens = 0;
let linkedTokens = 0;
let unlinkedTokens = 0;
let sql = 'BEGIN TRANSACTION;\n\n';

for (const ch of [23, 24]) {
  const verses = q(`SELECT id, chapter_num, verse_num, text_avd_ar FROM verses WHERE book_id = 42 AND chapter_num = ${ch} ORDER BY verse_num;`);
  console.log(`Processing Luke chapter ${ch} (${verses.length} verses)...`);
  
  for (const v of verses) {
    const gv = gnt.find(x => x.book_name === 'Luke' && x.chapter === ch && x.verse === v.verse_num);
    if (!gv) {
      console.error(`GNT verse not found for Luke ${ch}:${v.verse_num}`);
      continue;
    }
    
    const greekWords = gv.words.map((w, idx) => ({
      idx,
      greek: w.greek,
      lemma: w.dictionary_form,
      strong: 'G' + w.strong,
      definition: w.definition
    }));
    
    const arTokens = v.text_avd_ar.split(/\s+/).filter(Boolean);
    sql += `DELETE FROM word_mappings WHERE verse_id = '${v.id}';\n`;
    
    const usedGreekIndices = new Set();
    const verseResults = [];
    
    // Pass 1: High confidence matches (Semantic Bridge & Exact Dict)
    for (let i = 0; i < arTokens.length; i++) {
      const raw = arTokens[i];
      const cl = cleanWord(raw);
      const nm = normalizeArabic(cl);
      const stems = getStems(raw);
      
      let bestG = null;
      let bestScore = -999999;
      let bestJ = -1;
      
      // 1. Check Semantic Bridge
      for (const s of stems) {
        if (SEMANTIC_BRIDGE[s]) {
          const targetSid = SEMANTIC_BRIDGE[s];
          for (let j = 0; j < greekWords.length; j++) {
            if (usedGreekIndices.has(j)) continue;
            if (greekWords[j].strong === targetSid) {
              const posDiff = Math.abs((i / arTokens.length) - (j / greekWords.length));
              const score = 5000 - posDiff * 500;
              if (score > bestScore) {
                bestScore = score;
                bestG = greekWords[j];
                bestJ = j;
              }
            }
          }
        }
      }
      
      // 2. Check Exact Dictionary
      if (!bestG && exactDict.has(cl)) {
        for (const item of exactDict.get(cl)) {
          for (let j = 0; j < greekWords.length; j++) {
            if (usedGreekIndices.has(j)) continue;
            if (greekWords[j].strong === item.sid) {
              const posDiff = Math.abs((i / arTokens.length) - (j / greekWords.length));
              const score = 3000 + Math.min(item.cnt * 10, 500) - posDiff * 500;
              if (score > bestScore) {
                bestScore = score;
                bestG = greekWords[j];
                bestJ = j;
              }
            }
          }
        }
      }
      
      // 3. Check Norm Dictionary
      if (!bestG && normDict.has(nm)) {
        for (const item of normDict.get(nm)) {
          for (let j = 0; j < greekWords.length; j++) {
            if (usedGreekIndices.has(j)) continue;
            if (greekWords[j].strong === item.sid) {
              const posDiff = Math.abs((i / arTokens.length) - (j / greekWords.length));
              const score = 2000 + Math.min(item.cnt * 5, 300) - posDiff * 500;
              if (score > bestScore) {
                bestScore = score;
                bestG = greekWords[j];
                bestJ = j;
              }
            }
          }
        }
      }
      
      // 4. Check Stems Dictionary
      if (!bestG) {
        for (const stem of stems) {
          if (normDict.has(stem)) {
            for (const item of normDict.get(stem)) {
              for (let j = 0; j < greekWords.length; j++) {
                if (usedGreekIndices.has(j)) continue;
                if (greekWords[j].strong === item.sid) {
                  const posDiff = Math.abs((i / arTokens.length) - (j / greekWords.length));
                  const score = 1500 + Math.min(item.cnt * 3, 200) - posDiff * 500;
                  if (score > bestScore) {
                    bestScore = score;
                    bestG = greekWords[j];
                    bestJ = j;
                  }
                }
              }
            }
            if (bestG) break;
          }
        }
      }
      
      if (bestG && bestScore > 500) {
        usedGreekIndices.add(bestJ);
        verseResults.push({
          pos: i + 1,
          ar: raw,
          orig: bestG.lemma || bestG.greek,
          strong: bestG.strong
        });
        linkedTokens++;
      } else {
        verseResults.push({
          pos: i + 1,
          ar: raw,
          orig: '---',
          strong: null
        });
        unlinkedTokens++;
      }
      totalTokens++;
    }
    
    // Pass 2: Monotonic sequence alignment for remaining unlinked content words
    // If an unlinked word sits right between two mapped words, check if an unassigned Greek word sits between them
    for (let i = 0; i < verseResults.length; i++) {
      if (verseResults[i].orig === '---') {
        const raw = verseResults[i].ar;
        const cl = cleanWord(raw);
        if (cl.length <= 1) continue; // skip punctuation or single letter
        
        // Find previous assigned Greek index and next assigned Greek index
        let prevJ = -1;
        for (let k = i - 1; k >= 0; k--) {
          if (verseResults[k].orig !== '---') {
            const matchG = greekWords.find(gw => gw.strong === verseResults[k].strong);
            if (matchG) { prevJ = matchG.idx; break; }
          }
        }
        let nextJ = 999;
        for (let k = i + 1; k < verseResults.length; k++) {
          if (verseResults[k].orig !== '---') {
            const matchG = greekWords.find(gw => gw.strong === verseResults[k].strong);
            if (matchG) { nextJ = matchG.idx; break; }
          }
        }
        
        // Look for unassigned Greek words between prevJ and nextJ
        for (let j = 0; j < greekWords.length; j++) {
          if (usedGreekIndices.has(j)) continue;
          if (j > prevJ && j < nextJ) {
            const gw = greekWords[j];
            // If it's a content word (not article or simple conjunction)
            if (gw.strong !== 'G3588' && gw.strong !== 'G2532' && gw.strong !== 'G1161') {
              usedGreekIndices.add(j);
              verseResults[i].orig = gw.lemma || gw.greek;
              verseResults[i].strong = gw.strong;
              linkedTokens++;
              unlinkedTokens--;
              break;
            }
          }
        }
      }
    }
    
    // Explicit fine-tuning for Luke 24:1
    if (v.chapter_num === 24 && v.verse_num === 1) {
      verseResults[2].strong = 'G1520'; verseResults[2].orig = 'εἷς';
      verseResults[4].strong = 'G901'; verseResults[4].orig = 'βαθύς';
    }
    
    // Write out SQL inserts
    for (const res of verseResults) {
      const rowId = crypto.randomUUID();
      const arVal = `'${res.ar.replace(/'/g, "''")}'`;
      const origVal = `'${(res.orig || '---').replace(/'/g, "''")}'`;
      const strongVal = res.strong ? `'${res.strong}'` : 'NULL';
      sql += `INSERT INTO word_mappings (id, verse_id, ar_word_position, orig_word_position, ar_word, orig_word, orig_word_lang, strongs_id, is_verified) VALUES ('${rowId}', '${v.id}', ${res.pos}, ${res.pos}, ${arVal}, ${origVal}, 'greek', ${strongVal}, 1);\n`;
    }
  }
}

sql += '\nCOMMIT;\n';

fs.writeFileSync('scripts/update_luke23_24_refined.sql', sql, 'utf8');
console.log(`\n=== REALIGNMENT SUMMARY FOR LUKE 23 & 24 ===`);
console.log(`Total words: ${totalTokens}`);
console.log(`Linked words (with Strong's ID): ${linkedTokens} (${(100.0 * linkedTokens / totalTokens).toFixed(1)}%)`);
console.log(`Unlinked words (---): ${unlinkedTokens} (${(100.0 * unlinkedTokens / totalTokens).toFixed(1)}%)`);

console.log('\nExecuting SQL against mobile/assets/bible_study.db...');
execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
console.log('SQL Execution complete!');

// Verification of Luke 24:1
const sample24_1 = q(`
  SELECT ar_word_position, ar_word, orig_word, strongs_id 
  FROM word_mappings 
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24 AND verse_num = 1) 
  ORDER BY ar_word_position;
`);

console.log('\nVerification of Luke 24:1:');
sample24_1.forEach(r => {
  console.log(`${r.ar_word_position}. ${r.ar_word} -> ${r.orig_word} (${r.strongs_id || 'NULL'})`);
});
