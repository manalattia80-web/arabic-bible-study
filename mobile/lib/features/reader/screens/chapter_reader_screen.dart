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
import '../../../providers/theme_provider.dart';
import '../../../models/verse.dart';
import '../../../core/services/database_service.dart';
import '../widgets/verse_comparison_modal.dart';
import '../widgets/cross_references_modal.dart';

class ChapterReaderScreen extends StatefulWidget {
  final int  bookId;
  final int  chapterNum;
  final int? initialVerseNum;

  const ChapterReaderScreen({
    super.key,
    required this.bookId,
    required this.chapterNum,
    this.initialVerseNum,
  });

  @override
  State<ChapterReaderScreen> createState() => _ChapterReaderScreenState();
}

class _ChapterReaderScreenState extends State<ChapterReaderScreen> {
  final Map<int, GlobalKey> _verseKeys = {};
  final ScrollController _scrollController = ScrollController();
  bool _hasScrolledToTarget = false;

  @override
  void initState() {
    super.initState();
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReaderProvider>().loadChapter(widget.bookId, widget.chapterNum);
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToTargetVerseIfNeeded(ReaderProvider reader) {
    if (_hasScrolledToTarget || widget.initialVerseNum == null || reader.loading || reader.verses.isEmpty) return;
    if (reader.bookId != widget.bookId || reader.chapterNum != widget.chapterNum) return;

    final targetIndex = reader.verses.indexWhere((v) => v.verseNum == widget.initialVerseNum);
    if (targetIndex < 0) return;

    _hasScrolledToTarget = true;
    _attemptScrollToVerse(widget.initialVerseNum!, targetIndex, 0);
  }

  void _attemptScrollToVerse(int verseNum, int targetIndex, int attempt) {
    if (!mounted) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final targetKey = _verseKeys[verseNum];
      if (targetKey?.currentContext != null) {
        Scrollable.ensureVisible(
          targetKey!.currentContext!,
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeInOut,
          alignment: 0.15,
        );
        return;
      }

      if (_scrollController.hasClients && attempt < 25) {
        final maxScroll = _scrollController.position.maxScrollExtent;
        final currentOffset = _scrollController.offset;
        final estimated = (targetIndex * 150.0);
        final jumpTarget = estimated < maxScroll ? estimated : maxScroll;

        if ((jumpTarget - currentOffset).abs() > 10) {
          _scrollController.jumpTo(jumpTarget);
        } else if (currentOffset < maxScroll) {
          _scrollController.jumpTo((currentOffset + 2500).clamp(0, maxScroll));
        }

        Future.delayed(const Duration(milliseconds: 60), () {
          if (mounted) {
            _attemptScrollToVerse(verseNum, targetIndex, attempt + 1);
          }
        });
      }
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
    final theme   = context.watch<ThemeProvider>();
    final book    = nav.getBook(widget.bookId);
    final bookName = book?.nameAr ?? Verse.defaultBookNames[widget.bookId] ?? 'سفر ${widget.bookId}';
    final totalCh = book?.chapterCount ?? DatabaseService.defaultChapterCounts[widget.bookId] ?? 1;

    if (!reader.loading && reader.verses.isNotEmpty) {
      _scrollToTargetVerseIfNeeded(reader);
    }

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        leadingWidth: 36,
        title: Directionality(
          textDirection: TextDirection.rtl,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                bookName,
                key: const Key('reader_appbar_book_title'),
                style: AppTheme.arabicLabel(size: 16),
                maxLines: 1,
                softWrap: false,
              ),
              Text(
                'الإصحاح ${widget.chapterNum} من $totalCh',
                key: const Key('reader_appbar_chapter_subtitle'),
                style: TextStyle(fontSize: 10.5, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                maxLines: 1,
                softWrap: false,
              ),
            ],
          ),
        ),
        actions: [
          // Theme toggle
          Consumer<ThemeProvider>(
            builder: (ctx, theme, _) => Semantics(
              label: 'تبديل السمة',
              button: true,
              child: IconButton(
                key: const Key('reader_theme_toggle_btn'),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 28, minHeight: 36),
                icon: Icon(
                  theme.isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                  size: 18,
                ),
                onPressed: theme.toggleTheme,
                tooltip: theme.isDark ? 'الوضع النهاري' : 'الوضع الليلي',
              ),
            ),
          ),
          // Font size controls
          Semantics(
            label: 'تصغير الخط',
            button: true,
            child: IconButton(
              key: const Key('reader_font_decrease_btn'),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 26, minHeight: 36),
              icon: const Icon(Icons.text_decrease, size: 18),
              onPressed: reader.decreaseFontSize,
              tooltip: 'تصغير الخط',
            ),
          ),
          Semantics(
            label: 'تكبير الخط',
            button: true,
            child: IconButton(
              key: const Key('reader_font_increase_btn'),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 26, minHeight: 36),
              icon: const Icon(Icons.text_increase, size: 18),
              onPressed: reader.increaseFontSize,
              tooltip: 'تكبير الخط',
            ),
          ),
          // Toggle original text
          Semantics(
            label: 'النص الأصلي',
            button: true,
            child: IconButton(
              key: const Key('reader_toggle_original_btn'),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 28, minHeight: 36),
              icon: Icon(
                reader.showOriginal ? Icons.visibility : Icons.visibility_off,
                size: 18,
                color: reader.showOriginal ? AppColors.primary : AppColors.textMuted,
              ),
              onPressed: reader.toggleOriginalText,
              tooltip: 'النص الأصلي (عبري/يوناني)',
            ),
          ),
          // Search
          Semantics(
            label: 'بحث',
            button: true,
            child: IconButton(
              key: const Key('reader_search_btn'),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 28, minHeight: 36),
              icon: const Icon(Icons.search, size: 18),
              onPressed: () => context.pushNamed('search'),
              tooltip: 'بحث',
            ),
          ),
          const SizedBox(width: 4),
        ],
      ),

      body: reader.loading
          ? Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
          : reader.error.isNotEmpty
              ? _ErrorRetry(reader.error, () => reader.loadChapter(widget.bookId, widget.chapterNum))
              : reader.verses.isEmpty
                  ? Center(child: Text('لم يتم العثور على آيات', style: TextStyle(color: AppColors.textMuted)))
                  : ListView.builder(
                      controller: _scrollController,
                      cacheExtent: 100000.0,
                      padding: const EdgeInsets.fromLTRB(12, 8, 12, 100),
                      itemCount: reader.verses.length,
                      itemBuilder: (ctx, i) {
                        final v = reader.verses[i];
                        _verseKeys[v.verseNum] ??= GlobalKey();
                        final isHighlighted = v.verseNum == widget.initialVerseNum;

                        return Container(
                          key: _verseKeys[v.verseNum],
                          child: _VerseCard(
                            verse:         v,
                            fontSize:      reader.fontSize,
                            showOrig:      reader.showOriginal,
                            chapterNum:    widget.chapterNum,
                            bookName:      bookName,
                            isHighlighted: isHighlighted,
                          ),
                        );
                      },
                    ),

      // Chapter prev/next navigation bar
      bottomNavigationBar: Container(
        height: 56,
        decoration: BoxDecoration(
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
                label: const Text('السابق', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
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
              child: Directionality(
                textDirection: TextDirection.rtl,
                child: Text(
                  'الإصحاح ${widget.chapterNum} من $totalCh',
                  style: TextStyle(color: AppColors.primaryText, fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ),
            ),

            // Next
            Expanded(
              child: TextButton.icon(
                onPressed: widget.chapterNum < totalCh ? () => _navigateNext(reader, totalCh) : null,
                icon: const Icon(Icons.chevron_right, size: 20),
                label: const Text('التالي', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
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
  final String bookName;
  final bool   isHighlighted;

  const _VerseCard({
    required this.verse,
    required this.fontSize,
    required this.showOrig,
    required this.chapterNum,
    this.bookName = '',
    this.isHighlighted = false,
  });

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
          'book_id':     verse.bookId,
          'book_name':   bookName,
          'text_avd_ar': verse.textAvdAr,
          'text_original': verse.textManuscript ?? verse.textOriginal,
          'text_original_lang': verse.textOriginalLang,
        },
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: isHighlighted ? AppColors.primaryGlow.withOpacity(0.4) : AppColors.bgCard,
          border: Border.all(
            color: isHighlighted ? AppColors.primary : AppColors.border,
            width: isHighlighted ? 2.0 : 1.0,
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: isHighlighted
              ? [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.25),
                    blurRadius: 12,
                    spreadRadius: 2,
                  )
                ]
              : null,
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
                'book_id':     verse.bookId,
                'book_name':   bookName,
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
                    textDirection: TextDirection.rtl,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                        decoration: BoxDecoration(
                          color:        AppColors.primaryGlow,
                          borderRadius: BorderRadius.circular(100),
                          border:       Border.all(color: AppColors.primary.withOpacity(0.4)),
                        ),
                        child: Directionality(
                          textDirection: TextDirection.rtl,
                          child: Text(
                            bookName.isNotEmpty
                                ? '$bookName — الإصحاح $chapterNum — الآية ${verse.verseNum}'
                                : 'الإصحاح $chapterNum — الآية ${verse.verseNum}',
                            style: TextStyle(
                              color:      AppColors.primaryText,
                              fontSize:   12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                      Icon(Icons.chevron_left_rounded, color: AppColors.textMuted, size: 16),
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
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
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

                  // Action buttons row (Word Study, Compare, Cross-References)
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    textDirection: TextDirection.rtl,
                    children: [
                      // Word Study Button
                      InkWell(
                        onTap: () => context.pushNamed(
                          'word-study',
                          pathParameters: {'verseId': verse.id},
                          extra: {
                            'verse_num':  verse.verseNum,
                            'chapter_num': chapterNum,
                            'book_name':   bookName,
                            'book_id':     verse.bookId,
                            'text_avd_ar': verse.textAvdAr,
                            'text_original': verse.textManuscript ?? verse.textOriginal,
                            'text_original_lang': verse.textOriginalLang,
                          },
                        ),
                        borderRadius: BorderRadius.circular(6),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            textDirection: TextDirection.rtl,
                            children: [
                              Icon(Icons.menu_book_rounded, size: 14, color: AppColors.primary),
                              const SizedBox(width: 4),
                              Text(
                                'دراسة الكلمات',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      // Compare & Cross-References actions
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Compare translations button
                          InkWell(
                            onTap: () => VerseComparisonModal.show(context, verse),
                            borderRadius: BorderRadius.circular(6),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.bgSurface,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                textDirection: TextDirection.rtl,
                                children: [
                                  Icon(Icons.compare_arrows_rounded, size: 14, color: AppColors.primary),
                                  const SizedBox(width: 4),
                                  Text(
                                    'مقارنة الترجمات',
                                    style: TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),

                          // Cross-references button
                          InkWell(
                            onTap: () => CrossReferencesModal.show(context, verse),
                            borderRadius: BorderRadius.circular(6),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.bgSurface,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                textDirection: TextDirection.rtl,
                                children: [
                                  Icon(Icons.hub_rounded, size: 13, color: AppColors.primary),
                                  const SizedBox(width: 4),
                                  Text(
                                    'شواهد',
                                    style: TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
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
        ElevatedButton(onPressed: onRetry, child: const Text('إعادة المحاولة')),
      ],
    ),
  );
}
