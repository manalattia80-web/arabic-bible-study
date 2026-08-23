// lib/features/word_study/widgets/strongs_modal.dart
// ─────────────────────────────────────────────────────────────────────────────
// Bottom sheet displaying the full Strong's lexicon entry.
// Shows: original word, transliteration, English + Arabic definitions,
//        root word, morphology, KJV usage, and audio play button.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/word_study_provider.dart';
import 'audio_button.dart';

class StrongsModal extends StatelessWidget {
  final String strongsId;
  const StrongsModal({super.key, required this.strongsId});

  static Future<void> show(BuildContext context, String strongsId) {
    final provider = context.read<WordStudyProvider>();
    provider.loadStrongsEntry(strongsId);
    return showModalBottomSheet(
      context:        context,
      isScrollControlled: true,
      useSafeArea:    true,
      builder: (_) => ChangeNotifierProvider.value(
        value: provider,
        child: StrongsModal(strongsId: strongsId),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WordStudyProvider>();
    final entry    = provider.selectedStrongs;

    return DraggableScrollableSheet(
      initialChildSize: 0.65,
      maxChildSize:     0.95,
      minChildSize:     0.4,
      expand:           false,
      builder: (ctx, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: AppColors.bgCard,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: CustomScrollView(
          controller: scrollCtrl,
          slivers: [
            // Drag handle
            SliverToBoxAdapter(
              child: Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 12),
                  width: 36, height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.borderLight,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ),

            // Loading state
            if (provider.loadingStrongs)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)),
              )
            else if (entry == null)
              const SliverFillRemaining(
                child: Center(child: Text('Entry not found', style: TextStyle(color: AppColors.textMuted))),
              )
            else ...[
              // ── Header ─────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Big original word
                      Expanded(
                        child: Directionality(
                          textDirection: entry.isHebrew ? TextDirection.rtl : TextDirection.ltr,
                          child: Text(
                            entry.originalWord,
                            style: entry.isHebrew
                                ? AppTheme.hebrewText(size: 36)
                                : AppTheme.greekText(size: 32),
                          ),
                        ),
                      ),

                      // Strong's ID badge
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color:        entry.isHebrew
                                  ? AppColors.hebrewText.withOpacity(0.12)
                                  : AppColors.greekText.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(100),
                              border: Border.all(
                                color: entry.isHebrew
                                    ? AppColors.hebrewText.withOpacity(0.4)
                                    : AppColors.greekText.withOpacity(0.4),
                              ),
                            ),
                            child: Text(
                              entry.strongsId,
                              style: TextStyle(
                                color: entry.isHebrew ? AppColors.hebrewText : AppColors.greekText,
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          _langBadge(entry.language),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // Transliteration + Pronunciation + Audio
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                  child: Row(
                    children: [
                      Text(
                        entry.transliteration,
                        style: const TextStyle(
                          color:      AppColors.textSecondary,
                          fontSize:   16,
                          fontStyle:  FontStyle.italic,
                        ),
                      ),
                      if (entry.pronunciation != null) ...[
                        const Text(' • ', style: TextStyle(color: AppColors.textMuted)),
                        Text(
                          entry.pronunciation!,
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 14),
                        ),
                      ],
                      if (entry.pronunciationAr != null) ...[
                        const Text(' • ', style: TextStyle(color: AppColors.textMuted)),
                        Directionality(
                          textDirection: TextDirection.rtl,
                          child: Text(
                            entry.pronunciationAr!,
                            style: AppTheme.arabicVerse(size: 22, color: AppColors.arabicText),
                          ),
                        ),
                      ],
                      const Spacer(),
                      if (entry.audioUrl != null && entry.audioUrl!.isNotEmpty)
                        AudioButton(url: entry.audioUrl!),
                    ],
                  ),
                ),
              ),

              // Root word
              if (entry.rootWord != null)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 6, 20, 0),
                    child: Row(
                      children: [
                        const Text('Root: ', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                        Directionality(
                          textDirection: entry.isHebrew ? TextDirection.rtl : TextDirection.ltr,
                          child: Text(
                            entry.rootWord!,
                            style: entry.isHebrew
                                ? AppTheme.hebrewText(size: 16)
                                : AppTheme.greekText(size: 14),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(20, 14, 20, 14),
                  child: Divider(color: AppColors.border),
                ),
              ),

              // ── Arabic Definition (if available) ───────────────
              if (entry.hasArabicDef) ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                    child: _Section(
                      label: 'Arabic Definition · المعنى بالعربية',
                      child: Column(
                        children: [
                          if (entry.notesAr != null)
                            Directionality(
                              textDirection: TextDirection.rtl,
                              child: Text(
                                entry.notesAr!,
                                style: AppTheme.arabicVerse(size: 24, color: AppColors.arabicText),
                                textAlign: TextAlign.right,
                              ),
                            ),
                          if (entry.definitionAr != null) ...[
                            const SizedBox(height: 8),
                            Directionality(
                              textDirection: TextDirection.rtl,
                              child: Text(
                                entry.definitionAr!,
                                style: const TextStyle(color: AppColors.textSecondary, fontSize: 18, height: 1.6),
                                textAlign: TextAlign.right,
                              ),
                            ),
                          ],
                          if (entry.arIsVerified)
                            const Align(
                              alignment: Alignment.centerRight,
                              child: Padding(
                                padding: EdgeInsets.only(top: 6),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.verified, color: AppColors.success, size: 13),
                                    SizedBox(width: 4),
                                    Text('Verified by scholars', style: TextStyle(color: AppColors.success, fontSize: 11)),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(20, 14, 20, 14),
                    child: Divider(color: AppColors.border),
                  ),
                ),
              ],

              // ── English Definition ─────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                  child: _Section(
                    label: 'English Definition',
                    child: Text(
                      entry.definitionEn,
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.65),
                    ),
                  ),
                ),
              ),

              // KJV Usage
              if (entry.kjvUsage != null && entry.kjvUsage!.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                    child: _Section(
                      label: 'KJV Usage',
                      child: Text(
                        entry.kjvUsage!,
                        style: const TextStyle(
                          color:      AppColors.textMuted,
                          fontSize:   12,
                          fontStyle:  FontStyle.italic,
                          height:     1.6,
                        ),
                      ),
                    ),
                  ),
                ),

              const SliverToBoxAdapter(child: SizedBox(height: 40)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _langBadge(String lang) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
    decoration: BoxDecoration(
      color:        AppColors.bgSurface,
      borderRadius: BorderRadius.circular(100),
      border:       Border.all(color: AppColors.border),
    ),
    child: Text(
      lang[0].toUpperCase() + lang.substring(1),
      style: const TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w600),
    ),
  );
}

// ── Section label + content ────────────────────────────────────────────────
class _Section extends StatelessWidget {
  final String label;
  final Widget child;
  const _Section({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color:      AppColors.primary,
            fontSize:   10,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}
