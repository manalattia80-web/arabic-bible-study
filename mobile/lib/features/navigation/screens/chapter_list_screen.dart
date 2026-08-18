// lib/features/navigation/screens/chapter_list_screen.dart
// Grid of chapter numbers for a selected book.

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/navigation_provider.dart';

class ChapterListScreen extends StatefulWidget {
  final int bookId;
  const ChapterListScreen({super.key, required this.bookId});

  @override
  State<ChapterListScreen> createState() => _ChapterListScreenState();
}

class _ChapterListScreenState extends State<ChapterListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NavigationProvider>().loadChapters(widget.bookId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final nav  = context.watch<NavigationProvider>();
    final book = nav.getBook(widget.bookId);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            book != null
                ? Directionality(
                    textDirection: TextDirection.rtl,
                    child: Text(book.nameAr, style: AppTheme.arabicLabel(size: 18)),
                  )
                : const Text('Chapters'),
            if (book != null)
              Text(book.nameEn, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          ],
        ),
      ),
      body: nav.loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
          : nav.error.isNotEmpty
              ? Center(child: Text(nav.error, style: const TextStyle(color: AppColors.danger)))
              : Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color:        AppColors.bgSurface,
                          borderRadius: BorderRadius.circular(10),
                          border:       Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.menu_book_rounded, color: AppColors.primary, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              '${nav.chapters.length} chapter${nav.chapters.length != 1 ? 's' : ''}',
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                            ),
                            const Spacer(),
                            Text(
                              'Tap a chapter to read',
                              style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                      ),

                      // Chapter grid
                      Expanded(
                        child: GridView.builder(
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount:   5,
                            crossAxisSpacing: 10,
                            mainAxisSpacing:  10,
                            childAspectRatio: 1,
                          ),
                          itemCount: nav.chapters.length,
                          itemBuilder: (ctx, i) {
                            final chapter = nav.chapters[i];
                            return _ChapterButton(
                              number: chapter,
                              onTap: () => context.pushNamed(
                                'reader',
                                pathParameters: {
                                  'bookId':     '${widget.bookId}',
                                  'chapterNum': '$chapter',
                                },
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }
}

class _ChapterButton extends StatelessWidget {
  final int number;
  final VoidCallback onTap;
  const _ChapterButton({required this.number, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color:        AppColors.bgCard,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap:        onTap,
        borderRadius: BorderRadius.circular(10),
        splashColor:  AppColors.primaryGlow,
        child: Container(
          decoration: BoxDecoration(
            border:       Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(10),
          ),
          alignment: Alignment.center,
          child: Text(
            '$number',
            style: const TextStyle(
              color:      AppColors.textPrimary,
              fontSize:   18,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}
