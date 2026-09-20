// lib/features/reader/screens/chapter_reader_screen.dart
// ─────────────────────────────────────────────────────────────────────────────
// Dual-text chapter reader.
// Each verse card shows:
//   • Arabic AVD text (RTL, large, gold)
//   • Separator
//   • Original Hebrew/Greek text (RTL/LTR, smaller, colored)
// Tapping a verse navigates to the Word Study screen.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/reader_provider.dart';
import '../../../providers/navigation_provider.dart';
import '../../../models/verse.dart';

class ChapterReaderScreen extends StatefulWidget {
  final int bookId;
  final int chapterNum;
  const ChapterReaderScreen({super.key, required this.bookId, required this.chapterNum});

  @override
  State<ChapterReaderScreen> createState() => _ChapterReaderScreenState();
}

class _ChapterReaderScreenState extends State<ChapterReaderScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReaderProvider>().loadChapter(widget.bookId, widget.chapterNum);
    });
  }

  void _navigatePrev(ReaderProvider reader) {
    if (widget.chapterNum > 1) {
      reader.clear();
      context.pushReplacementNamed('reader', pathParameters: {
        'bookId':     '${widget.bookId}',
        'chapterNum': '${widget.chapterNum - 1}',
      });
    }
  }

  void _navigateNext(ReaderProvider reader, int totalChapters) {
    if (widget.chapterNum < totalChapters) {
      reader.clear();
      context.pushReplacementNamed('reader', pathParameters: {
        'bookId':     '${widget.bookId}',
        'chapterNum': '${widget.chapterNum + 1}',
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final reader  = context.watch<ReaderProvider>();
    final nav     = context.watch<NavigationProvider>();
    final book    = nav.getBook(widget.bookId);
    final totalCh = book?.chapterCount ?? 999;

    return Scaffold(
      appBar: AppBar(
        title: book != null
            ? Column(
                children: [
                  Directionality(
                    textDirection: TextDirection.rtl,
                    child: Text(book.nameArShort, style: AppTheme.arabicLabel(size: 16)),
                  ),
                  Text(
                    'Chapter ${widget.chapterNum}',
                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  ),
                ],
              )
            : Text('Chapter ${widget.chapterNum}'),
        actions: [
          // Font size controls
          IconButton(
            icon: const Icon(Icons.text_decrease, size: 20),
            onPressed: reader.decreaseFontSize,
            tooltip: 'Decrease font',
          ),
          IconButton(
            icon: const Icon(Icons.text_increase, size: 20),
            onPressed: reader.increaseFontSize,
            tooltip: 'Increase font',
          ),
          // Toggle original text
          IconButton(
            icon: Icon(
              reader.showOriginal ? Icons.visibility : Icons.visibility_off,
              size: 20,
              color: reader.showOriginal ? AppColors.primary : AppColors.textMuted,
            ),
            onPressed: reader.toggleOriginalText,
            tooltip: 'Toggle original text',
          ),
          // Search
          IconButton(
            icon: const Icon(Icons.search, size: 20),
            onPressed: () => context.pushNamed('search'),
          ),
          const SizedBox(width: 4),
        ],
      ),

      body: reader.loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
          : reader.error.isNotEmpty
              ? _ErrorRetry(reader.error, () => reader.loadChapter(widget.bookId, widget.chapterNum))
              : reader.verses.isEmpty
                  ? const Center(child: Text('No verses found', style: TextStyle(color: AppColors.textMuted)))
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(12, 8, 12, 100),
                      itemCount: reader.verses.length,
                      itemBuilder: (ctx, i) => _VerseCard(
                        verse:      reader.verses[i],
                        fontSize:   reader.fontSize,
                        showOrig:   reader.showOriginal,
                        chapterNum: widget.chapterNum,
                      ),
                    ),

      // Chapter prev/next navigation bar
      bottomNavigationBar: Container(
        height: 56,
        decoration: const BoxDecoration(
          color:  AppColors.bgSurface,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: Row(
          children: [
            // Prev
            Expanded(
              child: TextButton.icon(
                onPressed: widget.chapterNum > 1 ? () => _navigatePrev(reader) : null,
                icon: const Icon(Icons.chevron_left, size: 20),
                label: const Text('Prev'),
                style: TextButton.styleFrom(
                  foregroundColor: widget.chapterNum > 1 ? AppColors.primary : AppColors.textMuted,
                ),
              ),
            ),

            // Chapter indicator
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color:        AppColors.primaryGlow,
                borderRadius: BorderRadius.circular(20),
                border:       Border.all(color: AppColors.primary.withOpacity(0.4)),
              ),
              child: Text(
                '${widget.chapterNum} / $totalCh',
                style: const TextStyle(color: AppColors.primaryText, fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ),

            // Next
            Expanded(
              child: TextButton.icon(
                onPressed: widget.chapterNum < totalCh ? () => _navigateNext(reader, totalCh) : null,
                icon: const Icon(Icons.chevron_right, size: 20),
                label: const Text('Next'),
                style: TextButton.styleFrom(
                  foregroundColor: widget.chapterNum < totalCh ? AppColors.primary : AppColors.textMuted,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Verse Card ─────────────────────────────────────────────────────────────
class _VerseCard extends StatelessWidget {
  final Verse  verse;
  final double fontSize;
  final bool   showOrig;
  final int    chapterNum;
  const _VerseCard({required this.verse, required this.fontSize, required this.showOrig, required this.chapterNum});

  @override
  Widget build(BuildContext context) {
    final origStyle = verse.isHebrew
        ? AppTheme.hebrewText(size: fontSize * 0.82)
        : AppTheme.greekText(size: fontSize * 0.82);

    return GestureDetector(
      onTap: () => context.pushNamed(
        'word-study',
        pathParameters: {'verseId': verse.id},
        extra: {
          'verse_num':  verse.verseNum,
          'chapter_num': chapterNum,
          'text_avd_ar': verse.textAvdAr,
          'text_original': verse.textManuscript ?? verse.textOriginal,
          'text_original_lang': verse.textOriginalLang,
        },
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color:        AppColors.bgCard,
          border:       Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            splashColor:  AppColors.primaryGlow,
            onTap: () => context.pushNamed(
              'word-study',
              pathParameters: {'verseId': verse.id},
              extra: {
                'verse_num':  verse.verseNum,
                'chapter_num': chapterNum,
                'text_avd_ar': verse.textAvdAr,
                'text_original': verse.textManuscript ?? verse.textOriginal,
                'text_original_lang': verse.textOriginalLang,
              },
            ),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Verse number badge
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color:        AppColors.primaryGlow,
                          borderRadius: BorderRadius.circular(100),
                          border:       Border.all(color: AppColors.primary.withOpacity(0.35)),
                        ),
                        child: Text(
                          '$chapterNum:${verse.verseNum}',
                          style: const TextStyle(
                            color:      AppColors.primaryText,
                            fontSize:   11,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 16),
                    ],
                  ),

                  const SizedBox(height: 10),

                  // Arabic AVD text
                  Directionality(
                    textDirection: TextDirection.rtl,
                    child: Text(
                      verse.textAvdAr,
                      style: AppTheme.arabicVerse(size: fontSize),
                      textAlign: TextAlign.justify,
                    ),
                  ),

                  // Original text
                  if (showOrig) ...[
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 10),
                      child: Divider(color: AppColors.border, height: 1),
                    ),
                    Directionality(
                      textDirection: verse.isHebrew ? TextDirection.rtl : TextDirection.ltr,
                      child: Text(
                        verse.textManuscript ?? verse.textOriginal,
                        style: origStyle,
                        textAlign: verse.isHebrew ? TextAlign.right : TextAlign.left,
                      ),
                    ),
                  ],

                  // Tap hint
                  const SizedBox(height: 8),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Icon(Icons.touch_app_outlined, size: 12, color: AppColors.textMuted),
                      SizedBox(width: 4),
                      Text('Word Study', style: TextStyle(color: AppColors.textMuted, fontSize: 10)),
                    ],
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

class _ErrorRetry extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorRetry(this.message, this.onRetry);
  @override
  Widget build(BuildContext context) => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('⚠ $message', style: const TextStyle(color: AppColors.danger), textAlign: TextAlign.center),
        const SizedBox(height: 16),
        ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
      ],
    ),
  );
}
