const fs = require('fs');

const flatList2 = [
{"word": "هؤلاء", "strongs": "G3778"},
{"word": "هم", "strongs": "G1526"},
{"word": "مدمدمون", "strongs": "G1113"},
{"word": "متشكون", "strongs": "G3202"},
{"word": "سالكون", "strongs": "G4198"},
{"word": "بحسب", "strongs": "G2596"},
{"word": "شهواتهم", "strongs": "G1939"},
{"word": "وفمهم", "strongs": "G4750"},
{"word": "يتكلم", "strongs": "G2980"},
{"word": "بعظائم", "strongs": "G5236"},
{"word": "يحابون", "strongs": "G2296"},
{"word": "بالوجوه", "strongs": "G4383"},
{"word": "من", "strongs": "G0"},
{"word": "اجل", "strongs": "G5484"},
{"word": "المنفعة", "strongs": "G5622"},
{"word": "واما", "strongs": "G1161"},
{"word": "انتم", "strongs": "G5210"},
{"word": "ايها", "strongs": "G0"},
{"word": "الاحباء", "strongs": "G27"},
{"word": "فاذكروا", "strongs": "G3415"},
{"word": "الاقوال", "strongs": "G4487"},
{"word": "التي", "strongs": "G3588"},
{"word": "قيلت", "strongs": "G4302"},
{"word": "سابقا", "strongs": "G4302"},
{"word": "من", "strongs": "G5259"},
{"word": "رسل", "strongs": "G652"},
{"word": "ربنا", "strongs": "G2962"},
{"word": "يسوع", "strongs": "G2424"},
{"word": "المسيح", "strongs": "G5547"},
{"word": "فانهم", "strongs": "G3754"},
{"word": "قالوا", "strongs": "G3004"},
{"word": "لكم", "strongs": "G5213"},
{"word": "انه", "strongs": "G3754"},
{"word": "في", "strongs": "G1722"},
{"word": "الزمان", "strongs": "G5550"},
{"word": "الاخير", "strongs": "G2078"},
{"word": "سيكون", "strongs": "G1510"},
{"word": "قوم", "strongs": "G0"},
{"word": "مستهزئون", "strongs": "G1703"},
{"word": "سالكين", "strongs": "G4198"},
{"word": "بحسب", "strongs": "G2596"},
{"word": "شهوات", "strongs": "G1939"},
{"word": "فجورهم", "strongs": "G763"},
{"word": "هؤلاء", "strongs": "G3778"},
{"word": "هم", "strongs": "G1526"},
{"word": "المعتزلون", "strongs": "G592"},
{"word": "بانفسهم", "strongs": "G1438"},
{"word": "نفسانيون", "strongs": "G5591"},
{"word": "لا", "strongs": "G3361"},
{"word": "روح", "strongs": "G4151"},
{"word": "لهم", "strongs": "G2192"},
{"word": "واما", "strongs": "G1161"},
{"word": "انتم", "strongs": "G5210"},
{"word": "ايها", "strongs": "G0"},
{"word": "الاحباء", "strongs": "G27"},
{"word": "فابنوا", "strongs": "G2026"},
{"word": "انفسكم", "strongs": "G1438"},
{"word": "على", "strongs": "G1909"},
{"word": "ايمانكم", "strongs": "G4102"},
{"word": "الاقدس", "strongs": "G40"},
{"word": "مصلين", "strongs": "G4336"},
{"word": "في", "strongs": "G1722"},
{"word": "الروح", "strongs": "G4151"},
{"word": "القدس", "strongs": "G40"},
{"word": "واحفظوا", "strongs": "G5083"},
{"word": "انفسكم", "strongs": "G1438"},
{"word": "في", "strongs": "G1722"},
{"word": "محبة", "strongs": "G26"},
{"word": "الله", "strongs": "G2316"},
{"word": "منتظرين", "strongs": "G4327"},
{"word": "رحمة", "strongs": "G1656"},
{"word": "ربنا", "strongs": "G2962"},
{"word": "يسوع", "strongs": "G2424"},
{"word": "المسيح", "strongs": "G5547"},
{"word": "للحياة", "strongs": "G2222"},
{"word": "الابدية", "strongs": "G166"},
{"word": "وارحموا", "strongs": "G1653"},
{"word": "البعض", "strongs": "G3739"},
{"word": "مميزين", "strongs": "G1252"},
{"word": "وخلصوا", "strongs": "G4982"},
{"word": "البعض", "strongs": "G3739"},
{"word": "بالخوف", "strongs": "G5401"},
{"word": "مختطفين", "strongs": "G726"},
{"word": "من", "strongs": "G1537"},
{"word": "النار", "strongs": "G4442"},
{"word": "مبغضين", "strongs": "G3404"},
{"word": "حتى", "strongs": "G2532"},
{"word": "الثوب", "strongs": "G5509"},
{"word": "المدنس", "strongs": "G4695"},
{"word": "من", "strongs": "G575"},
{"word": "الجسد", "strongs": "G4561"},
{"word": "والقادر", "strongs": "G1410"},
{"word": "ان", "strongs": "G0"},
{"word": "يحفظكم", "strongs": "G5442"},
{"word": "غير", "strongs": "G0"},
{"word": "عاثرين", "strongs": "G679"},
{"word": "ويوقفكم", "strongs": "G2476"},
{"word": "امام", "strongs": "G2714"},
{"word": "مجده", "strongs": "G1391"},
{"word": "بلا", "strongs": "G0"},
{"word": "عيب", "strongs": "G299"},
{"word": "في", "strongs": "G1722"},
{"word": "الابتهاج", "strongs": "G20"},
{"word": "الاله", "strongs": "G2316"},
{"word": "الحكيم", "strongs": "G4680"},
{"word": "الوحيد", "strongs": "G3441"},
{"word": "مخلصنا", "strongs": "G4990"},
{"word": "له", "strongs": "G0"},
{"word": "المجد", "strongs": "G1391"},
{"word": "والعظمة", "strongs": "G3172"},
{"word": "والقدرة", "strongs": "G2904"},
{"word": "والسلطان", "strongs": "G1849"},
{"word": "الان", "strongs": "G3568"},
{"word": "والى", "strongs": "G1519"},
{"word": "كل", "strongs": "G3956"},
{"word": "الدهور", "strongs": "G165"},
{"word": "امين", "strongs": "G281"}
];

const verses = [
  {
    "id": "11111111-0000-0000-0065-000000001016",
    "chapter_num": 1,
    "verse_num": 16,
    "text_avd_ar": "هؤلاء هم مدمدمون متشكون سالكون بحسب شهواتهم وفمهم يتكلم بعظائم يحابون بالوجوه من اجل المنفعة."
  },
  {
    "id": "11111111-0000-0000-0065-000000001017",
    "chapter_num": 1,
    "verse_num": 17,
    "text_avd_ar": "واما انتم ايها الاحباء فاذكروا الاقوال التي قالها سابقا رسل ربنا يسوع المسيح."
  },
  {
    "id": "11111111-0000-0000-0065-000000001018",
    "chapter_num": 1,
    "verse_num": 18,
    "text_avd_ar": "فانهم قالوا لكم انه في الزمان الاخير سيكون قوم مستهزئون سالكين بحسب شهوات فجورهم."
  },
  {
    "id": "11111111-0000-0000-0065-000000001019",
    "chapter_num": 1,
    "verse_num": 19,
    "text_avd_ar": "هؤلاء هم المعتزلون بانفسهم نفسانيون لا روح لهم"
  },
  {
    "id": "11111111-0000-0000-0065-000000001020",
    "chapter_num": 1,
    "verse_num": 20,
    "text_avd_ar": "واما انتم ايها الاحباء فابنوا انفسكم على ايمانكم الاقدس مصلّين في الروح القدس"
  },
  {
    "id": "11111111-0000-0000-0065-000000001021",
    "chapter_num": 1,
    "verse_num": 21,
    "text_avd_ar": "واحفظوا انفسكم في محبة الله منتظرين رحمة ربنا يسوع المسيح للحياة الابدية."
  },
  {
    "id": "11111111-0000-0000-0065-000000001022",
    "chapter_num": 1,
    "verse_num": 22,
    "text_avd_ar": "وارحموا البعض مميّزين"
  },
  {
    "id": "11111111-0000-0000-0065-000000001023",
    "chapter_num": 1,
    "verse_num": 23,
    "text_avd_ar": "وخلّصوا البعض بالخوف مختطفين من النار مبغضين حتى الثوب المدنس من الجسد"
  },
  {
    "id": "11111111-0000-0000-0065-000000001024",
    "chapter_num": 1,
    "verse_num": 24,
    "text_avd_ar": "والقادر ان يحفظكم غير عاثرين ويوقفكم امام مجده بلا عيب في الابتهاج"
  },
  {
    "id": "11111111-0000-0000-0065-000000001025",
    "chapter_num": 1,
    "verse_num": 25,
    "text_avd_ar": "الاله الحكيم الوحيد مخلّصنا له المجد والعظمة والقدرة والسلطان الآن والى كل الدهور. آمين"
  }
];

let fIndex = 0;
for (let v of verses) {
  let cleanText = v.text_avd_ar.replace(/[.,:;؟!`"'\(\)\[\]\{\}]/g, '').replace(/[\u064B-\u065F\u0640]/g, '');
  let words = cleanText.split(/\s+/).filter(w => w.trim().length > 0);
  
  if (v.verse_num === 17) {
    // AVD: التي قالها سابقا رسل
    // AI: التي قيلت سابقا من رسل
    // So "قالها" became "قيلت" and "سابقا" "من"
    words.splice(6, 1, "قيلت");
    words.splice(8, 0, "من");
  }
  
  for (let i=0; i<words.length; i++) {
    let fWord = flatList2[fIndex]?.word;
    if (fWord !== words[i]) {
       console.log(`Mismatch at v${v.verse_num} w${i}: Verse="` + words[i] + `" vs List="` + fWord + `"`);
    }
    fIndex++;
  }
}
