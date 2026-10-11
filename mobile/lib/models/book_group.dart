// lib/models/book_group.dart
// ─────────────────────────────────────────────────────────────────────────────
// Biblical Book Divisions / Groups for canonical classification and search filters.
// ─────────────────────────────────────────────────────────────────────────────

class BookGroup {
  final String id;
  final String nameAr;
  final String descriptionAr;
  final int    testamentId; // 1: Old Testament, 2: New Testament
  final List<int> bookIds;

  const BookGroup({
    required this.id,
    required this.nameAr,
    required this.descriptionAr,
    required this.testamentId,
    required this.bookIds,
  });

  static const List<BookGroup> allGroups = [
    // ── Old Testament ──────────────────────────────────────────
    BookGroup(
      id: 'ot_law',
      nameAr: 'أسفار الشريعة (التوراة)',
      descriptionAr: 'التكوين – التثنية (٥ أسفار)',
      testamentId: 1,
      bookIds: [1, 2, 3, 4, 5],
    ),
    BookGroup(
      id: 'ot_history',
      nameAr: 'الأسفار التاريخية',
      descriptionAr: 'يشوع – أستير (١٢ سفراً)',
      testamentId: 1,
      bookIds: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    ),
    BookGroup(
      id: 'ot_poetry',
      nameAr: 'الأسفار الشعرية والحكمية',
      descriptionAr: 'أيوب – نشيد الأنشاد (٥ أسفار)',
      testamentId: 1,
      bookIds: [18, 19, 20, 21, 22],
    ),
    BookGroup(
      id: 'ot_major_prophets',
      nameAr: 'الأنبياء الكبار',
      descriptionAr: 'إشعياء – دانيال (٥ أسفار)',
      testamentId: 1,
      bookIds: [23, 24, 25, 26, 27],
    ),
    BookGroup(
      id: 'ot_minor_prophets',
      nameAr: 'الأنبياء الصغار',
      descriptionAr: 'هوشع – ملاخي (١٢ سفراً)',
      testamentId: 1,
      bookIds: [28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    ),

    // ── New Testament ──────────────────────────────────────────
    BookGroup(
      id: 'nt_gospels',
      nameAr: 'الأناجيل الأربعة',
      descriptionAr: 'متى – يوحنا (٤ بشائر)',
      testamentId: 2,
      bookIds: [40, 41, 42, 43],
    ),
    BookGroup(
      id: 'nt_history',
      nameAr: 'السفر التاريخي',
      descriptionAr: 'سفر أعمال الرسل (سفر واحد)',
      testamentId: 2,
      bookIds: [44],
    ),
    BookGroup(
      id: 'nt_pauline',
      nameAr: 'رسائل بولس الرسول',
      descriptionAr: 'رومية – فليمون (١٣ رسالة)',
      testamentId: 2,
      bookIds: [45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57],
    ),
    BookGroup(
      id: 'nt_general_epistles',
      nameAr: 'الرسائل العامة',
      descriptionAr: 'العبرانيين – يهوذا (٨ رسائل)',
      testamentId: 2,
      bookIds: [58, 59, 60, 61, 62, 63, 64, 65],
    ),
    BookGroup(
      id: 'nt_prophecy',
      nameAr: 'السفر النبوي',
      descriptionAr: 'سفر الرؤيا (سفر واحد)',
      testamentId: 2,
      bookIds: [66],
    ),
  ];
}
