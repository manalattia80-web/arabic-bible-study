// lib/features/reader/widgets/verse_comparison_modal.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/verse.dart';

class VerseComparisonModal extends StatelessWidget {
  final Verse verse;

  const VerseComparisonModal({super.key, required this.verse});

  static Future<void> show(BuildContext context, Verse verse) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => VerseComparisonModal(verse: verse),
    );
  }

  void _copyAll(BuildContext context) {
    final buffer = StringBuffer();
    buffer.writeln('【 ${verse.reference} 】');
    buffer.writeln();
    buffer.writeln('● الفانديك (Smith & Van Dyke):');
    buffer.writeln(verse.textAvdAr);
    if (verse.textAlab != null && verse.textAlab!.isNotEmpty) {
      buffer.writeln();
      buffer.writeln('● كتاب الحياة (ALAB):');
      buffer.writeln(verse.textAlab);
    }
    if (verse.textErv != null && verse.textErv!.isNotEmpty) {
      buffer.writeln();
      buffer.writeln('● الترجمة العربية المبسطة (ERV):');
      buffer.writeln(verse.textErv);
    }
    if (verse.textKjv != null && verse.textKjv!.isNotEmpty) {
      buffer.writeln();
      buffer.writeln('● King James Version (KJV):');
      buffer.writeln(verse.textKjv);
    }
    if (verse.textNiv != null && verse.textNiv!.isNotEmpty) {
      buffer.writeln();
      buffer.writeln('● New International Version (NIV):');
      buffer.writeln(verse.textNiv);
    }

    Clipboard.setData(ClipboardData(text: buffer.toString()));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('تم نسخ جميع الترجمات بنجاح', textAlign: TextAlign.center),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _copySingle(BuildContext context, String title, String text) {
    Clipboard.setData(ClipboardData(text: '$title (${verse.reference}):\n$text'));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('تم نسخ $title', textAlign: TextAlign.center),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      maxChildSize: 0.95,
      minChildSize: 0.45,
      expand: false,
      builder: (ctx, scrollCtrl) => Container(
        decoration: BoxDecoration(
          color: AppColors.bgCard,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(color: AppColors.border, width: 1),
        ),
        child: Column(
          children: [
            // Handle bar
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderLight,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                textDirection: TextDirection.rtl,
                children: [
                  Row(
                    textDirection: TextDirection.rtl,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.primaryGlow,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                        ),
                        child: Icon(Icons.compare_arrows_rounded, color: AppColors.primary, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'مقارنة الترجمات',
                            style: TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          Text(
                            verse.reference,
                            style: TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  IconButton(
                    onPressed: () => _copyAll(context),
                    icon: const Icon(Icons.copy_all_rounded),
                    color: AppColors.primary,
                    tooltip: 'نسخ جميع الترجمات',
                  ),
                ],
              ),
            ),

            const Divider(height: 1, color: AppColors.border),

            // Translations list
            Expanded(
              child: ListView(
                controller: scrollCtrl,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                children: [
                  // 1. Smith & Van Dyke (AVD)
                  _buildTranslationCard(
                    context: context,
                    code: 'AVD',
                    title: 'ترجمة الفانديك (Smith & Van Dyke)',
                    text: verse.textAvdAr,
                    isArabic: true,
                    isPrimary: true,
                  ),

                  // 2. Arabic Life Application Bible (ALAB)
                  if (verse.textAlab != null && verse.textAlab!.isNotEmpty)
                    _buildTranslationCard(
                      context: context,
                      code: 'ALAB',
                      title: 'كتاب الحياة (الترجمة التفسيرية)',
                      text: verse.textAlab!,
                      isArabic: true,
                    ),

                  // 3. Easy-to-Read Version (ERV-AR)
                  if (verse.textErv != null && verse.textErv!.isNotEmpty)
                    _buildTranslationCard(
                      context: context,
                      code: 'ERV',
                      title: 'الترجمة العربية المبسطة',
                      text: verse.textErv!,
                      isArabic: true,
                    ),

                  // 4. King James Version (KJV)
                  if (verse.textKjv != null && verse.textKjv!.isNotEmpty)
                    _buildTranslationCard(
                      context: context,
                      code: 'KJV',
                      title: 'King James Version',
                      text: verse.textKjv!,
                      isArabic: false,
                    ),

                  // 5. New International Version (NIV)
                  if (verse.textNiv != null && verse.textNiv!.isNotEmpty)
                    _buildTranslationCard(
                      context: context,
                      code: 'NIV',
                      title: 'New International Version',
                      text: verse.textNiv!,
                      isArabic: false,
                    ),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTranslationCard({
    required BuildContext context,
    required String code,
    required String title,
    required String text,
    required bool isArabic,
    bool isPrimary = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: isPrimary ? AppColors.primaryGlow.withOpacity(0.3) : AppColors.bgSurface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isPrimary ? AppColors.primary.withOpacity(0.5) : AppColors.border,
          width: isPrimary ? 1.5 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Top tag & copy button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              textDirection: isArabic ? TextDirection.rtl : TextDirection.ltr,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  textDirection: isArabic ? TextDirection.rtl : TextDirection.ltr,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: isPrimary ? AppColors.primary : AppColors.bgCard,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppColors.primary.withOpacity(0.4)),
                      ),
                      child: Text(
                        code,
                        style: TextStyle(
                          color: isPrimary ? AppColors.primaryBackground : AppColors.primaryText,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      title,
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                InkWell(
                  onTap: () => _copySingle(context, title, text),
                  borderRadius: BorderRadius.circular(6),
                  child: Padding(
                    padding: const EdgeInsets.all(4),
                    child: Icon(Icons.copy_rounded, size: 16, color: AppColors.textMuted),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 10),

            // Verse text
            Directionality(
              textDirection: isArabic ? TextDirection.rtl : TextDirection.ltr,
              child: Text(
                text,
                style: isArabic
                    ? AppTheme.arabicVerse(size: 17, color: AppColors.textPrimary)
                    : const TextStyle(
                        fontSize: 15,
                        height: 1.45,
                        fontFamily: 'serif',
                        color: AppColors.textPrimary,
                      ),
                textAlign: isArabic ? TextAlign.justify : TextAlign.left,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
