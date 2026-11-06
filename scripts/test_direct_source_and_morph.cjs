const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const oshbDir = path.resolve(__dirname, 'data/oshb');

function extractOshbVerse(bookName, osisID) {
  const xmlFile = path.join(oshbDir, `${bookName}.xml`);
  const xmlText = fs.readFileSync(xmlFile, 'utf8');
  const verseRegex = new RegExp(`<verse\\s+osisID="${osisID}">([\\s\\S]*?)</verse>`);
  const match = xmlText.match(verseRegex);
  if (!match) throw new Error(`Verse ${osisID} not found in ${bookName}.xml`);
  const verseContent = match[1];

  const wRegex = /<w\s+([^>]*?)>([\s\S]*?)<\/w>/g;
  const words = [];
  let wMatch;
  let idx = 1;
  while ((wMatch = wRegex.exec(verseContent)) !== null) {
    const attrs = wMatch[1];
    const text = wMatch[2].replace(/<[^>]+>/g, '').trim();
    const lemmaMatch = attrs.match(/lemma="([^"]+)"/);
    const morphMatch = attrs.match(/morph="([^"]+)"/);
    const idMatch = attrs.match(/id="([^"]+)"/);

    words.push({
      index: idx++,
      id: idMatch ? idMatch[1] : null,
      lemma: lemmaMatch ? lemmaMatch[1] : null,
      morph: morphMatch ? morphMatch[1] : null,
      text: text,
      cleanSurface: text.replace(/[\/\u05BD\u05BE]/g, '')
    });
  }
  return words;
}

function query(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_direct_test.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    const res = execSync(`"${SQLITE}" "${DB}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 });
    return res.toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

// 33 comprehensive cases with full morphology breakdown and direct source matching
const cases = [
  // 1. Exodus 15:2 w8 (إلهي)
  {
    ref: 'Exod 15:2 w8 (إلهي)', book: 2, ch: 15, vs: 2, pos: 8,
    expStrongs: 'H410', expOrig: 'אֵל', expSurface: 'אֵלִי֙',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'HNcmsc/Sp1cs', expLoc: 'OSHB:B2.C15.V2.w8',
    oshbBook: 'Exod', oshbOsis: 'Exod.15.2', oshbWordIndex: 8, oshbExpectedId: '02ehU'
  },

  // 2. Leviticus 26:12 w2 (بينكم)
  {
    ref: 'Lev 26:12 w2 (بينكم)', book: 3, ch: 26, vs: 12, pos: 2,
    expStrongs: 'H8432', expOrig: 'תָּוֶךְ', expSurface: 'בְּתוֹכְכֶם',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'HR/Ncmsc/Sp2mp', expLoc: 'OSHB:B3.C26.V12.w2',
    oshbBook: 'Lev', oshbOsis: 'Lev.26.12', oshbWordIndex: 2, oshbExpectedId: '03yxa'
  },

  // 3. Deuteronomy 6:5 w7 (ومن)
  {
    ref: 'Deut 6:5 w7 (ومن)', book: 5, ch: 6, vs: 5, pos: 7,
    expStrongs: 'H3605', expOrig: 'כֹּל', expSurface: 'וּבְכָל',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'HC/R/Ncmsc', expLoc: 'OSHB:B5.C6.V5.w7',
    oshbBook: 'Deut', oshbOsis: 'Deut.6.5', oshbWordIndex: 7, oshbExpectedId: '05jFT'
  },
  // 4. Deuteronomy 6:5 w9 (نفسك)
  {
    ref: 'Deut 6:5 w9 (نفسك)', book: 5, ch: 6, vs: 5, pos: 9,
    expStrongs: 'H5315', expOrig: 'נֶפֶשׁ', expSurface: 'נַפְשְׁךָ֖',
    expPos: 'noun', expGender: 'common', expNumber: 'singular', expPerson: null,
    expMorph: 'HNcbsc/Sp2ms', expLoc: 'OSHB:B5.C6.V5.w8',
    oshbBook: 'Deut', oshbOsis: 'Deut.6.5', oshbWordIndex: 8, oshbExpectedId: '05VEv'
  },
  // 5. Deuteronomy 6:5 w10 (ومن)
  {
    ref: 'Deut 6:5 w10 (ومن)', book: 5, ch: 6, vs: 5, pos: 10,
    expStrongs: 'H3605', expOrig: 'כֹּל', expSurface: 'וּבְכָל',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'HC/R/Ncmsc', expLoc: 'OSHB:B5.C6.V5.w9',
    oshbBook: 'Deut', oshbOsis: 'Deut.6.5', oshbWordIndex: 9, oshbExpectedId: '05dWK'
  },

  // 6. Joshua 1:9 w14 (تذهب)
  {
    ref: 'Josh 1:9 w14 (تذهب)', book: 6, ch: 1, vs: 9, pos: 14,
    expStrongs: 'H1980', expOrig: 'הָלַךְ', expSurface: 'תֵּלֵֽךְ׃',
    expPos: 'verb', expGender: 'masculine', expNumber: 'singular', expPerson: '2',
    expMorph: 'HVqi2ms', expLoc: 'OSHB:B6.C1.V9.w15',
    oshbBook: 'Josh', oshbOsis: 'Josh.1.9', oshbWordIndex: 15, oshbExpectedId: '06oAj'
  },

  // 7. 1 Kings 18:21 w6 (وقال)
  {
    ref: '1 Kings 18:21 w6 (وقال)', book: 11, ch: 18, vs: 21, pos: 6,
    expStrongs: 'H559', expOrig: 'אָמַר', expSurface: 'וַיֹּ֙אמֶר֙',
    expPos: 'verb', expGender: 'masculine', expNumber: 'singular', expPerson: '3',
    expMorph: 'HC/Vqw3ms', expLoc: 'OSHB:B11.C18.V21.w6',
    oshbBook: '1Kgs', oshbOsis: '1Kgs.18.21', oshbWordIndex: 6, oshbExpectedId: '11J7S'
  },
  // 8. 1 Kings 18:21 w7 (حتى)
  {
    ref: '1 Kings 18:21 w7 (حتى)', book: 11, ch: 18, vs: 21, pos: 7,
    expStrongs: 'H5704', expOrig: 'עַד', expSurface: 'עַד־',
    expPos: 'preposition', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'HR', expLoc: 'OSHB:B11.C18.V21.w7',
    oshbBook: '1Kgs', oshbOsis: '1Kgs.18.21', oshbWordIndex: 7, oshbExpectedId: '11BM3'
  },
  // 9. 1 Kings 18:21 w8 (متى)
  {
    ref: '1 Kings 18:21 w8 (متى)', book: 11, ch: 18, vs: 21, pos: 8,
    expStrongs: 'H4970', expOrig: 'מָתַי', expSurface: 'מָתַ֞י',
    expPos: 'particle', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'HTi', expLoc: 'OSHB:B11.C18.V21.w8',
    oshbBook: '1Kgs', oshbOsis: '1Kgs.18.21', oshbWordIndex: 8, oshbExpectedId: '113MM'
  },
  // 10. 1 Kings 18:21 w12 (إن)
  {
    ref: '1 Kings 18:21 w12 (إن)', book: 11, ch: 18, vs: 21, pos: 12,
    expStrongs: 'H518', expOrig: 'אִם', expSurface: 'אִם־',
    expPos: 'conjunction', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'HC', expLoc: 'OSHB:B11.C18.V21.w14',
    oshbBook: '1Kgs', oshbOsis: '1Kgs.18.21', oshbWordIndex: 14, oshbExpectedId: '11r5s'
  },
  // 11. 1 Kings 18:21 w17 (فاتبعوه)
  {
    ref: '1 Kings 18:21 w17 (فاتبعوه)', book: 11, ch: 18, vs: 21, pos: 17,
    expStrongs: 'H1980', expOrig: 'הָלַךְ', expSurface: 'לְכ֣וּ אַחֲרָ֔יו',
    expPos: 'verb', expGender: 'masculine', expNumber: 'plural', expPerson: '2',
    expMorph: 'HVqv2mp', expLoc: 'OSHB:B11.C18.V21.w17',
    oshbBook: '1Kgs', oshbOsis: '1Kgs.18.21', oshbWordIndex: 17, oshbExpectedId: '11u4c'
  },
  // 12. 1 Kings 18:21 w18 (وإن)
  {
    ref: '1 Kings 18:21 w18 (وإن)', book: 11, ch: 18, vs: 21, pos: 18,
    expStrongs: 'H518', expOrig: 'אִם', expSurface: 'וְאִם־',
    expPos: 'conjunction', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'HC/C', expLoc: 'OSHB:B11.C18.V21.w19',
    oshbBook: '1Kgs', oshbOsis: '1Kgs.18.21', oshbWordIndex: 19, oshbExpectedId: '11Azr'
  },
  // 13. 1 Kings 18:21 w21 (فاتبعوه)
  {
    ref: '1 Kings 18:21 w21 (فاتبعوه)', book: 11, ch: 18, vs: 21, pos: 21,
    expStrongs: 'H1980', expOrig: 'הָלַךְ', expSurface: 'לְכ֣וּ אַחֲרָ֑יו',
    expPos: 'verb', expGender: 'masculine', expNumber: 'plural', expPerson: '2',
    expMorph: 'HVqv2mp', expLoc: 'OSHB:B11.C18.V21.w21',
    oshbBook: '1Kgs', oshbOsis: '1Kgs.18.21', oshbWordIndex: 21, oshbExpectedId: '11KxK'
  },

  // 14. Zechariah 4:6 w5 (كلمة)
  {
    ref: 'Zech 4:6 w5 (كلمة)', book: 38, ch: 4, vs: 6, pos: 5,
    expStrongs: 'H1697', expOrig: 'דָּבָר', expSurface: 'דְּבַר־',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'HNcmsc', expLoc: 'OSHB:B38.C4.V6.w6',
    oshbBook: 'Zech', oshbOsis: 'Zech.4.6', oshbWordIndex: 6, oshbExpectedId: '38CmP'
  },

  // 15. Ezra 5:8 w3 (لدى)
  {
    ref: 'Ezra 5:8 w3 (لدى)', book: 15, ch: 5, vs: 8, pos: 3,
    expStrongs: 'H4430', expOrig: 'מֶלֶךְ', expSurface: 'לְמַלְכָּ֗א',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'AR/Ncmsd/Td', expLoc: 'OSHB:B15.C5.V8.w3',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 3, oshbExpectedId: '15Y4b'
  },
  // 16. Ezra 5:8 w5 (أننا)
  {
    ref: 'Ezra 5:8 w5 (أننا)', book: 15, ch: 5, vs: 8, pos: 5,
    expStrongs: 'H1768', expOrig: 'דִּי', expSurface: 'דִּֽי',
    expPos: 'particle', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'ATr', expLoc: 'OSHB:B15.C5.V8.w4',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 4, oshbExpectedId: '15RWu'
  },
  // 17. Ezra 5:8 w7 (إلى)
  {
    ref: 'Ezra 5:8 w7 (إلى)', book: 15, ch: 5, vs: 8, pos: 7,
    expStrongs: 'H3061', expOrig: 'יְהוּד', expSurface: 'לִיה֤וּד',
    expPos: 'proper_noun', expGender: null, expNumber: 'singular', expPerson: null,
    expMorph: 'AR/Np', expLoc: 'OSHB:B15.C5.V8.w6',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 6, oshbExpectedId: '15DKB'
  },
  // 18. Ezra 5:8 w10 (إلى)
  {
    ref: 'Ezra 5:8 w10 (إلى)', book: 15, ch: 5, vs: 8, pos: 10,
    expStrongs: 'H1005', expOrig: 'בַּיִת', surf: 'לְבֵית֙', expSurface: 'לְבֵית֙',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'AR/Ncmsc', expLoc: 'OSHB:B15.C5.V8.w8',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 8, oshbExpectedId: '15Z2k'
  },
  // 19. Ezra 5:8 w18 (عظيمة)
  {
    ref: 'Ezra 5:8 w18 (عظيمة)', book: 15, ch: 5, vs: 8, pos: 18,
    expStrongs: 'H1560', expOrig: 'גְּלָל', expSurface: 'גְּלָ֔ל',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'ANcmsa', expLoc: 'OSHB:B15.C5.V8.w14',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 14, oshbExpectedId: '15Q3F'
  },
  // 20. Ezra 5:8 w20 (خشب)
  {
    ref: 'Ezra 5:8 w20 (خشب)', book: 15, ch: 5, vs: 8, pos: 20,
    expStrongs: 'H636', expOrig: 'אָע', expSurface: 'וְאָ֖ע',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'AC/Ncmsa', expLoc: 'OSHB:B15.C5.V8.w15',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 15, oshbExpectedId: '152Kw'
  },
  // 21. Ezra 5:8 w22 (الحيطان)
  {
    ref: 'Ezra 5:8 w22 (الحيطان)', book: 15, ch: 5, vs: 8, pos: 22,
    expStrongs: 'H3797', expOrig: 'כְּתַל', expSurface: 'בְּכֻתְלַיָּ֑א',
    expPos: 'noun', expGender: 'masculine', expNumber: 'plural', expPerson: null,
    expMorph: 'AR/Ncmpd/Td', expLoc: 'OSHB:B15.C5.V8.w17',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 17, oshbExpectedId: '15jJB'
  },
  // 22. Ezra 5:8 w23 (وهذا)
  {
    ref: 'Ezra 5:8 w23 (وهذا)', book: 15, ch: 5, vs: 8, pos: 23,
    expStrongs: 'H1791', expOrig: 'דָּךְ', expSurface: 'דָ֛ךְ',
    expPos: 'demonstrative', expGender: 'feminine', expNumber: 'singular', expPerson: null,
    expMorph: 'APdxfs', expLoc: 'OSHB:B15.C5.V8.w19',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 19, oshbExpectedId: '15bTz'
  },
  // 23. Ezra 5:8 w26 (بسرعة)
  {
    ref: 'Ezra 5:8 w26 (بسرعة)', book: 15, ch: 5, vs: 8, pos: 26,
    expStrongs: 'H629', expOrig: 'אָסְפַּרְנָא', expSurface: 'אָסְפַּ֥רְנָא',
    expPos: 'adverb', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'AD', expLoc: 'OSHB:B15.C5.V8.w20',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 20, oshbExpectedId: '15CfS'
  },

  // 24. Daniel 4:17 w1 (هذا)
  {
    ref: 'Dan 4:17 w1 (هذا)', book: 27, ch: 4, vs: 17, pos: 1,
    expStrongs: 'H6600', expOrig: 'פִּתְגָם', expSurface: 'פִּתְגָמָ֔א',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'ANcmsd/Td', expLoc: 'OSHB:B27.C4.V14.w3',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 3, oshbExpectedId: '27oC6'
  },
  // 25. Daniel 4:17 w2 (الأمر)
  {
    ref: 'Dan 4:17 w2 (الأمر)', book: 27, ch: 4, vs: 17, pos: 2,
    expStrongs: 'H6600', expOrig: 'פִּתְגָם', expSurface: 'פִּתְגָמָ֔א',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'ANcmsd/Td', expLoc: 'OSHB:B27.C4.V14.w3',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 3, oshbExpectedId: '27oC6'
  },
  // 26. Daniel 4:17 w3 (بقضاء)
  {
    ref: 'Dan 4:17 w3 (بقضاء)', book: 27, ch: 4, vs: 17, pos: 3,
    expStrongs: 'H1510', expOrig: 'גְּזֵרָה', expSurface: 'בִּגְזֵרַ֤ת',
    expPos: 'noun', expGender: 'feminine', expNumber: 'singular', expPerson: null,
    expMorph: 'AR/Ncfsc', expLoc: 'OSHB:B27.C4.V14.w1',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 1, oshbExpectedId: '27fqr'
  },
  // 27. Daniel 4:17 w5 (والحكم)
  {
    ref: 'Dan 4:17 w5 (والحكم)', book: 27, ch: 4, vs: 17, pos: 5,
    expStrongs: 'H7595', expOrig: 'שְׁאֵלָה', expSurface: 'שְׁאֵֽלְתָ֑א',
    expPos: 'noun', expGender: 'feminine', expNumber: 'singular', expPerson: null,
    expMorph: 'ANcfsd/Td', expLoc: 'OSHB:B27.C4.V14.w6',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 6, oshbExpectedId: '27TKQ'
  },
  // 28. Daniel 4:17 w6 (بكلمة)
  {
    ref: 'Dan 4:17 w6 (بكلمة)', book: 27, ch: 4, vs: 17, pos: 6,
    expStrongs: 'H3983', expOrig: 'מֵאמַר', expSurface: 'וּמֵאמַ֥ר',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'AC/Ncmsc', expLoc: 'OSHB:B27.C4.V14.w4',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 4, oshbExpectedId: '27AB9'
  },
  // 29. Daniel 4:17 w7 (القدوسين)
  {
    ref: 'Dan 4:17 w7 (القدوسين)', book: 27, ch: 4, vs: 17, pos: 7,
    expStrongs: 'H6922', expOrig: 'קַדִּישׁ', expSurface: 'קַדִּישִׁ֖ין',
    expPos: 'adjective', expGender: 'masculine', expNumber: 'plural', expPerson: null,
    expMorph: 'AAampa', expLoc: 'OSHB:B27.C4.V14.w5',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 5, oshbExpectedId: '276Bi'
  },
  // 30. Daniel 4:17 w12 (العلي)
  {
    ref: 'Dan 4:17 w12 (العلي)', book: 27, ch: 4, vs: 17, pos: 12,
    expStrongs: 'H5943', expOrig: 'עִלָּאָה', expSurface: 'עִלָּאָ֜ה',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'ANcmsd/Td', expLoc: 'OSHB:B27.C4.V14.w15',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 15, oshbExpectedId: '27bjL'
  },
  // 31. Daniel 4:17 w15 (مملكة)
  {
    ref: 'Dan 4:17 w15 (مملكة)', book: 27, ch: 4, vs: 17, pos: 15,
    expStrongs: 'H4437', expOrig: 'מַלְכוּ', expSurface: 'בְּמַלְכ֣וּת',
    expPos: 'noun', expGender: 'feminine', expNumber: 'singular', expPerson: null,
    expMorph: 'AR/Ncfsc', expLoc: 'OSHB:B27.C4.V14.w16',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 16, oshbExpectedId: '27ant'
  },
  // 32. Daniel 4:17 w18 (من)
  {
    ref: 'Dan 4:17 w18 (من)', book: 27, ch: 4, vs: 17, pos: 18,
    expStrongs: 'H4479', expOrig: 'מַן', expSurface: 'וּלְמַן',
    expPos: 'pronoun', expGender: 'common', expNumber: 'singular', expPerson: null,
    expMorph: 'AC/R/Pfxcs', expLoc: 'OSHB:B27.C4.V14.w19',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 19, oshbExpectedId: '27fns'
  },

  // 33. Galatians 5:22 w11 (صلاح)
  {
    ref: 'Gal 5:22 w11 (صلاح)', book: 48, ch: 5, vs: 22, pos: 11,
    expStrongs: 'G19', expOrig: 'ἀγαθωσύνη', expSurface: 'ἀγαθωσύνη',
    expPos: 'noun', expGender: 'feminine', expNumber: 'singular', expPerson: null,
    expMorph: 'N- ----NSF-', expLoc: 'SBLGNT:B48.C5.V22.w11'
  }
];

console.log('Testing 33 Cases across: DB vs OSHB XML Source...');

let passCount = 0;
let failCount = 0;

for (const c of cases) {
  // 1. Query DB
  const sql = `
  SELECT wm.strongs_id, wm.orig_word, wm.orig_surface, wm.orig_morphology,
         wm.morph_pos, wm.morph_gender, wm.morph_number, wm.morph_person,
         wm.verified_locator, wm.orig_word_position
  FROM word_mappings wm
  JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = ${c.book} AND v.chapter_num = ${c.ch} AND v.verse_num = ${c.vs}
    AND wm.ar_word_position = ${c.pos};
  `;
  const row = query(sql);
  if (!row) {
    console.error(`[FAIL] ${c.ref}: No DB row found!`);
    failCount++;
    continue;
  }
  const [sId, orig, surf, morph, pos, gender, num, person, loc, origPos] = row.split('|');

  // Verify DB fields
  const dbOk = sId === c.expStrongs &&
               orig === c.expOrig &&
               surf === c.expSurface &&
               morph === c.expMorph &&
               pos === c.expPos &&
               (gender || null) === c.expGender &&
               (num || null) === c.expNumber &&
               loc === c.expLoc;

  if (!dbOk) {
    console.error(`[FAIL DB] ${c.ref}:
      Expected: s=${c.expStrongs}, orig=${c.expOrig}, surf=${c.expSurface}, morph=${c.expMorph}, pos=${c.expPos}, g=${c.expGender}, n=${c.expNumber}, loc=${c.expLoc}
      Actual:   s=${sId}, orig=${orig}, surf=${surf}, morph=${morph}, pos=${pos}, g=${gender}, n=${num}, loc=${loc}`);
    failCount++;
    continue;
  }

  // 2. Open OSHB Source XML and verify the element at that index
  if (c.oshbBook) {
    const oshbWords = extractOshbVerse(c.oshbBook, c.oshbOsis);
    const targetElement = oshbWords.find(w => w.index === c.oshbWordIndex);
    if (!targetElement) {
      console.error(`[FAIL OSHB] ${c.ref}: Word index ${c.oshbWordIndex} not found in ${c.oshbBook}.xml`);
      failCount++;
      continue;
    }

    if (c.oshbExpectedId && targetElement.id !== c.oshbExpectedId) {
      console.error(`[FAIL OSHB ID] ${c.ref}: Expected id=${c.oshbExpectedId}, found id=${targetElement.id}`);
      failCount++;
      continue;
    }

    if (targetElement.morph !== c.expMorph) {
      console.error(`[FAIL OSHB MORPH] ${c.ref}: XML morph=${targetElement.morph} != Expected=${c.expMorph}`);
      failCount++;
      continue;
    }
  }

  console.log(`✓ [PASS] ${c.ref} verified against DB & OSHB Source XML (id=${c.oshbExpectedId || 'N/A'}, loc=${c.expLoc})`);
  passCount++;
}

console.log(`\nResult: ${passCount} PASSED, ${failCount} FAILED.`);
if (failCount > 0) process.exit(1);
