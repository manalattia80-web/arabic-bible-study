const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_BIN = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PATH = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function executeSql(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_repair_10v.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 }).toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

console.log('Applying comprehensive 10-verse whole-unit repairs...');

const sql = `
BEGIN TRANSACTION;

-- =========================================================================
-- 1. GENESIS 12:1 (Book 1, Ch 12, Vs 1)
-- =========================================================================
-- pos 4 "اذْهَبْ": Qal imperative 2ms of הלך H1980 (surface: לֶךְ)
UPDATE word_mappings 
SET orig_surface = 'לֶךְ',
    morph_pos = 'verb',
    morph_stem = 'qal',
    morph_tense = 'imperative',
    morph_person = '2',
    morph_gender = 'masculine',
    morph_number = 'singular',
    orig_morphology = 'Hv2ms',
    grammar_notes = 'Qal imperative 2ms of הָלַךְ (H1980), followed by ethical dative לְךָ.'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=1 AND chapter_num=12 AND verse_num=1)
  AND ar_word_position = 4;

-- =========================================================================
-- 2. JOSHUA 1:8 (Book 6, Ch 1, Vs 8)
-- =========================================================================
-- pos 1 "لاَ": negative particle לֹא H3808 (was erroneously H4480)
UPDATE word_mappings
SET strongs_id = 'H3808',
    orig_word = 'לֹא',
    orig_surface = 'לֹֽא',
    morph_pos = 'particle',
    orig_morphology = 'HTn',
    grammar_notes = 'Negative particle לֹא (H3808) negating יָמוּשׁ.'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=6 AND chapter_num=1 AND verse_num=8)
  AND ar_word_position = 1;

-- pos 8 "بَلْ": conjunction waw וְ H9002 (was erroneously H4480)
UPDATE word_mappings
SET strongs_id = 'H9002',
    orig_word = 'וְ',
    orig_surface = 'וְ',
    morph_pos = 'conjunction',
    orig_morphology = 'HC',
    grammar_notes = 'Conjunction waw (H9002) introducing the contrasting clause וְהָגִיתָ.'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=6 AND chapter_num=1 AND verse_num=8)
  AND ar_word_position = 8;

-- pos 10 "فِيهِ": preposition בְּ H9003 + 3ms suffix (was erroneously H4480)
UPDATE word_mappings
SET strongs_id = 'H9003',
    orig_word = 'בְּ',
    orig_surface = 'בֹּו',
    morph_pos = 'preposition',
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'singular',
    orig_morphology = 'HR/Sp3ms',
    grammar_notes = 'Preposition bet with 3ms suffix (in it).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=6 AND chapter_num=1 AND verse_num=8)
  AND ar_word_position = 10;

-- pos 16 "حَسَبَ": preposition kaph כְּ H9004 of comparison (was erroneously H4480)
UPDATE word_mappings
SET strongs_id = 'H9004',
    orig_word = 'כְּ',
    orig_surface = 'כְּ',
    morph_pos = 'preposition',
    orig_morphology = 'HR',
    grammar_notes = 'Preposition of comparison kaph (according to) prefixed to כָּל־.'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=6 AND chapter_num=1 AND verse_num=8)
  AND ar_word_position = 16;

-- pos 18 "مَا": relative use of article הַ H9009 in הַכָּתוּב (was erroneously H4480)
UPDATE word_mappings
SET strongs_id = 'H9009',
    orig_word = 'הַ',
    orig_surface = 'הַ',
    morph_pos = 'article',
    orig_morphology = 'HTd',
    grammar_notes = 'Definite article prefix in הַכָּתוּב functioning substantively as relative marker.'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=6 AND chapter_num=1 AND verse_num=8)
  AND ar_word_position = 18;

-- pos 19 "هُوَ": Arabic syntactic copula connecting ما to passive participle
UPDATE word_mappings
SET strongs_id = NULL,
    orig_word = '—',
    orig_surface = '—',
    morph_pos = 'syntactic_ar',
    verified_locator = 'AR_SYNTACTIC:B6.C1.V8.w19',
    grammar_notes = 'Arabic copula pronoun supplied in translation.'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=6 AND chapter_num=1 AND verse_num=8)
  AND ar_word_position = 19;

-- pos 21 "فِيهِ": preposition בְּ H9003 + 3ms suffix בּוֹ (was erroneously H4480)
UPDATE word_mappings
SET strongs_id = 'H9003',
    orig_word = 'בְּ',
    orig_surface = 'בֹּו',
    morph_pos = 'preposition',
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'singular',
    orig_morphology = 'HR/Sp3ms',
    grammar_notes = 'Preposition bet with 3ms suffix (in it).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=6 AND chapter_num=1 AND verse_num=8)
  AND ar_word_position = 21;

-- pos 22 "لأَنَّكَ": conjunction כִּי H3588 (was erroneously H4480)
UPDATE word_mappings
SET strongs_id = 'H3588',
    orig_word = 'כִּי',
    orig_surface = 'כִּי',
    morph_pos = 'conjunction',
    orig_morphology = 'HC',
    grammar_notes = 'Causal conjunction כִּי (H3588) followed by אָז.'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=6 AND chapter_num=1 AND verse_num=8)
  AND ar_word_position = 22;

-- =========================================================================
-- 3. PSALM 23:1 (Book 19, Ch 23, Vs 1)
-- =========================================================================
-- pos 5 "شَيْءٌ.": Arabic semantic complement for lack (was erroneously H4480 מִן)
UPDATE word_mappings
SET strongs_id = NULL,
    orig_word = '—',
    orig_surface = '—',
    morph_pos = 'syntactic_ar',
    verified_locator = 'AR_SYNTACTIC:B19.C23.V1.w5',
    grammar_notes = 'Arabic semantic/syntactic complement completing the negative intransitive sense of אֶחְסָר (I shall not want / lack anything); has no separate token in Hebrew text.'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=19 AND chapter_num=23 AND verse_num=1)
  AND ar_word_position = 5;

-- =========================================================================
-- 4. ISAIAH 53:5 (Book 23, Ch 53, Vs 5)
-- =========================================================================
-- pos 2 "مَجْرُوحٌ": Polal participle ms of חָלַל H2490 (was erroneously syntactic_ar)
UPDATE word_mappings
SET strongs_id = 'H2490',
    orig_word = 'חָלַל',
    orig_surface = 'מְחֹלָ֖ל',
    orig_word_position = 2,
    morph_pos = 'verb',
    morph_stem = 'polal',
    morph_tense = 'participle',
    morph_gender = 'masculine',
    morph_number = 'singular',
    orig_morphology = 'HVrPrmsa',
    verified_locator = 'OSHB:B23.C53.V5.w2',
    grammar_notes = 'Polal participle masculine singular of חָלַל (pierced/wounded).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=23 AND chapter_num=53 AND verse_num=5)
  AND ar_word_position = 2;

-- pos 3 "لأَجْلِ": preposition prefix מִـ H4480 in מִפְּשָׁעֵנוּ (was erroneously H5921 עָלָיו)
UPDATE word_mappings
SET strongs_id = 'H4480',
    orig_word = 'מִן',
    orig_surface = 'מִـ',
    orig_word_position = 3,
    morph_pos = 'preposition',
    orig_morphology = 'HR',
    verified_locator = 'OSHB:B23.C53.V5.w3',
    grammar_notes = 'Preposition min prefix indicating cause (on account of).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=23 AND chapter_num=53 AND verse_num=5)
  AND ar_word_position = 3;

-- pos 6 "لأَجْلِ": preposition prefix מֵـ H4480 in מֵעֲוֹנֹתֵינוּ (was erroneously H5921 עָלָיו)
UPDATE word_mappings
SET strongs_id = 'H4480',
    orig_word = 'מִן',
    orig_surface = 'מֵـ',
    orig_word_position = 5,
    morph_pos = 'preposition',
    orig_morphology = 'HR',
    verified_locator = 'OSHB:B23.C53.V5.w5',
    grammar_notes = 'Preposition min prefix indicating cause (on account of).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=23 AND chapter_num=53 AND verse_num=5)
  AND ar_word_position = 6;

-- pos 7 "آثَامِنَا": noun עָוֹן H5771 + 1cp suffix (was erroneously syntactic_ar)
UPDATE word_mappings
SET strongs_id = 'H5771',
    orig_word = 'עָוֹן',
    orig_surface = 'עֲוֹנֹתֵ֑ינוּ',
    orig_word_position = 5,
    morph_pos = 'noun',
    morph_number = 'plural',
    orig_morphology = 'HNcbpa/Sp1cp',
    verified_locator = 'OSHB:B23.C53.V5.w5',
    grammar_notes = 'Noun plural with 1cp pronominal suffix (our iniquities).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=23 AND chapter_num=53 AND verse_num=5)
  AND ar_word_position = 7;

-- pos 9 "سَلاَمِنَا": noun שָׁלוֹם H7965 + 1cp suffix (was erroneously syntactic_ar)
UPDATE word_mappings
SET strongs_id = 'H7965',
    orig_word = 'שָׁלוֹם',
    orig_surface = 'שְׁלֹומֵ֙נוּ֙',
    orig_word_position = 7,
    morph_pos = 'noun',
    morph_gender = 'masculine',
    morph_number = 'singular',
    orig_morphology = 'HNcmsa/Sp1cp',
    verified_locator = 'OSHB:B23.C53.V5.w7',
    grammar_notes = 'Noun masculine singular with 1cp pronominal suffix (our peace).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=23 AND chapter_num=53 AND verse_num=5)
  AND ar_word_position = 9;

-- pos 10 "عَلَيْهِ": preposition עַל H5921 + 3ms suffix
UPDATE word_mappings
SET orig_word_position = 8,
    verified_locator = 'OSHB:B23.C53.V5.w8'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=23 AND chapter_num=53 AND verse_num=5)
  AND ar_word_position = 10;

-- pos 11 "وَبِحُبُرِهِ": noun חַבּוּרָה H2250 + conj + prep + 3ms suffix (was erroneously syntactic_ar)
UPDATE word_mappings
SET strongs_id = 'H2250',
    orig_word = 'חַבּוּרָה',
    orig_surface = 'וּבַחֲבֻרָתֹ֖ו',
    orig_word_position = 9,
    morph_pos = 'noun',
    morph_gender = 'feminine',
    morph_number = 'singular',
    orig_morphology = 'HC/R/Ncfsa/Sp3ms',
    verified_locator = 'OSHB:B23.C53.V5.w9',
    grammar_notes = 'Conjunction waw + preposition bet + noun feminine singular of חַבּוּרָה (stripe/wound) + 3ms suffix.'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=23 AND chapter_num=53 AND verse_num=5)
  AND ar_word_position = 11;

-- pos 12 "شُفِينَا": Niphal 3ms רָפָא H7495 + לָנוּ (was erroneously syntactic_ar)
UPDATE word_mappings
SET strongs_id = 'H7495',
    orig_word = 'רָפָא',
    orig_surface = 'נִרְפָּא־לָֽנוּ',
    orig_word_position = 10,
    morph_pos = 'verb',
    morph_stem = 'niphal',
    morph_tense = 'perfect',
    orig_morphology = 'HVNp3ms/R/Sp1cp',
    verified_locator = 'OSHB:B23.C53.V5.w10',
    grammar_notes = 'Niphal perfect 3ms of רָפָא + preposition lamed with 1cp suffix (healing was done to us).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=23 AND chapter_num=53 AND verse_num=5)
  AND ar_word_position = 12;

-- =========================================================================
-- 5. JOHN 3:16 (Book 43, Ch 3, Vs 16)
-- =========================================================================
-- pos 2 "هكَذَا": adverb οὕτως G3779 (was erroneously verb)
UPDATE word_mappings
SET morph_pos = 'adverb',
    orig_morphology = 'ADV',
    orig_surface = 'Οὕτως',
    grammar_notes = 'Demonstrative adverb οὕτως (in this manner, so).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=43 AND chapter_num=3 AND verse_num=16)
  AND ar_word_position = 2;

-- pos 16 "بِهِ": εἰς αὐτόν -> primary G846 (αὐτός), accusative masculine singular (Greek case!)
UPDATE word_mappings
SET strongs_id = 'G846',
    orig_word = 'αὐτός',
    orig_surface = 'αὐτόν',
    orig_word_position = 18,
    morph_pos = 'pronoun',
    morph_case = 'accusative',
    morph_gender = 'masculine',
    morph_number = 'singular',
    orig_morphology = 'RP --ASM-',
    verified_locator = 'SBLGNT:B43.C3.V16.w18',
    grammar_notes = 'Personal pronoun in accusative masculine singular governed by preposition εἰς (believing INTO HIM).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=43 AND chapter_num=3 AND verse_num=16)
  AND ar_word_position = 16;

-- pos 19 "لَهُ": Arabic dative complement in Arabic idiom "تكون له" for ἔχῃ
UPDATE word_mappings
SET strongs_id = NULL,
    orig_word = '—',
    orig_surface = '—',
    morph_pos = 'syntactic_ar',
    verified_locator = 'AR_SYNTACTIC:B43.C3.V16.w19',
    grammar_notes = 'Arabic dative pronoun complement completing the idiom "تكون له" to render Greek ἔχῃ (may have).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=43 AND chapter_num=3 AND verse_num=16)
  AND ar_word_position = 19;

-- =========================================================================
-- 6. ACTS 1:8 (Book 44, Ch 1, Vs 8)
-- =========================================================================
-- pos 2 "سَتَنَالُونَ": verb future middle indicative 2p of λαμβάνω G2983
UPDATE word_mappings
SET orig_surface = 'λήμψεσθε',
    morph_pos = 'verb',
    morph_tense = 'future',
    morph_voice = 'middle',
    morph_mood = 'indicative',
    morph_person = '2',
    morph_number = 'plural',
    orig_morphology = 'V-FMI-2P',
    verified_locator = 'SBLGNT:B44.C1.V8.w2',
    grammar_notes = 'Verb future middle indicative 2p of λαμβάνω (G2983).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=1 AND verse_num=8)
  AND ar_word_position = 2;

-- pos 4 "مَتَى": temporal conjunction supplied in Arabic for genitive absolute
UPDATE word_mappings
SET strongs_id = NULL,
    orig_word = '—',
    orig_surface = '—',
    morph_pos = 'syntactic_ar',
    verified_locator = 'AR_SYNTACTIC:B44.C1.V8.w4',
    grammar_notes = 'Arabic temporal conjunction translating the temporal genitive absolute participle construction.'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=1 AND verse_num=8)
  AND ar_word_position = 4;

-- pos 5 "حَلَّ": participle ἐπελθόντος of ἐπέρχομαι G1904 (was erroneously prep ἐπί G1909)
UPDATE word_mappings
SET strongs_id = 'G1904',
    orig_word = 'ἐπέρχομαι',
    orig_surface = 'ἐπελθόντος',
    orig_word_position = 4,
    morph_pos = 'verb',
    morph_tense = 'aorist',
    morph_voice = 'active',
    morph_mood = 'participle',
    morph_case = 'genitive',
    morph_gender = 'neuter',
    morph_number = 'singular',
    orig_morphology = 'V-AAP-GSN',
    verified_locator = 'SBLGNT:B44.C1.V8.w4',
    grammar_notes = 'Aorist active participle genitive neuter singular of ἐπέρχομαι (come upon), forming genitive absolute with τοῦ ἁγίου πνεύματος.'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=1 AND verse_num=8)
  AND ar_word_position = 5;

-- pos 10 "لِي": personal pronoun 1s genitive μου G3450 (was erroneously ἔσεσθέ G1510)
UPDATE word_mappings
SET strongs_id = 'G3450',
    orig_word = 'ἐγώ',
    orig_surface = 'μου',
    orig_word_position = 11,
    morph_pos = 'pronoun',
    morph_case = 'genitive',
    morph_number = 'singular',
    morph_person = '1',
    orig_morphology = 'RP --GS1-',
    verified_locator = 'SBLGNT:B44.C1.V8.w11',
    grammar_notes = 'Personal pronoun 1st person singular genitive μου (my witnesses / witnesses unto me).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=1 AND verse_num=8)
  AND ar_word_position = 10;

-- =========================================================================
-- 7. ROMANS 8:28 (Book 45, Ch 8, Vs 28)
-- =========================================================================
-- pos 1 "وَنَحْنُ": Arabic subject pronoun translating the 1p inflection in Οἴδαμεν
UPDATE word_mappings
SET strongs_id = NULL,
    orig_word = '—',
    orig_surface = '—',
    morph_pos = 'syntactic_ar',
    verified_locator = 'AR_SYNTACTIC:B45.C8.V28.w1',
    grammar_notes = 'Arabic explicit subject pronoun rendering the 1p plural inflection of Οἴδαμεν.'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=45 AND chapter_num=8 AND verse_num=28)
  AND ar_word_position = 1;

-- pos 2 "نَعْلَمُ": verb perfect/present active indicative 1p Οἴδαμεν G1492
UPDATE word_mappings
SET morph_pos = 'verb',
    morph_tense = 'perfect',
    morph_voice = 'active',
    morph_mood = 'indicative',
    morph_person = '1',
    morph_number = 'plural',
    orig_morphology = 'V-RAI-1P',
    orig_surface = 'Οἴδαμεν',
    verified_locator = 'SBLGNT:B45.C8.V28.w1',
    grammar_notes = 'Verb perfect active indicative 1p of οἶδα (used with present sense: we know).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=45 AND chapter_num=8 AND verse_num=28)
  AND ar_word_position = 2;

-- pos 13 "هُمْ": participle οὖσιν of εἰμί G1510
UPDATE word_mappings
SET morph_pos = 'verb',
    morph_tense = 'present',
    morph_voice = 'active',
    morph_mood = 'participle',
    morph_case = 'dative',
    morph_gender = 'masculine',
    morph_number = 'plural',
    orig_morphology = 'V-PAP-DPM',
    verified_locator = 'SBLGNT:B45.C8.V28.w15'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=45 AND chapter_num=8 AND verse_num=28)
  AND ar_word_position = 13;

-- =========================================================================
-- 8. EPHESIANS 2:8 (Book 49, Ch 2, Vs 8)
-- =========================================================================
-- pos 5 "وَذلِكَ": καὶ τοῦتو -> demonstrative pronoun nominative neuter singular G3778
UPDATE word_mappings
SET strongs_id = 'G3778',
    orig_word = 'οὗτος',
    orig_surface = 'τοῦτο',
    orig_word_position = 8,
    morph_pos = 'demonstrative',
    morph_case = 'nominative',
    morph_gender = 'neuter',
    morph_number = 'singular',
    orig_morphology = 'RD ----NNN-',
    verified_locator = 'SBLGNT:B49.C2.V8.w8',
    grammar_notes = 'Demonstrative pronoun nominative neuter singular τοῦτο preceded by καί.'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=49 AND chapter_num=2 AND verse_num=8)
  AND ar_word_position = 5;

-- pos 8 "هُوَ": Arabic copula connecting subject to predicate noun θεοῦ τὸ δῶρον
UPDATE word_mappings
SET strongs_id = NULL,
    orig_word = '—',
    orig_surface = '—',
    morph_pos = 'syntactic_ar',
    verified_locator = 'AR_SYNTACTIC:B49.C2.V8.w8',
    grammar_notes = 'Arabic copula pronoun supplied in translation to link subject to predicate.'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=49 AND chapter_num=2 AND verse_num=8)
  AND ar_word_position = 8;

-- =========================================================================
-- 9. HEBREWS 11:1 (Book 58, Ch 11, Vs 1)
-- =========================================================================
-- pos 3 "فَهُوَ": verb present active indicative 3s Ἔστιν G1510
UPDATE word_mappings
SET orig_surface = 'Ἔστιν',
    orig_word_position = 1,
    morph_pos = 'verb',
    morph_tense = 'present',
    morph_voice = 'active',
    morph_mood = 'indicative',
    morph_person = '3',
    morph_number = 'singular',
    orig_morphology = 'V-PAI-3S',
    verified_locator = 'SBLGNT:B58.C11.V1.w1',
    grammar_notes = 'Verb present active indicative 3s of εἰμί (Ἔστιν).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=58 AND chapter_num=11 AND verse_num=1)
  AND ar_word_position = 3;

-- pos 5 "بِمَا": Arabic prepositional complement translating objective genitive participle (was erroneously G1722 ἐν)
UPDATE word_mappings
SET strongs_id = NULL,
    orig_word = '—',
    orig_surface = '—',
    morph_pos = 'syntactic_ar',
    verified_locator = 'AR_SYNTACTIC:B58.C11.V1.w5',
    grammar_notes = 'Arabic prepositional particle translating the objective genitive participial construction ἐλπιζομένων; Greek has no preposition ἐν.'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=58 AND chapter_num=11 AND verse_num=1)
  AND ar_word_position = 5;

-- pos 6 "يُرْجَى": participle present passive genitive neuter plural of ἐλπίζω G1679
UPDATE word_mappings
SET morph_pos = 'verb',
    morph_tense = 'present',
    morph_voice = 'passive',
    morph_mood = 'participle',
    morph_case = 'genitive',
    morph_gender = 'neuter',
    morph_number = 'plural',
    orig_morphology = 'V-PPP-GPN',
    verified_locator = 'SBLGNT:B58.C11.V1.w4'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=58 AND chapter_num=11 AND verse_num=1)
  AND ar_word_position = 6;

-- =========================================================================
-- 10. REVELATION 21:4 (Book 66, Ch 21, Vs 4)
-- =========================================================================
-- pos 19 "وَجَعٌ": noun nominative masculine singular πόνος G4192 (was erroneously G4194 Πόντιος)
UPDATE word_mappings
SET strongs_id = 'G4192',
    orig_word = 'πόνος',
    orig_surface = 'πόνος',
    orig_word_position = 17,
    morph_pos = 'noun',
    morph_case = 'nominative',
    morph_gender = 'masculine',
    morph_number = 'singular',
    orig_morphology = 'N-NMS',
    verified_locator = 'SBLGNT:B66.C21.V4.w17',
    grammar_notes = 'Noun nominative masculine singular of πόνος (pain, sorrow, distress).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=66 AND chapter_num=21 AND verse_num=4)
  AND ar_word_position = 19;

-- pos 27 "مَضَتْ": verb aorist active indicative 3p ἀπῆλθαν / ἀπῆλθον G565
UPDATE word_mappings
SET orig_surface = 'ἀπῆλθον',
    orig_word_position = 22,
    morph_pos = 'verb',
    morph_tense = 'aorist',
    morph_voice = 'active',
    morph_mood = 'indicative',
    morph_person = '3',
    morph_number = 'plural',
    orig_morphology = 'V-AAI-3P',
    verified_locator = 'SBLGNT:B66.C21.V4.w22',
    grammar_notes = 'Verb aorist active indicative 3p of ἀπέρχομαι (passed away).'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=66 AND chapter_num=21 AND verse_num=4)
  AND ar_word_position = 27;

-- Delete existing primary mappings for updated words before re-inserting
DELETE FROM word_mapping_strongs
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id
  WHERE (v.book_id=6 AND v.chapter_num=1 AND v.verse_num=8 AND wm.ar_word_position IN (1, 8, 10, 16, 18, 19, 21, 22))
     OR (v.book_id=19 AND v.chapter_num=23 AND v.verse_num=1 AND wm.ar_word_position=5)
     OR (v.book_id=23 AND v.chapter_num=53 AND v.verse_num=5 AND wm.ar_word_position IN (2, 3, 6, 7, 9, 11, 12))
     OR (v.book_id=43 AND v.chapter_num=3 AND v.verse_num=16 AND wm.ar_word_position IN (16, 19))
     OR (v.book_id=44 AND v.chapter_num=1 AND v.verse_num=8 AND wm.ar_word_position IN (4, 5, 10))
     OR (v.book_id=45 AND v.chapter_num=8 AND v.verse_num=28 AND wm.ar_word_position=1)
     OR (v.book_id=49 AND v.chapter_num=2 AND v.verse_num=8 AND wm.ar_word_position IN (5, 8))
     OR (v.book_id=58 AND v.chapter_num=11 AND v.verse_num=1 AND wm.ar_word_position=5)
     OR (v.book_id=66 AND v.chapter_num=21 AND v.verse_num=4 AND wm.ar_word_position=19)
);

-- Insert primary mappings for words that have strongs_id
INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role)
SELECT id, strongs_id, 1, 'primary'
FROM word_mappings
WHERE id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id
  WHERE (v.book_id=6 AND v.chapter_num=1 AND v.verse_num=8 AND wm.ar_word_position IN (1, 8, 10, 16, 18, 21, 22))
     OR (v.book_id=23 AND v.chapter_num=53 AND v.verse_num=5 AND wm.ar_word_position IN (2, 3, 6, 7, 9, 11, 12))
     OR (v.book_id=43 AND v.chapter_num=3 AND v.verse_num=16 AND wm.ar_word_position=16)
     OR (v.book_id=44 AND v.chapter_num=1 AND v.verse_num=8 AND wm.ar_word_position IN (5, 10))
     OR (v.book_id=49 AND v.chapter_num=2 AND v.verse_num=8 AND wm.ar_word_position=5)
     OR (v.book_id=66 AND v.chapter_num=21 AND v.verse_num=4 AND wm.ar_word_position=19)
) AND strongs_id IS NOT NULL;

COMMIT;
`;

executeSql(sql);
console.log('SQL repairs applied successfully!');
