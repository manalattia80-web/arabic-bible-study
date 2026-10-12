// lib/features/reader/widgets/cross_references_modal.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/verse.dart';

class CrossReferencesModal extends StatefulWidget {
  final Verse verse;

  const CrossReferencesModal({super.key, required this.verse});

  static Future<void> show(BuildContext context, Verse verse) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CrossReferencesModal(verse: verse),
    );
  }

  @override
  State<CrossReferencesModal> createState() => _CrossReferencesModalState();
}

class _CrossReferencesModalState extends State<CrossReferencesModal> {
  bool _loading = true;
  List<Map<String, dynamic>> _crossRefs = [];

  @override
  void initState() {
    super.initState();
    _loadReferences();
  }

  Future<void> _loadReferences() async {
    try {
      final refs = await ApiService.getCrossReferences(
        widget.verse.bookId,
        widget.verse.chapterNum,
        widget.verse.verseNum,
      );
      if (mounted) {
        setState(() {
          _crossRefs = refs;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _crossRefs = [];
          _loading = false;
        });
      }
    }
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
                        child: Icon(Icons.hub_rounded, color: AppColors.primary, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            textDirection: TextDirection.rtl,
                            children: [
                              const Text(
                                'الشواهد المرجعية المتقاطعة',
                                style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              if (!_loading) ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryGlow,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    '${_crossRefs.length}',
                                    style: TextStyle(
                                      color: AppColors.primaryText,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          Text(
                            widget.verse.reference,
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
                ],
              ),
            ),

            const Divider(height: 1, color: AppColors.border),

            // Content
            Expanded(
              child: _loading
                  ? Center(
                      child: CircularProgressIndicator(
                        color: AppColors.primary,
                        strokeWidth: 2,
                      ),
                    )
                  : _crossRefs.isEmpty
                      ? const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: Text(
                              'لا توجد شواهد متقاطعة مسجلة لهذه الآية حالياً',
                              style: TextStyle(color: AppColors.textMuted, fontSize: 14),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        )
                      : ListView.separated(
                          controller: scrollCtrl,
                          padding: const EdgeInsets.all(16),
                          itemCount: _crossRefs.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (ctx, i) {
                            final ref = _crossRefs[i];
                            final targetBookName = ref['target_book_name'] as String? ?? 'سفر';
                            final targetCh = ref['target_chapter_num'] as int? ?? 1;
                            final targetV = ref['target_verse_num'] as int? ?? 1;
                            final targetBookId = ref['target_book_id'] as int? ?? 1;
                            final targetText = ref['target_text'] as String? ?? '';
                            final refLabel = '$targetBookName $targetCh: $targetV';

                            return Container(
                              decoration: BoxDecoration(
                                color: AppColors.bgSurface,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(12),
                                  onTap: () {
                                    Navigator.of(context).pop();
                                    context.pushReplacementNamed('reader', pathParameters: {
                                      'bookId': '$targetBookId',
                                      'chapterNum': '$targetCh',
                                    }, queryParameters: {
                                      'verseNum': '$targetV',
                                    });
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.stretch,
                                      children: [
                                        // Reference badge + Navigate icon
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          textDirection: TextDirection.rtl,
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: AppColors.primaryGlow,
                                                borderRadius: BorderRadius.circular(8),
                                                border: Border.all(color: AppColors.primary.withOpacity(0.4)),
                                              ),
                                              child: Text(
                                                refLabel,
                                                style: TextStyle(
                                                  color: AppColors.primaryText,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 12,
                                                ),
                                              ),
                                            ),
                                            Row(
                                              children: [
                                                IconButton(
                                                  icon: const Icon(Icons.copy_rounded, size: 16),
                                                  color: AppColors.textMuted,
                                                  padding: EdgeInsets.zero,
                                                  constraints: const BoxConstraints(),
                                                  onPressed: () {
                                                    Clipboard.setData(ClipboardData(text: '$refLabel\n$targetText'));
                                                    ScaffoldMessenger.of(context).showSnackBar(
                                                      SnackBar(
                                                        content: Text('تم نسخ $refLabel', textAlign: TextAlign.center),
                                                        duration: const Duration(seconds: 1),
                                                      ),
                                                    );
                                                  },
                                                ),
                                                const SizedBox(width: 8),
                                                const Icon(
                                                  Icons.arrow_forward_ios_rounded,
                                                  size: 14,
                                                  color: AppColors.primary,
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),

                                        if (targetText.isNotEmpty) ...[
                                          const SizedBox(height: 8),
                                          Directionality(
                                            textDirection: TextDirection.rtl,
                                            child: Text(
                                              targetText,
                                              style: AppTheme.arabicVerse(size: 16, color: AppColors.textPrimary),
                                              textAlign: TextAlign.justify,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ),
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
