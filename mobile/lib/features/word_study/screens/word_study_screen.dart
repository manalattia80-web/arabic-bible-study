// lib/features/word_study/screens/word_study_screen.dart
// ─────────────────────────────────────────────────────────────────────────────
// Interlinear word study table for a selected verse.
// Each row maps one Arabic AVD word ↔ Hebrew/Greek original.
// Tapping a row opens the StrongsModal bottom sheet.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/word_study_provider.dart';
import '../../../models/word_mapping.dart';
import '../widgets/strongs_modal.dart';

class WordStudyScreen extends StatefulWidget {
  final String              verseId;
  final Map<String, dynamic>? verse;  // Pre-loaded verse data passed via go_router extra
  const WordStudyScreen({super.key, required this.verseId, this.verse});

  @override
  State<WordStudyScreen> createState() => _WordStudyScreenState();
}

class _WordStudyScreenState extends State<WordStudyScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WordStudyProvider>().loadWordMappings(widget.verseId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider  = context.watch<WordStudyProvider>();
    final verse     = widget.verse;
    final chapterNum = verse?['chapter_num'] as int? ?? 0;
    final verseNum   = verse?['verse_num']   as int? ?? 0;
    final lang       = verse?['text_original_lang'] as String? ?? 'hebrew';

    return Scaffold(
      appBar: AppBar(
        title: Text(
          verseNum > 0 ? 'Word Study · $chapterNum:$verseNum' : 'Word Study',
        ),
        subtitle: const Text('Tap any row for Strong\'s definition', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
      ),

      body: CustomScrollView(
        slivers: [
          // ── Verse Display ──────────────────────────────────────
          if (verse != null)
            SliverToBoxAdapter(child: _VerseHeader(verse: verse, lang: lang)),

          // ── Stats row ──────────────────────────────────────────
          if (!provider.loadingMappings && provider.mappings.isNotEmpty)
            SliverToBoxAdapter(child: _MappingsStats(mappings: provider.mappings)),

          // ── Table Header ───────────────────────────────────────
          if (!provider.loadingMappings && provider.mappings.isNotEmpty)
            const SliverToBoxAdapter(child: _TableHeader()),

          // ── Table Body ─────────────────────────────────────────
          if (provider.loadingMappings)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)),
            )
          else if (provider.mappingsError.isNotEmpty)
            SliverFillRemaining(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('⚠', style: TextStyle(fontSize: 32)),
                      const SizedBox(height: 8),
                      Text(provider.mappingsError, style: const TextStyle(color: AppColors.danger), textAlign: TextAlign.center),
                    ],
                  ),
                ),
              ),
            )
          else if (provider.mappings.isEmpty)
            const SliverFillRemaining(
              child: Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('⇌', style: TextStyle(fontSize: 40, color: AppColors.textMuted)),
                      SizedBox(height: 12),
                      Text('No word mappings yet for this verse', style: TextStyle(color: AppColors.textMuted), textAlign: TextAlign.center),
                      SizedBox(height: 6),
                      Text('Admins are working on aligning the words', style: TextStyle(color: AppColors.textMuted, fontSize: 12), textAlign: TextAlign.center),
                    ],
                  ),
                ),
              ),
            )
          else
            SliverList.builder(
              itemCount: provider.mappings.length,
              itemBuilder: (ctx, i) => _WordRow(
                mapping: provider.mappings[i],
                index:   i,
                onTap: provider.mappings[i].hasStrongs
                    ? () => StrongsModal.show(ctx, provider.mappings[i].strongsId!)
                    : null,
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }
}

// ── Verse Header ───────────────────────────────────────────────────────────
class _VerseHeader extends StatelessWidget {
  final Map<String, dynamic> verse;
  final String lang;
  const _VerseHeader({required this.verse, required this.lang});

  @override
  Widget build(BuildContext context) {
    final isHebrew = lang == 'hebrew' || lang == 'aramaic';
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 12, 12, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color:        AppColors.bgSurface,
        border:       Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Arabic text
          Directionality(
            textDirection: TextDirection.rtl,
            child: Text(
              verse['text_avd_ar'] as String? ?? '',
              style: AppTheme.arabicVerse(size: 18),
              textAlign: TextAlign.right,
            ),
          ),
          const Divider(color: AppColors.border, height: 20),
          // Original text
          Directionality(
            textDirection: isHebrew ? TextDirection.rtl : TextDirection.ltr,
            child: Text(
              verse['text_original'] as String? ?? '',
              style: isHebrew
                  ? AppTheme.hebrewText(size: 15)
                  : AppTheme.greekText(size: 14),
              textAlign: isHebrew ? TextAlign.right : TextAlign.left,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Stats Row ──────────────────────────────────────────────────────────────
class _MappingsStats extends StatelessWidget {
  final List<WordMapping> mappings;
  const _MappingsStats({required this.mappings});

  @override
  Widget build(BuildContext context) {
    final verified = mappings.where((m) => m.isVerified).length;
    final withAudio = mappings.where((m) => m.hasAudio).length;
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
      child: Row(
        children: [
          _stat('${mappings.length}', 'words', AppColors.textSecondary),
          const SizedBox(width: 12),
          _stat('$verified', 'verified', AppColors.success),
          const SizedBox(width: 12),
          _stat('$withAudio', 'with audio', AppColors.info),
        ],
      ),
    );
  }

  Widget _stat(String val, String label, Color color) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Text(val, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 13)),
      const SizedBox(width: 3),
      Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
    ],
  );
}

// ── Table Header ───────────────────────────────────────────────────────────
class _TableHeader extends StatelessWidget {
  const _TableHeader();
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.fromLTRB(12, 4, 12, 0),
    padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
    decoration: const BoxDecoration(
      color:  AppColors.bgSurface,
      border: Border(
        left:   BorderSide(color: AppColors.border),
        right:  BorderSide(color: AppColors.border),
        top:    BorderSide(color: AppColors.border),
        bottom: BorderSide(color: AppColors.borderLight, width: 2),
      ),
      borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
    ),
    child: const Row(
      children: [
        SizedBox(width: 28, child: Text('#', style: TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w700))),
        Expanded(flex: 3, child: Align(alignment: Alignment.centerRight, child: Text('ARABIC', style: TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w700)))),
        SizedBox(width: 12),
        Expanded(flex: 3, child: Align(alignment: Alignment.centerRight, child: Text('ORIGINAL', style: TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w700)))),
        SizedBox(width: 12),
        Expanded(flex: 2, child: Text('TRANSLIT', style: TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w700))),
        SizedBox(width: 40),
      ],
    ),
  );
}

// ── Word Row ───────────────────────────────────────────────────────────────
class _WordRow extends StatelessWidget {
  final WordMapping    mapping;
  final int            index;
  final VoidCallback?  onTap;
  const _WordRow({required this.mapping, required this.index, this.onTap});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WordStudyProvider>();
    final isEven   = index.isEven;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: isEven ? AppColors.bgCard : AppColors.bgSurface,
          border: const Border(
            left:  BorderSide(color: AppColors.border),
            right: BorderSide(color: AppColors.border),
            bottom: BorderSide(color: AppColors.border),
          ),
          borderRadius: index == 0
              ? BorderRadius.zero
              : BorderRadius.zero, // Table style — no radius on rows
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            splashColor: AppColors.primaryGlow,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Position
                  SizedBox(
                    width: 28,
                    child: Text(
                      '${mapping.arWordPosition}',
                      style: const TextStyle(
                        color:      AppColors.textMuted,
                        fontSize:   11,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),

                  // Arabic word (RTL)
                  Expanded(
                    flex: 3,
                    child: Directionality(
                      textDirection: TextDirection.rtl,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            mapping.arWord,
                            style: AppTheme.arabicLabel(size: 17),
                          ),
                          if (mapping.transliterationAr != null)
                            Directionality(
                              textDirection: TextDirection.rtl,
                              child: Text(
                                mapping.transliterationAr!,
                                style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(width: 12),

                  // Original word
                  Expanded(
                    flex: 3,
                    child: Directionality(
                      textDirection: mapping.isHebrew ? TextDirection.rtl : TextDirection.ltr,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            mapping.origWord,
                            style: mapping.isHebrew
                                ? AppTheme.hebrewText(size: 17)
                                : AppTheme.greekText(size: 16),
                            textAlign: mapping.isHebrew ? TextAlign.right : TextAlign.right,
                          ),
                          if (mapping.origMorphology != null)
                            Text(
                              mapping.origMorphology!,
                              style: const TextStyle(
                                color:      AppColors.textMuted,
                                fontSize:   10,
                                fontFamily: 'monospace',
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(width: 12),

                  // Transliteration (Latin) + Strong's
                  Expanded(
                    flex: 2,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (mapping.transliterationLat != null)
                          Text(
                            mapping.transliterationLat!,
                            style: const TextStyle(
                              color:     AppColors.textSecondary,
                              fontSize:  12,
                              fontStyle: FontStyle.italic,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        if (mapping.hasStrongs)
                          Text(
                            mapping.strongsId!,
                            style: const TextStyle(
                              color:      AppColors.info,
                              fontSize:   11,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'monospace',
                            ),
                          ),
                      ],
                    ),
                  ),

                  // Action icons (audio + Strong's indicator)
                  SizedBox(
                    width: 40,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        if (mapping.hasAudio)
                          GestureDetector(
                            onTap: () => provider.playAudio(mapping.audioUrl!),
                            child: Icon(
                              provider.isPlaying(mapping.audioUrl!)
                                  ? Icons.stop_circle
                                  : Icons.play_circle_outline,
                              size:  20,
                              color: provider.isPlaying(mapping.audioUrl!)
                                  ? AppColors.primary
                                  : AppColors.textMuted,
                            ),
                          ),
                        if (mapping.hasStrongs)
                          const Icon(Icons.info_outline, size: 16, color: AppColors.textMuted),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
