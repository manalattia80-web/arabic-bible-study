const fs = require('fs');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

// Verses 1 to 20 of Matthew 28
const matthew28Mappings = [
  // Verse 1
  {
    v: 1,
    words: [
      { ar: 'وَبَعْدَ', orig: 'ὀψέ', strong: 'G3796' },
      { ar: 'السَّبْتِ،', orig: 'σάββατον', strong: 'G4521' },
      { ar: 'عِنْدَ', orig: '---', strong: '' },
      { ar: 'فَجْرِ', orig: 'ἐπιφώσκω', strong: 'G2020' },
      { ar: 'أَوَّلِ', orig: 'εἷς', strong: 'G1520' },
      { ar: 'الأُسْبُوعِ،', orig: 'σάββατον', strong: 'G4521' },
      { ar: 'جَاءَتْ', orig: 'ἔρχομαι', strong: 'G2064' },
      { ar: 'مَرْيَمُ', orig: 'Μαρία', strong: 'G3137' },
      { ar: 'الْمَجْدَلِيَّةُ', orig: 'Μαγδαληνή', strong: 'G3094' },
      { ar: 'وَمَرْيَمُ', orig: 'Μαρία', strong: 'G3137' },
      { ar: 'الأُخْرَى', orig: 'ἄλλος', strong: 'G243' },
      { ar: 'لِتَنْظُرَا', orig: 'θεωρέω', strong: 'G2334' },
      { ar: 'الْقَبْرَ.', orig: 'τάφος', strong: 'G5028' }
    ]
  },
  // Verse 2
  {
    v: 2,
    words: [
      { ar: 'وَإِذَا', orig: 'ἰδού', strong: 'G2400' },
      { ar: 'زَلْزَلَةٌ', orig: 'σεισμός', strong: 'G4578' },
      { ar: 'عَظِيمَةٌ', orig: 'μέγας', strong: 'G3173' },
      { ar: 'حَدَثَتْ،', orig: 'γίνομαι', strong: 'G1096' },
      { ar: 'لأَنَّ', orig: 'γάρ', strong: 'G1063' },
      { ar: 'مَلاَكَ', orig: 'ἄγγελος', strong: 'G32' },
      { ar: 'الرَّبِّ', orig: 'κύριος', strong: 'G2962' },
      { ar: 'نَزَلَ', orig: 'καταβαίνω', strong: 'G2597' },
      { ar: 'مِنَ', orig: 'ἐκ', strong: 'G1537' },
      { ar: 'السَّمَاءِ', orig: 'οὐρανός', strong: 'G3772' },
      { ar: 'وَجَاءَ', orig: 'προσέρχομαι', strong: 'G4334' },
      { ar: 'وَدَحْرَجَ', orig: 'ἀποκυλίω', strong: 'G617' },
      { ar: 'الْحَجَرَ', orig: 'λίθος', strong: 'G3037' },
      { ar: 'عَنِ', orig: 'ἀπό', strong: 'G575' },
      { ar: 'الْبَابِ،', orig: 'θύρα', strong: 'G2374' },
      { ar: 'وَجَلَسَ', orig: 'κάθημαι', strong: 'G2521' },
      { ar: 'عَلَيْهِ.', orig: 'ἐπάνω', strong: 'G1883' }
    ]
  },
  // Verse 3
  {
    v: 3,
    words: [
      { ar: 'وَكَانَ', orig: 'εἰμί', strong: 'G1510' },
      { ar: 'مَنْظَرُهُ', orig: 'ἰδέα', strong: 'G2397' },
      { ar: 'كَالْبَرْقِ،', orig: 'ἀστραπή', strong: 'G796' },
      { ar: 'وَلِبَاسُهُ', orig: 'ἔνδυμα', strong: 'G1742' },
      { ar: 'أَبْيَضَ', orig: 'λευκός', strong: 'G3022' },
      { ar: 'كَالثَّلْجِ.', orig: 'χιών', strong: 'G5510' }
    ]
  },
  // Verse 4
  {
    v: 4,
    words: [
      { ar: 'فَمِنْ', orig: 'ἀπό', strong: 'G575' },
      { ar: 'خَوْفِهِ', orig: 'φόβος', strong: 'G5401' },
      { ar: 'ارْتَعَدَ', orig: 'σείω', strong: 'G4579' },
      { ar: 'الْحُرَّاسُ', orig: 'τηρέω', strong: 'G5083' },
      { ar: 'وَصَارُوا', orig: 'γίνομαι', strong: 'G1096' },
      { ar: 'كَأَمْوَاتٍ.', orig: 'νεκρός', strong: 'G3498' }
    ]
  },
  // Verse 5
  {
    v: 5,
    words: [
      { ar: 'فَأَجَابَ', orig: 'ἀποκρίνομαι', strong: 'G611' },
      { ar: 'الْمَلاَكُ', orig: 'ἄγγελος', strong: 'G32' },
      { ar: 'وَقَالَ', orig: 'λέγω', strong: 'G3004' },
      { ar: 'لِلْمَرْأَتَيْنِ:', orig: 'γυνή', strong: 'G1135' },
      { ar: '«لاَ', orig: 'μή', strong: 'G3361' },
      { ar: 'تَخَافَا', orig: 'φοβέω', strong: 'G5399' },
      { ar: 'أَنْتُمَا،', orig: 'ὑμεῖς', strong: 'G5210' },
      { ar: 'فَإِنِّي', orig: 'γάρ', strong: 'G1063' },
      { ar: 'أَعْلَمُ', orig: 'εἴδω', strong: 'G1492' },
      { ar: 'أَنَّكُمَا', orig: 'ὅτι', strong: 'G3754' },
      { ar: 'تَطْلُبَانِ', orig: 'ζητέω', strong: 'G2212' },
      { ar: 'يَسُوعَ', orig: 'Ἰησοῦς', strong: 'G2424' },
      { ar: 'الْمَصْلُوبَ.', orig: 'σταυρόω', strong: 'G4717' }
    ]
  },
  // Verse 6
  {
    v: 6,
    words: [
      { ar: 'لَيْسَ', orig: 'οὐ', strong: 'G3756' },
      { ar: 'هُوَ', orig: 'εἰμί', strong: 'G1510' },
      { ar: 'ههُنَا', orig: 'ὧδε', strong: 'G5602' },
      { ar: 'لأَنَّهُ', orig: 'γάρ', strong: 'G1063' },
      { ar: 'قَامَ', orig: 'ἐγείρω', strong: 'G1453' },
      { ar: 'كَمَا', orig: 'καθώς', strong: 'G2531' },
      { ar: 'قَالَ!', orig: 'εἶπον', strong: 'G2036' },
      { ar: 'هَلُمَّا', orig: 'δεῦτε', strong: 'G1205' },
      { ar: 'انْظُرَا', orig: 'εἴδω', strong: 'G1492' },
      { ar: 'الْمَوْضِعَ', orig: 'τόπος', strong: 'G5117' },
      { ar: 'الَّذِي', orig: 'ὅπου', strong: 'G3699' },
      { ar: 'كَانَ', orig: 'εἰμί', strong: 'G1510' },
      { ar: 'الرَّبُّ', orig: 'κύριος', strong: 'G2962' },
      { ar: 'مُضْطَجِعًا', orig: 'κεῖμαι', strong: 'G2749' },
      { ar: 'فِيهِ.', orig: '---', strong: '' }
    ]
  },
  // Verse 7
  {
    v: 7,
    words: [
      { ar: 'وَاذْهَبَا', orig: 'πορεύομαι', strong: 'G4198' },
      { ar: 'سَرِيعًا', orig: 'ταχύ', strong: 'G5035' },
      { ar: 'قُولاَ', orig: 'εἶπον', strong: 'G2036' },
      { ar: 'لِتَلاَمِيذِهِ:', orig: 'μαθητής', strong: 'G3101' },
      { ar: '«إِنَّهُ', orig: 'ὅτι', strong: 'G3754' },
      { ar: 'قَدْ', orig: '---', strong: '' },
      { ar: 'قَامَ', orig: 'ἐγείρω', strong: 'G1453' },
      { ar: 'مِنَ', orig: 'ἀπό', strong: 'G575' },
      { ar: 'الأَمْوَاتِ.', orig: 'νεκρός', strong: 'G3498' },
      { ar: 'هَا', orig: 'ἰδού', strong: 'G2400' },
      { ar: 'هُوَ', orig: '---', strong: '' },
      { ar: 'يَسْبِقُكُمْ', orig: 'προάγω', strong: 'G4254' },
      { ar: 'إِلَى', orig: 'εἰς', strong: 'G1519' },
      { ar: 'الْجَلِيلِ.', orig: 'Γαλιλαία', strong: 'G1056' },
      { ar: 'هُنَاكَ', orig: 'ἐκεῖ', strong: 'G1563' },
      { ar: 'تَرَوْنَهُ.', orig: 'ὀπτάνομαι', strong: 'G3700' },
      { ar: 'هَا', orig: 'ἰδού', strong: 'G2400' },
      { ar: 'أَنَا', orig: '---', strong: '' },
      { ar: 'قَدْ', orig: '---', strong: '' },
      { ar: 'قُلْتُ', orig: 'εἶπον', strong: 'G2036' },
      { ar: 'لَكُمَا».', orig: 'ὑμῖν', strong: 'G5213' }
    ]
  },
  // Verse 8
  {
    v: 8,
    words: [
      { ar: 'فَخَرَجَتَا', orig: 'ἐξέρχομαι', strong: 'G1831' },
      { ar: 'سَرِيعًا', orig: 'ταχύ', strong: 'G5035' },
      { ar: 'مِنَ', orig: 'ἀπό', strong: 'G575' },
      { ar: 'الْقَبْرِ', orig: 'μνημεῖον', strong: 'G3419' },
      { ar: 'بِخَوْفٍ', orig: 'φόβος', strong: 'G5401' },
      { ar: 'وَفَرَحٍ', orig: 'χαρά', strong: 'G5479' },
      { ar: 'عَظِيمٍ،', orig: 'μέγας', strong: 'G3173' },
      { ar: 'رَاكِضَتَيْنِ', orig: 'τρέχω', strong: 'G5143' },
      { ar: 'لِتُخْبِرَا', orig: 'ἀπαγγέλλω', strong: 'G518' },
      { ar: 'تَلاَمِيذَهُ.', orig: 'μαθητής', strong: 'G3101' }
    ]
  },
  // Verse 9
  {
    v: 9,
    words: [
      { ar: 'وَفِيمَا', orig: 'ὡς', strong: 'G5613' },
      { ar: 'هُمَا', orig: '---', strong: '' },
      { ar: 'مُنْطَلِقَتَانِ', orig: 'πορεύομαι', strong: 'G4198' },
      { ar: 'لِتُخْبِرَا', orig: 'ἀπαγγέλλω', strong: 'G518' },
      { ar: 'تَلاَمِيذَهُ', orig: 'μαθητής', strong: 'G3101' },
      { ar: 'إِذَا', orig: 'ἰδού', strong: 'G2400' },
      { ar: 'يَسُوعُ', orig: 'Ἰησοῦς', strong: 'G2424' },
      { ar: 'لاَقَاهُمَا', orig: 'ὑπαντάω', strong: 'G5221' },
      { ar: 'وَقَالَ:', orig: 'λέγω', strong: 'G3004' },
      { ar: '«سَلاَمٌ', orig: 'χαίρω', strong: 'G5463' },
      { ar: 'لَكُمَا».', orig: '---', strong: '' },
      { ar: 'فَتَقَدَّمَتَا', orig: 'προσέρχομαι', strong: 'G4334' },
      { ar: 'وَأَمْسَكَتَا', orig: 'κρατέω', strong: 'G2902' },
      { ar: 'بِقَدَمَيْهِ', orig: 'πούς', strong: 'G4228' },
      { ar: 'وَسَجَدَتَا', orig: 'προσκυνέω', strong: 'G4352' },
      { ar: 'لَهُ.', orig: 'αὐτός', strong: 'G846' }
    ]
  },
  // Verse 10
  {
    v: 10,
    words: [
      { ar: 'فَقَالَ', orig: 'λέγω', strong: 'G3004' },
      { ar: 'لَهُمَا', orig: 'αὐτός', strong: 'G846' },
      { ar: 'يَسُوعُ:', orig: 'Ἰησοῦς', strong: 'G2424' },
      { ar: '«لاَ', orig: 'μή', strong: 'G3361' },
      { ar: 'تَخَافَا.', orig: 'φοβέω', strong: 'G5399' },
      { ar: 'اِذْهَبَا', orig: 'ὑπάγω', strong: 'G5217' },
      { ar: 'قُولاَ', orig: 'ἀπαγγέλλω', strong: 'G518' },
      { ar: 'لإِخْوَتِي', orig: 'ἀδελφός', strong: 'G80' },
      { ar: 'أَنْ', orig: 'ἵνα', strong: 'G2443' },
      { ar: 'يَذْهَبُوا', orig: 'ἀπέρχομαι', strong: 'G565' },
      { ar: 'إِلَى', orig: 'εἰς', strong: 'G1519' },
      { ar: 'الْجَلِيلِ،', orig: 'Γαλιλαία', strong: 'G1056' },
      { ar: 'وَهُنَاكَ', orig: 'κἀκεῖ', strong: 'G2546' },
      { ar: 'يَرَوْنَنِي».', orig: 'ὀπτάνομαι', strong: 'G3700' }
    ]
  },
  // Verse 11
  {
    v: 11,
    words: [
      { ar: 'وَفِيمَا', orig: 'πορεύομαι', strong: 'G4198' },
      { ar: 'هُمَا', orig: '---', strong: '' },
      { ar: 'ذَاهِبَتَانِ', orig: 'πορεύομαι', strong: 'G4198' },
      { ar: 'إِذَا', orig: 'ἰδού', strong: 'G2400' },
      { ar: 'قَوْمٌ', orig: 'τὶς', strong: 'G5100' },
      { ar: 'مِنَ', orig: 'ἐκ', strong: 'G1537' },
      { ar: 'الْحُرَّاسِ', orig: 'κουστωδία', strong: 'G2892' },
      { ar: 'جَاءُوا', orig: 'ἔρχομαι', strong: 'G2064' },
      { ar: 'إِلَى', orig: 'εἰς', strong: 'G1519' },
      { ar: 'الْمَدِينَةِ،', orig: 'πόλις', strong: 'G4172' },
      { ar: 'وَأَخْبَرُوا', orig: 'ἀπαγγέλλω', strong: 'G518' },
      { ar: 'رُؤَسَاءَ', orig: 'ἀρχιερεύς', strong: 'G749' },
      { ar: 'الْكَهَنَةِ', orig: 'ἀρχιερεύς', strong: 'G749' },
      { ar: 'بِكُلِّ', orig: 'ἅπας', strong: 'G537' },
      { ar: 'مَا', orig: 'ὁ', strong: 'G3588' },
      { ar: 'كَانَ.', orig: 'γίνομαι', strong: 'G1096' }
    ]
  },
  // Verse 12
  {
    v: 12,
    words: [
      { ar: 'فَاجْتَمَعُوا', orig: 'συνάγω', strong: 'G4863' },
      { ar: 'مَعَ', orig: 'μετά', strong: 'G3326' },
      { ar: 'الشُّيُوخِ،', orig: 'πρεσβύτερος', strong: 'G4245' },
      { ar: 'وَتَشَاوَرُوا،', orig: 'συμβούλιον', strong: 'G4824' },
      { ar: 'وَأَعْطَوُا', orig: 'δίδωμι', strong: 'G1325' },
      { ar: 'الْعَسْكَرَ', orig: 'στρατιώτης', strong: 'G4757' },
      { ar: 'فِضَّةً', orig: 'ἀργύριον', strong: 'G694' },
      { ar: 'كَثِيرَةً', orig: 'ἱκανός', strong: 'G2425' }
    ]
  },
  // Verse 13
  {
    v: 13,
    words: [
      { ar: 'قَائِلِينَ:', orig: 'λέγω', strong: 'G3004' },
      { ar: '«قُولُوا:', orig: 'εἶπον', strong: 'G2036' },
      { ar: 'إِنَّ', orig: 'ὅτι', strong: 'G3754' },
      { ar: 'تَلاَمِيذَهُ', orig: 'μαθητής', strong: 'G3101' },
      { ar: 'أَتَوْا', orig: 'ἔρχομαι', strong: 'G2064' },
      { ar: 'لَيْلاً', orig: 'νύξ', strong: 'G3571' },
      { ar: 'وَسَرَقُوهُ', orig: 'κλέπτω', strong: 'G2813' },
      { ar: 'وَنَحْنُ', orig: 'ἡμῶν', strong: 'G2257' },
      { ar: 'نِيَامٌ.', orig: 'κοιμάω', strong: 'G2837' }
    ]
  },
  // Verse 14
  {
    v: 14,
    words: [
      { ar: 'وَإِذَا', orig: 'ἐάν', strong: 'G1437' },
      { ar: 'سُمِعَ', orig: 'ἀκούω', strong: 'G191' },
      { ar: 'ذلِكَ', orig: 'τοῦτο', strong: 'G5124' },
      { ar: 'عِنْدَ', orig: 'ἐπί', strong: 'G1909' },
      { ar: 'الْوَالِي', orig: 'ἡγεμών', strong: 'G2232' },
      { ar: 'فَنَحْنُ', orig: 'ἡμεῖς', strong: 'G2249' },
      { ar: 'نُقْنِعُهُ،', orig: 'πείθω', strong: 'G3982' },
      { ar: 'وَنَجْعَلُكُمْ', orig: 'ποιέω', strong: 'G4160' },
      { ar: 'مُطْمَئِنِّينَ».', orig: 'ἀμέριμνος', strong: 'G275' }
    ]
  },
  // Verse 15
  {
    v: 15,
    words: [
      { ar: 'فَأَخَذُوا', orig: 'λαμβάνω', strong: 'G2983' },
      { ar: 'الْفِضَّةَ', orig: 'ἀργύριον', strong: 'G694' },
      { ar: 'وَفَعَلُوا', orig: 'ποιέω', strong: 'G4160' },
      { ar: 'كَمَا', orig: 'καθώς', strong: 'G2531' },
      { ar: 'عَلَّمُوهُمْ،', orig: 'διδάσκω', strong: 'G1321' },
      { ar: 'فَشَاعَ', orig: 'διαφημίζω', strong: 'G1310' },
      { ar: 'هذَا', orig: 'οὗτος', strong: 'G3778' },
      { ar: 'الْقَوْلُ', orig: 'λόγος', strong: 'G3056' },
      { ar: 'عِنْدَ', orig: 'παρά', strong: 'G3844' },
      { ar: 'الْيَهُودِ', orig: 'Ἰουδαῖος', strong: 'G2453' },
      { ar: 'إِلَى', orig: 'μέχρι', strong: 'G3360' },
      { ar: 'هذَا', orig: 'σήμερον', strong: 'G4594' },
      { ar: 'الْيَوْمِ.', orig: 'ἡμέρα', strong: 'G2250' }
    ]
  },
  // Verse 16
  {
    v: 16,
    words: [
      { ar: 'وَأَمَّا', orig: 'δέ', strong: 'G1161' },
      { ar: 'الأَحَدَ', orig: 'ἕνδεκα', strong: 'G1733' },
      { ar: 'عَشَرَ', orig: 'ἕνδεκα', strong: 'G1733' },
      { ar: 'تِلْمِيذًا', orig: 'μαθητής', strong: 'G3101' },
      { ar: 'فَانْطَلَقُوا', orig: 'πορεύομαι', strong: 'G4198' },
      { ar: 'إِلَى', orig: 'εἰς', strong: 'G1519' },
      { ar: 'الْجَلِيلِ', orig: 'Γαλιλαία', strong: 'G1056' },
      { ar: 'إِلَى', orig: 'εἰς', strong: 'G1519' },
      { ar: 'الْجَبَلِ،', orig: 'ὄρος', strong: 'G3735' },
      { ar: 'حَيْثُ', orig: 'οὗ', strong: 'G3757' },
      { ar: 'أَمَرَهُمْ', orig: 'τάσσω', strong: 'G5021' },
      { ar: 'يَسُوعُ.', orig: 'Ἰησοῦς', strong: 'G2424' }
    ]
  },
  // Verse 17
  {
    v: 17,
    words: [
      { ar: 'وَلَمَّا', orig: 'καί', strong: 'G2532' },
      { ar: 'رَأَوْهُ', orig: 'εἴδω', strong: 'G1492' },
      { ar: 'سَجَدُوا', orig: 'προσκυνέω', strong: 'G4352' },
      { ar: 'لَهُ،', orig: 'αὐτός', strong: 'G846' },
      { ar: 'وَلكِنَّ', orig: 'δέ', strong: 'G1161' },
      { ar: 'بَعْضَهُمْ', orig: 'ὁ', strong: 'G3588' },
      { ar: 'شَكُّوا.', orig: 'διστάζω', strong: 'G1365' }
    ]
  },
  // Verse 18
  {
    v: 18,
    words: [
      { ar: 'فَتَقَدَّمَ', orig: 'προσέρχομαι', strong: 'G4334' },
      { ar: 'يَسُوعُ', orig: 'Ἰησοῦς', strong: 'G2424' },
      { ar: 'وَكَلَّمَهُمْ', orig: 'λαλέω', strong: 'G2980' },
      { ar: 'قَائِلاً:', orig: 'λέγω', strong: 'G3004' },
      { ar: '«دُفِعَ', orig: 'δίδωμι', strong: 'G1325' },
      { ar: 'إِلَيَّ', orig: 'μοί', strong: 'G3427' },
      { ar: 'كُلُّ', orig: 'πᾶς', strong: 'G3956' },
      { ar: 'سُلْطَانٍ', orig: 'ἐξουσία', strong: 'G1849' },
      { ar: 'فِي', orig: 'ἐν', strong: 'G1722' },
      { ar: 'السَّمَاءِ', orig: 'οὐρανός', strong: 'G3772' },
      { ar: 'وَعَلَى', orig: 'ἐπί', strong: 'G1909' },
      { ar: 'الأَرْضِ،', orig: 'γῆ', strong: 'G1093' }
    ]
  },
  // Verse 19
  {
    v: 19,
    words: [
      { ar: 'فَاذْهَبُوا', orig: 'πορεύομαι', strong: 'G4198' },
      { ar: 'وَتَلْمِذُوا', orig: 'μαθητεύω', strong: 'G3100' },
      { ar: 'جَمِيعَ', orig: 'πᾶς', strong: 'G3956' },
      { ar: 'الأُمَمِ', orig: 'ἔθνος', strong: 'G1484' },
      { ar: 'وَعَمِّدُوهُمْ', orig: 'βαπτίζω', strong: 'G907' },
      { ar: 'بِاسْمِ', orig: 'ὄνομα', strong: 'G3686' },
      { ar: 'الآب', orig: 'πατήρ', strong: 'G3962' },
      { ar: 'وَالانِ', orig: 'υἱός', strong: 'G5207' },
      { ar: 'وَالرُّوحِ', orig: 'πνεῦμα', strong: 'G4151' },
      { ar: 'الْقُدُسِ.', orig: 'ἅγιος', strong: 'G40' }
    ]
  },
  // Verse 20
  {
    v: 20,
    words: [
      { ar: 'وَعَلِّمُوهُمْ', orig: 'διδάσκω', strong: 'G1321' },
      { ar: 'أَنْ', orig: '---', strong: '' },
      { ar: 'يَحْفَظُوا', orig: 'τηρέω', strong: 'G5083' },
      { ar: 'جَمِيعَ', orig: 'πᾶς', strong: 'G3956' },
      { ar: 'مَا', orig: 'ὅσος', strong: 'G3745' },
      { ar: 'أَوْصَيْتُكُمْ', orig: 'ἐντέλλομαι', strong: 'G1781' },
      { ar: 'بِهِ.', orig: '---', strong: '' },
      { ar: 'وَهَا', orig: 'ἰδού', strong: 'G2400' },
      { ar: 'أَنَا', orig: 'ἐγώ', strong: 'G1473' },
      { ar: 'مَعَكُمْ', orig: 'μετά', strong: 'G3326' },
      { ar: 'كُلَّ', orig: 'πᾶς', strong: 'G3956' },
      { ar: 'الأَيَّامِ', orig: 'ἡμέρα', strong: 'G2250' },
      { ar: 'إِلَى', orig: 'ἕως', strong: 'G2193' },
      { ar: 'انْقِضَاءِ', orig: 'συντέλεια', strong: 'G4930' },
      { ar: 'الدَّهْرِ».', orig: 'αἰών', strong: 'G165' },
      { ar: 'آمِينَ.', orig: 'ἀμήν', strong: 'G281' }
    ]
  }
];

console.log('Generating SQL insert for Matthew 28 word mappings...');

let sql = 'BEGIN TRANSACTION;\n\n';
// First clean any partial mappings if any exist for Matt 28
sql += `DELETE FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 28);\n\n`;

let totalInserted = 0;

for (const vData of matthew28Mappings) {
  const verseId = `11111111-0000-0000-0040-000000028${String(vData.v).padStart(3, '0')}`;
  
  for (let i = 0; i < vData.words.length; i++) {
    const w = vData.words[i];
    const pos = i + 1;
    const rowId = crypto.randomUUID();
    const strongVal = w.strong ? `'${w.strong}'` : 'NULL';
    const origVal = w.orig ? `'${w.orig.replace(/'/g, "''")}'` : "'---'";
    const arVal = `'${w.ar.replace(/'/g, "''")}'`;
    
    sql += `INSERT INTO word_mappings (id, verse_id, ar_word_position, orig_word_position, ar_word, orig_word, orig_word_lang, strongs_id, is_verified) VALUES ('${rowId}', '${verseId}', ${pos}, ${pos}, ${arVal}, ${origVal}, 'greek', ${strongVal}, 1);\n`;
    totalInserted++;
  }
}

sql += '\nCOMMIT;\n';

fs.writeFileSync('scripts/insert_matthew28.sql', sql, 'utf8');
console.log(`Generated SQL for ${totalInserted} words across 20 verses.`);

console.log('Executing SQL against mobile/assets/bible_study.db...');
execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
console.log('Insertion successful!');

// Verification
const check = execFileSync(sqlite, [db, '-json', "SELECT count(*) as count, count(DISTINCT verse_id) as verses_mapped FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 28);"], { encoding: 'utf8' });
console.log('Verification result:', JSON.parse(check)[0]);
