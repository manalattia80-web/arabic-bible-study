const fs = require('fs');

const hebrewData = JSON.parse(fs.readFileSync('scripts/data/hebrew_bible_with_nikkud.json', 'utf8'));
const ch11 = hebrewData['1Chr']['11']; // 1 Chronicles 12 (0-indexed chapter 11)

// ch11 has 41 verses (0 to 40)
// Verse 1 (Arabic 1) = ch11[0]
// Verse 2 (Arabic 2) = ch11[1]
// Verse 3 (Arabic 3) = ch11[2]
// Verse 4 (Arabic 4) = ch11[3] + ch11[4]
// Verse 5 (Arabic 5) = ch11[5]
// ...
// Verse k (Arabic k) = ch11[k]
// Verse 40 (Arabic 40) = ch11[40]

function cleanWords(words) {
  let s = words.join(' ');
  // clean up known concatenated Ketiv/Qere bugs in the source JSON
  s = s.replace('ויזואלויזואלוִיזִיאֵ֥לוָפֶ֖לֶט', '[וִיזוּאֵל כ] (וִיזִיאֵ֥ל ק) וָפֶ֖לֶט');
  s = s.replace('החריפיהחריפיהַחֲרוּפִֽי׃', '[הַחֲרִיפִי כ] (הַחֲרוּפִֽי׃ ק)');
  s = s.replace('גדיתיוגדיתיוגְּדוֹתָ֑יווַיַּבְרִ֨יחוּ֙', '[גְּדֹיוֹתָיו כ] (גְּדֹתָיו ק) וַיַּבְרִ֨יחוּ֙');
  s = s.replace('השלושיםהשלושיםהַשָּׁלִישִׁים֒לְךָ֤', '[הַשְּׁלֹושִׁים כ] (הַשָּׁלִישִׁים֒ ק) לְךָ֤');
  // strip trailing sof pasuq / pe / samekh if any standalone
  return s.trim();
}

let sql = `-- Textual alignment fix for 1 Chronicles 12 and 2 Kings 12:11\nBEGIN TRANSACTION;\n\n`;

// 1. 2 Kings 12:11 text fix and word mappings
const kings12_11_text = `וְנָתְנוּ֙ אֶת־הַכֶּ֣סֶף הַֽמְתֻכָּ֔ן עַל־[יַד כ] (יְדֵי֙ ק) עֹשֵׂ֣י הַמְּלָאכָ֔ה [הַפְּקֻדִים כ] (הַמֻּפְקָדִ֖ים ק) בֵּ֣ית יְהוָ֑ה וַיּוֹצִיאֻ֜הוּ לְחָרָשֵׁ֤י הָעֵץ֙ וְלַבֹּנִ֔ים הָעֹשִׂ֖ים בֵּ֥ית יְהוָֽה׃`;
sql += `-- 2 Kings 12:11 Masoretic Ketiv/Qere fix\n`;
sql += `UPDATE verses SET text_original = '${kings12_11_text.replace(/'/g, "''")}' WHERE book_id = 12 AND chapter_num = 12 AND verse_num = 11;\n\n`;

sql += `-- 2 Kings 12:11 false friends fix: المحسوبة (H8505) and والبنائين (H1129)\n`;
sql += `UPDATE word_mappings SET strongs_id = 'H8505', orig_word = 'תָּכַן' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 12 AND verse_num = 11) AND ar_word_position = 3;\n`;
sql += `UPDATE word_mappings SET strongs_id = 'H1129', orig_word = 'בָּנָה' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 12 AND verse_num = 11) AND ar_word_position = 14;\n\n`;

// 2. 1 Chronicles 12 verses realignment (verses 4 to 40)
sql += `-- 1 Chronicles 12 realignment of verses.text_original\n`;

// Verse 4: combine ch11[3] and ch11[4]
const v4_text = cleanWords(ch11[3]) + ' ' + cleanWords(ch11[4]);
sql += `UPDATE verses SET text_original = '${v4_text.replace(/'/g, "''")}' WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 4;\n`;

for (let arV = 5; arV <= 40; arV++) {
  const hebrewIdx = arV; // Arabic 5 -> ch11[5], ..., Arabic 40 -> ch11[40]
  const v_text = cleanWords(ch11[hebrewIdx]);
  sql += `UPDATE verses SET text_original = '${v_text.replace(/'/g, "''")}' WHERE book_id = 13 AND chapter_num = 12 AND verse_num = ${arV};\n`;
}

// 3. 1 Chronicles 12 word_mappings name adjustments
sql += `\n-- 1 Chronicles 12 word_mappings proper names fixes\n`;
sql += `UPDATE word_mappings SET strongs_id = 'H1452', orig_word = 'גְּדֵרָתִי' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 4) AND ar_word_position = 12;\n`;
sql += `UPDATE word_mappings SET strongs_id = 'H498', orig_word = 'אֶלְעוּזַי' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 5) AND ar_word_position = 1;\n`;
sql += `UPDATE word_mappings SET strongs_id = 'H1183', orig_word = 'בְּעַלְיָה' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 5) AND ar_word_position = 3;\n`;
sql += `UPDATE word_mappings SET strongs_id = 'H2741', orig_word = 'חֲרוּפִי' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 5) AND ar_word_position = 6;\n`;

sql += `UPDATE word_mappings SET strongs_id = 'H511', orig_word = 'אֶלְקָנָה' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 6) AND ar_word_position = 1;\n`;
sql += `UPDATE word_mappings SET strongs_id = 'H3449', orig_word = 'יִשִּׁיָּה' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 6) AND ar_word_position = 2;\n`;
sql += `UPDATE word_mappings SET strongs_id = 'H5832', orig_word = 'עֲזַרְאֵל' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 6) AND ar_word_position = 3;\n`;
sql += `UPDATE word_mappings SET strongs_id = 'H3134', orig_word = 'יוֹעֶזֶר' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 6) AND ar_word_position = 4;\n`;
sql += `UPDATE word_mappings SET strongs_id = 'H7145', orig_word = 'קָרְחִי' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 6) AND ar_word_position = 6;\n`;

sql += `UPDATE word_mappings SET strongs_id = 'H3132', orig_word = 'יוֹעֵאלָה' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 7) AND ar_word_position = 1;\n`;
sql += `UPDATE word_mappings SET strongs_id = 'H3395', orig_word = 'יְרֹחָם' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 7) AND ar_word_position = 4;\n`;

sql += `UPDATE word_mappings SET strongs_id = 'H4925', orig_word = 'מִשְׁמַנָּה' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 10) AND ar_word_position = 1;\n`;
sql += `UPDATE word_mappings SET strongs_id = 'H6262', orig_word = 'עַתַּי' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 11) AND ar_word_position = 1;\n`;
sql += `UPDATE word_mappings SET strongs_id = 'H447', orig_word = 'אֱלִיאֵל' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 11) AND ar_word_position = 3;\n`;
sql += `UPDATE word_mappings SET strongs_id = 'H443', orig_word = 'אֶלְזָבָד' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 12) AND ar_word_position = 3;\n`;
sql += `UPDATE word_mappings SET strongs_id = 'H4344', orig_word = 'מַכְבַּנַּי' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 13) AND ar_word_position = 3;\n`;

sql += `\nCOMMIT;\n`;

fs.writeFileSync('scripts/fix_textual_issues.sql', sql, 'utf8');
console.log('Successfully generated scripts/fix_textual_issues.sql');
