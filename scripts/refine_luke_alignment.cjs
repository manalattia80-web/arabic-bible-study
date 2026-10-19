const fs = require('fs');
const { execFileSync } = require('child_process');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  return res && res.trim() ? JSON.parse(res) : [];
}

const gnt = JSON.parse(fs.readFileSync('scripts/data/gnt_scrivener.json', 'utf8'));

// Build empirical dictionary from the entire word_mappings table
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
  const cl = cleanWord(raw);
  const nm = normalizeArabic(cl);
  const set = new Set([cl, nm]);
  
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
  
  return Array.from(set);
}

// Semantic and contextual lexicon overrides for Luke 23 & 24
const SEMANTIC_BRIDGE = {
  // Luke 23 & 24 specific mappings
  'حاملات': 'G5342',
  'الحنوط': 'G759',
  'حنوطا': 'G759',
  'اطيابا': 'G3464',
  'أطيابا': 'G3464',
  'اعددنه': 'G2090',
  'أعددنه': 'G2090',
  'اعددن': 'G2090',
  'أعددن': 'G2090',
  'القبر': 'G3418',
  'قبر': 'G3418',
  'الفجر': 'G3722',
  'اول': 'G901',
  'أول': 'G901',
  'مدحرجا': 'G617',
  'محتارات': 'G639',
  'وقفا': 'G2186',
  'بثياب': 'G2067',
  'براقة': 'G797',
  'خائفات': 'G1719',
  'ومنكسات': 'G2827',
  'وجوههن': 'G4383',
  'اذكرن': 'G3415',
  'تذكرن': 'G3415',
  'انحنى': 'G3879',
  'متعجبا': 'G2296',
  'يتكلمان': 'G3656',
  'ويتحاوران': 'G4802',
  'عابسين': 'G4659',
  'الغبيان': 'G453',
  'والبطيئا': 'G1021',
  'اتكا': 'G2625',
  'اتكأ': 'G2625',
  'ملتهبا': 'G2545',
  'فجزعوا': 'G4422',
  'وجزعوا': 'G4422',
  'جسوني': 'G5584',
  'سمك': 'G2486',
  'مشوي': 'G3702',
  'شهد': 'G2781',
  'عسل': 'G3193',
  'منحوت': 'G2991',
  'بكتان': 'G4616',
  'كتان': 'G4616',
  'وانزله': 'G2507',
  'ولفه': 'G1794',
  'وقطع': 'G3768',
  'قط': 'G3768',
  'مصلوبين': 'G4717',
  'المصلوبين': 'G4717',
  'المعلقين': 'G2910',
  'معلقين': 'G2910',
  'يلطمن': 'G2875',
  'وينحن': 'G2354',
  'للعواقر': 'G4723',
  'والبطون': 'G2836',
  'تلد': 'G1080',
  'والثدي': 'G3149',
  'ترضع': 'G2337',
  'وللاكام': 'G1015',
  'غطينا': 'G2572',
  'بالعود': 'G3586',
  'الرطب': 'G5200',
  'باليابس': 'G3584',
  'مذنبين': 'G2557',
  'المذنبين': 'G2557',
  'يسخرون': 'G1592',
  'واظلمت': 'G4656',
  'حجاب': 'G2665',
  'استودع': 'G3908',
  'اسلم': 'G3860',
  'يققرعون': 'G5180',
  'يقرعون': 'G5180',
  'معارفه': 'G1110',
  'مشيرا': 'G1010',
  'موافقا': 'G4784',
  'يلوح': 'G2020',
  'استرحن': 'G2270',
  'كالغذيان': 'G3026',
  'كالغذيان': 'G3026',
  'كالغذيان': 'G3026',
  'كالغذيان': 'G3026',
  'كالغذيان': 'G3026',
  'الهذيان': 'G3026',
  'تظاهر': 'G4364',
  'الغذيان': 'G3026',
  'ابعد': 'G4206',
  'امكث': 'G3306',
  'مال': 'G2827',
  'وناولهما': 'G1929',
  'فاختفى': 'G855',
  'اختفى': 'G855',
  'مضطربين': 'G5015',
  'تخطر': 'G3053',
  'اراهما': 'G1166',
  'اراهم': 'G1166',
  'طعام': 'G1034',
  'طعام': 'G1034',
  'قدامهم': 'G1799',
  'مبتدا': 'G756',
  'فاقيموا': 'G2523',
  'تلبسوا': 'G1746',
  'الاعالي': 'G5311',
  'عنيا': 'G963',
  'يباركهم': 'G2127',
  'انفرد': 'G1339',
  'واصعد': 'G399',
  'يسبحون': 'G134',
  'ويباركون': 'G2127'
};

// Test on Luke 24:1
const v24_1 = gnt.find(x => x.book_name === 'Luke' && x.chapter === 24 && x.verse === 1);
const arTokens24_1 = 'ثُمَّ فِي أَوَّلِ الأُسْبُوعِ، أَوَّلَ الْفَجْرِ، أَتَيْنَ إِلَى الْقَبْرِ حَامِلاَتٍ الْحَنُوطَ الَّذِي أَعْدَدْنَهُ، وَمَعَهُنَّ أُنَاسٌ.'.split(/\s+/).filter(Boolean);

console.log('Testing alignment on Luke 24:1...');
for (let i = 0; i < arTokens24_1.length; i++) {
  const raw = arTokens24_1[i];
  const stems = getStems(raw);
  
  let targetSid = null;
  for (const s of stems) {
    if (SEMANTIC_BRIDGE[s]) {
      targetSid = SEMANTIC_BRIDGE[s];
      break;
    }
  }
  
  console.log(`Token ${i+1}: ${raw} -> Stems: [${stems.slice(0, 3).join(', ')}] -> Bridge: ${targetSid || 'none'}`);
}
