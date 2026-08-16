// lib/features/navigation/screens/book_list_screen.dart
// List of all books in a testament, grouped by category.

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/navigation_provider.dart';
import '../../../models/book.dart';

// Book category groupings (by book ID range)
const _otGroups = {
  'التوراة · Law':       [1, 2, 3, 4, 5],
  'التاريخ · History':   [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  'الشعر · Poetry':      [18, 19, 20, 21, 22],
  'الأنبياء الكبار · Major Prophets': [23, 24, 25, 26, 27],
  'الأنبياء الصغار · Minor Prophets': [28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
};
const _ntGroups = {
  'الأناجيل · Gospels':   [40, 41, 42, 43],
  'الأعمال · Acts':       [44],
  'رسائل بولس · Paul':    [45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58],
  'الرسائل العامة · General': [59, 60, 61, 62, 63, 64, 65],
  'الرؤيا · Revelation':  [66],
};

class BookListScreen extends StatefulWidget {
  final int testamentId;
  const BookListScreen({super.key, required this.testamentId});

  @override
  State<BookListScreen> createState() => _BookListScreenState();
}

class _BookListScreenState extends State<BookListScreen> {
  String _filter = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NavigationProvider>().loadBooks(widget.testamentId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final nav         = context.watch<NavigationProvider>();
    final testament   = nav.getTestament(widget.testamentId);
    final groups      = widget.testamentId == 1 ? _otGroups : _ntGroups;
    final filteredBooks = _filter.isEmpty
        ? nav.books
        : nav.books.where((b) =>
            b.nameAr.contains(_filter) ||
            b.nameEn.toLowerCase().contains(_filter.toLowerCase())).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(testament?.nameAr ?? 'Books'),
        subtitle: Text(testament?.nameEn ?? '', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
      ),
      body: Column(
        children: [
          // Search
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              onChanged: (v) => setState(() => _filter = v),
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Search books… ابحث عن كتاب',
                prefixIcon: const Icon(Icons.search, color: AppColors.textMuted, size: 20),
                suffixIcon: _filter.isNotEmpty
                    ? IconButton(icon: const Icon(Icons.clear, size: 18, color: AppColors.textMuted), onPressed: () => setState(() => _filter = ''))
                    : null,
              ),
            ),
          ),

          Expanded(
            child: nav.loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                : nav.error.isNotEmpty
                    ? Center(child: Text(nav.error, style: const TextStyle(color: AppColors.danger)))
                    : _filter.isNotEmpty
                        ? _BookGrid(books: filteredBooks)
                        : _GroupedBookList(groups: groups, books: nav.books),
          ),
        ],
      ),
    );
  }
}

// ── Grouped List View (default) ────────────────────────────────────────────
class _GroupedBookList extends StatelessWidget {
  final Map<String, List<int>> groups;
  final List<Book> books;
  const _GroupedBookList({required this.groups, required this.books});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
      itemCount: groups.length,
      itemBuilder: (ctx, i) {
        final groupName = groups.keys.elementAt(i);
        final ids       = groups.values.elementAt(i);
        final groupBooks = books.where((b) => ids.contains(b.id)).toList();
        if (groupBooks.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(0, 16, 0, 8),
              child: Text(
                groupName,
                style: const TextStyle(
                  color:    AppColors.primary,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                ),
              ),
            ),
            _BookGrid(books: groupBooks),
          ],
        );
      },
    );
  }
}

// ── Book Grid ──────────────────────────────────────────────────────────────
class _BookGrid extends StatelessWidget {
  final List<Book> books;
  const _BookGrid({required this.books});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap:   true,
      physics:      const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount:   3,
        crossAxisSpacing: 10,
        mainAxisSpacing:  10,
        childAspectRatio: 0.85,
      ),
      itemCount: books.length,
      itemBuilder: (ctx, i) => _BookCard(book: books[i]),
    );
  }
}

class _BookCard extends StatelessWidget {
  final Book book;
  const _BookCard({required this.book});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.pushNamed('chapters', pathParameters: {'bookId': '${book.id}'}),
      child: Container(
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
            onTap: () => context.pushNamed('chapters', pathParameters: {'bookId': '${book.id}'}),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Arabic name (large, RTL)
                  Directionality(
                    textDirection: TextDirection.rtl,
                    child: Text(
                      book.nameArShort,
                      style: AppTheme.arabicLabel(size: 15),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    book.nameEnShort,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color:        AppColors.bgSurface,
                      borderRadius: BorderRadius.circular(100),
                      border:       Border.all(color: AppColors.border),
                    ),
                    child: Text(
                      '${book.chapterCount} ch',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
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
