// lib/features/word_study/widgets/morphology_modal.dart
// ─────────────────────────────────────────────────────────────────────────────
// Interactive Bottom Sheet for Biblical Morphology & Syntax Analysis.
// Displays detailed grammatical breakdown in Arabic for Greek and Hebrew words.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/morphology_service.dart';
import '../../../models/word_mapping.dart';
import 'strongs_modal.dart';
import 'audio_button.dart';

class MorphologyModal extends StatelessWidget {
  final WordMapping mapping;
  final String? verseReference;

  const MorphologyModal({
    super.key,
    required this.mapping,
    this.verseReference,
  });

  static Future<void> show(
    BuildContext context, {
    required WordMapping mapping,
    String? verseReference,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => MorphologyModal(
        mapping: mapping,
        verseReference: verseReference,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final effectiveStrongsId = mapping.hasStrongs
        ? mapping.strongsId
        : StrongsModal.deduceStrongsId(mapping);

    final analysis = MorphologyService.parse(
      code: mapping.origMorphology,
      language: mapping.origWordLang,
      arWord: mapping.arWord,
      origWord: mapping.origWord,
      strongsId: effectiveStrongsId,
    );
    final isHebrew = mapping.isHebrew;

    return DraggableScrollableSheet(
      initialChildSize: 0.65,
      maxChildSize: 0.92,
      minChildSize: 0.4,
      expand: false,
      builder: (ctx, scrollCtrl) => Container(
        decoration: BoxDecoration(
          color: AppColors.bgCard,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.35),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Column(
          children: [
            // Drag handle
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

            // Modal Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Directionality(
                textDirection: TextDirection.rtl,
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(Icons.psychology_outlined, color: AppColors.primary, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'التحليل النحوي والصرفي',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            isHebrew
                                ? 'اللغة العبرية للعهد القديم (Biblical Hebrew)'
                                : 'اللغة اليونانية للعهد الجديد (Koine Greek)',
                            style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      onPressed: () => Navigator.of(context).pop(),
                      color: AppColors.textMuted,
                    ),
                  ],
                ),
              ),
            ),

            Divider(height: 1, color: AppColors.border),

            // Scrollable Content
            Expanded(
              child: ListView(
                controller: scrollCtrl,
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
                children: [
                  // ── Word Spotlight Card ─────────────────────────────
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.bgSurface,
                          AppColors.bgCard,
                        ],
                        begin: Alignment.topRight,
                        end: Alignment.bottomLeft,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Word and Original script
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Original Script
                            Expanded(
                              child: Directionality(
                                textDirection: isHebrew ? TextDirection.rtl : TextDirection.ltr,
                                child: Text(
                                  mapping.origWord,
                                  style: isHebrew
                                      ? AppTheme.hebrewText(size: 32)
                                      : AppTheme.greekText(size: 28),
                                ),
                              ),
                            ),
                            // Audio Button
                            if (mapping.hasAudio)
                              AudioButton(
                                word: mapping.origWord,
                                lang: mapping.origWordLang,
                                url: mapping.audioUrl,
                                tooltip: mapping.isAramaic
                                    ? 'النطق الآرامي معلّق قيد المراجعة'
                                    : 'استماع لصيغة الكلمة في الآية (نطق آلي تقريبي)',
                              ),
                          ],
                        ),

                        const SizedBox(height: 10),

                        // Arabic translation & transliteration
                        Directionality(
                          textDirection: TextDirection.rtl,
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'في الترجمة العربية: ',
                                  style: TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                mapping.arWord,
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primary,
                                ),
                              ),
                              if (mapping.transliterationAr != null) ...[
                                const Spacer(),
                                Text(
                                  mapping.transliterationAr!,
                                  style: TextStyle(
                                    color: AppColors.textMuted,
                                    fontSize: 12,
                                    fontStyle: FontStyle.italic,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ── Quick Morphological Badges ───────────────────────
                  if (analysis.tags.isNotEmpty)
                    Directionality(
                      textDirection: TextDirection.rtl,
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: analysis.tags.map((tag) {
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: AppColors.bgSurface,
                              borderRadius: BorderRadius.circular(100),
                              border: Border.all(color: AppColors.borderLight),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.check_circle_outline, size: 13, color: AppColors.primary),
                                const SizedBox(width: 5),
                                Text(
                                  tag,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ),

                  const SizedBox(height: 20),

                  // ── Detailed Grammatical Breakdown ───────────────────
                  Directionality(
                    textDirection: TextDirection.rtl,
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.bgSurface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: AppColors.border.withOpacity(0.3),
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.auto_awesome_rounded, size: 16, color: AppColors.primary),
                                const SizedBox(width: 8),
                                const Text(
                                  'تفصيل الموقع والصيغة الصرفية',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          _GrammarRow(
                            label: 'القسم اللغوي',
                            value: analysis.partOfSpeech,
                            isFirst: true,
                          ),

                          if (analysis.stem != null)
                            _GrammarRow(
                              label: 'الوزن الصرفي العبري',
                              value: analysis.stem!,
                            ),

                          if (analysis.tense != null)
                            _GrammarRow(
                              label: 'الزمن والتصريف',
                              value: analysis.tense!,
                            ),

                          if (analysis.voice != null)
                            _GrammarRow(
                              label: 'البناء للمعلوم / المجهول',
                              value: analysis.voice!,
                            ),

                          if (analysis.mood != null)
                            _GrammarRow(
                              label: 'الصيغة / الحالة التعبيرية',
                              value: analysis.mood!,
                            ),

                          if (analysis.grammaticalCase != null)
                            _GrammarRow(
                              label: 'الحالة الإعرابية',
                              value: analysis.grammaticalCase!,
                            ),

                          if (analysis.person != null)
                            _GrammarRow(
                              label: 'ضمير الفاعل',
                              value: analysis.person!,
                            ),

                          if (analysis.number != null)
                            _GrammarRow(
                              label: 'العدد (الإفراد والتثنية والجمع)',
                              value: analysis.number!,
                            ),

                          if (analysis.gender != null)
                            _GrammarRow(
                              label: 'الجنس (التذكير والتأنيث)',
                              value: analysis.gender!,
                            ),

                          if (analysis.prefixes.isNotEmpty)
                            _GrammarRow(
                              label: 'الحروف والزوائد المتصلة',
                              value: analysis.prefixes.join(' · '),
                            ),

                          if (analysis.rawCode.isNotEmpty)
                            _GrammarRow(
                              label: 'الرمز الأكاديمي القياسي',
                              value: analysis.rawCode,
                              isMonospace: true,
                            ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // ── Synthesized Sentence Summary ─────────────────────
                  Directionality(
                    textDirection: TextDirection.rtl,
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.lightbulb_outline_rounded, size: 16, color: AppColors.primary),
                              const SizedBox(width: 6),
                              Text(
                                'الخلاصة الإعرابية',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            analysis.summary,
                            style: const TextStyle(
                              fontSize: 13,
                              height: 1.5,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // ── Link to Strong's Dictionary ───────────────────────
                  if (effectiveStrongsId != null && effectiveStrongsId.isNotEmpty)
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        Navigator.of(context).pop();
                        StrongsModal.show(context, effectiveStrongsId, mapping: mapping);
                      },
                      icon: const Icon(Icons.menu_book_rounded, size: 18),
                      label: Text(
                        'عرض معجم سترونج ($effectiveStrongsId) والبعد اللاهوتي',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GrammarRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isFirst;
  final bool isMonospace;

  const _GrammarRow({
    required this.label,
    required this.value,
    this.isFirst = false,
    this.isMonospace = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
      decoration: BoxDecoration(
        border: Border(
          top: isFirst ? BorderSide.none : BorderSide(color: AppColors.border, width: 0.8),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
            child: Text(
              label,
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 13,
                fontWeight: FontWeight.bold,
                fontFamily: isMonospace ? 'monospace' : null,
              ),
              textAlign: TextAlign.left,
            ),
          ),
        ],
      ),
    );
  }
}
