// lib/features/search/screens/search_screen.dart
// ─────────────────────────────────────────────────────────────────────────────
// Advanced Search:
// 1. Direct Strong's lexical code matching (e.g. H4428, G2880, ح4428, ي2880).
// 2. Full-text search across 31,102 verses (Diacritics & normalization insensitive).
// 3. Testament and Book-level filtering (filter by specific book or testament).
// 4. Persistent Search History with quick-tap chips and clear action.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/database_service.dart';
import '../../../core/services/search_history_service.dart';
import '../../../models/verse.dart';
import '../../../models/book.dart';
import '../../../models/strongs_entry.dart';
import '../../word_study/widgets/strongs_modal.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _ctrl = TextEditingController();
  final _focus = FocusNode();

  List<Verse>       _results             = [];
  int               _total               = 0;
  bool              _loading             = false;
  String            _error               = '';
  String            _lastQuery           = '';
  int               _page                = 1;
  bool              _hasMore             = true;
  int?              _selectedTestamentId; // null: All, 1: OT, 2: NT
  Book?             _selectedBook;
  List<Book>        _allBooks            = [];
  StrongsEntry?     _matchedStrongs;
  List<String>      _searchHistory       = [];

  @override
  void initState() {
    super.initState();
    _loadInitialData();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focus.requestFocus());
  }

  Future<void> _loadInitialData() async {
    try {
      final books = await DatabaseService.instance.getBooks();
      final history = await SearchHistoryService.getRecentQueries();
      if (mounted) {
        setState(() {
          _allBooks = books;
          _searchHistory = history;
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _focus.dispose();
    super.dispose();
  }

  // Detects if query is a Strong's number like H4428, G2880, or Arabic equivalents (ح4428, ي2880)
  static String? _detectStrongsId(String input) {
    final clean = input.trim().toUpperCase()
        .replaceAll(' ', '')
        .replaceAll('ح', 'H')
        .replaceAll('ي', 'G')
        .replaceAll('هـ', 'H')
        .replaceAll('ه', 'H');
    final match = RegExp(r'^([HG])\s*0*([1-9][0-9]{0,4})$').firstMatch(clean);
    if (match != null) {
      final prefix = match.group(1)!;
      final num = match.group(2)!;
      return '$prefix$num';
    }
    return null;
  }

  Future<void> _search({bool reset = true, String? explicitQuery}) async {
    final q = (explicitQuery ?? _ctrl.text).trim();
    if (q.isEmpty) return;

    if (explicitQuery != null) {
      _ctrl.text = explicitQuery;
    }

    if (reset) {
      setState(() {
        _results = [];
        _page = 1;
        _hasMore = true;
        _loading = true;
        _error = '';
        _lastQuery = q;
        _matchedStrongs = null;
      });
      // Save query to history
      await SearchHistoryService.addQuery(q);
      _searchHistory = await SearchHistoryService.getRecentQueries();
    } else {
      setState(() { _loading = true; });
    }

    // Check for direct Strong's number lookup
    final detectedStrongs = _detectStrongsId(q);
    if (detectedStrongs != null && reset) {
      try {
        final entry = await ApiService.getStrongsEntry(detectedStrongs);
        if (mounted) {
          setState(() {
            _matchedStrongs = entry;
          });
        }
      } catch (_) {}
    }

    try {
      final res = await ApiService.searchVerses(
        q,
        testamentId: _selectedBook != null ? null : _selectedTestamentId,
        bookId: _selectedBook?.id,
        page: _page,
        limit: 20,
      );

      if (mounted) {
        setState(() {
          if (reset) {
            _results = res.verses;
          } else {
            _results = [..._results, ...res.verses];
          }
          _total   = res.total;
          _hasMore = res.verses.length >= 20;
          _page    = _page + 1;
          _error   = '';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() { _error = e.toString(); });
      }
    } finally {
      if (mounted) {
        setState(() { _loading = false; });
      }
    }
  }

  void _loadMore() {
    if (!_loading && _hasMore) _search(reset: false);
  }

  void _openBookPicker() {
    final filteredBooks = _selectedTestamentId == null
        ? _allBooks
        : _allBooks.where((b) => b.testamentId == _selectedTestamentId).toList();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.4,
        expand: false,
        builder: (ctx, scroll) => Directionality(
          textDirection: TextDirection.rtl,
          child: Column(
            children: [
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'اختر السفر للبحث فيه',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (_selectedBook != null)
                      TextButton(
                        onPressed: () {
                          Navigator.pop(ctx);
                          setState(() { _selectedBook = null; });
                          if (_ctrl.text.trim().isNotEmpty) _search(reset: true);
                        },
                        child: Text('إلغاء التحديد', style: TextStyle(color: AppColors.danger, fontSize: 13)),
                      ),
                  ],
                ),
              ),
              Divider(height: 1, color: AppColors.border),
              Expanded(
                child: ListView.builder(
                  controller: scroll,
                  itemCount: filteredBooks.length,
                  itemBuilder: (ctx, i) {
                    final b = filteredBooks[i];
                    final isSel = _selectedBook?.id == b.id;
                    return ListTile(
                      dense: true,
                      title: Text(
                        b.nameAr,
                        style: TextStyle(
                          color: isSel ? AppColors.primary : AppColors.textPrimary,
                          fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                          fontSize: 14,
                        ),
                      ),
                      subtitle: Text(
                        '${b.testamentId == 1 ? "العهد القديم" : "العهد الجديد"} • ${b.chapterCount} أصحاح',
                        style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                      ),
                      trailing: isSel ? Icon(Icons.check_circle, color: AppColors.primary, size: 20) : null,
                      onTap: () {
                        Navigator.pop(ctx);
                        setState(() {
                          _selectedBook = b;
                        });
                        if (_ctrl.text.trim().isNotEmpty) {
                          _search(reset: true);
                        }
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Padding(
          padding: const EdgeInsets.only(right: 12),
          child: TextField(
            controller:  _ctrl,
            focusNode:   _focus,
            style: TextStyle(color: AppColors.textPrimary, fontSize: 15),
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: 'ابحث عن آية، كلمة، أو رقم سترونج (مثال: H4428)...',
              hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 13),
              border:  InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              filled: false,
              suffixIcon: _ctrl.text.isNotEmpty
                  ? IconButton(
                      icon: Icon(Icons.clear, size: 18, color: AppColors.textMuted),
                      onPressed: () {
                        _ctrl.clear();
                        setState(() {
                          _results = [];
                          _total = 0;
                          _lastQuery = '';
                          _matchedStrongs = null;
                        });
                      },
                    )
                  : null,
            ),
            onSubmitted: (_) => _search(),
            onChanged:   (_) => setState(() {}),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => _search(),
            child: Text('بحث', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
          ),
        ],
      ),

      body: Column(
        children: [
          // ── Filter Controls (Testaments & Book Selection) ────────
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.bgSurface,
              border: Border(bottom: BorderSide(color: AppColors.border)),
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              reverse: true, // Right-to-left layout
              child: Row(
                children: [
                  _filterChip(label: 'الكل', testamentId: null),
                  const SizedBox(width: 6),
                  _filterChip(label: 'العهد القديم', testamentId: 1),
                  const SizedBox(width: 6),
                  _filterChip(label: 'العهد الجديد', testamentId: 2),
                  const SizedBox(width: 8),
                  Container(height: 20, width: 1, color: AppColors.border),
                  const SizedBox(width: 8),
                  // Book Selector Chip
                  InkWell(
                    borderRadius: BorderRadius.circular(100),
                    onTap: _openBookPicker,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: _selectedBook != null ? AppColors.primaryGlow : AppColors.bgCard,
                        borderRadius: BorderRadius.circular(100),
                        border: Border.all(
                          color: _selectedBook != null ? AppColors.primary : AppColors.border,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.auto_stories_outlined,
                            size: 14,
                            color: _selectedBook != null ? AppColors.primaryText : AppColors.textSecondary,
                          ),
                          const SizedBox(width: 5),
                          Text(
                            _selectedBook != null ? _selectedBook!.nameAr : 'تحديد سفر',
                            style: TextStyle(
                              color: _selectedBook != null ? AppColors.primaryText : AppColors.textSecondary,
                              fontSize: 12,
                              fontWeight: _selectedBook != null ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                          if (_selectedBook != null) ...[
                            const SizedBox(width: 4),
                            GestureDetector(
                              onTap: () {
                                setState(() { _selectedBook = null; });
                                if (_ctrl.text.trim().isNotEmpty) _search(reset: true);
                              },
                              child: Icon(Icons.close, size: 14, color: AppColors.primaryText),
                            ),
                          ] else ...[
                            const SizedBox(width: 2),
                            Icon(Icons.arrow_drop_down, size: 16, color: AppColors.textMuted),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Direct Strong's Matched Card ───────────────────────
          if (_matchedStrongs != null)
            _DirectStrongsCard(
              entry: _matchedStrongs!,
              onTap: () => StrongsModal.show(context, _matchedStrongs!.strongsId),
            ),

          // ── Results count ──────────────────────────────────────
          if (_lastQuery.isNotEmpty && !_loading)
            Container(
              width:   double.infinity,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              decoration: BoxDecoration(
                color: AppColors.bgCard,
                border: Border(bottom: BorderSide(color: AppColors.border)),
              ),
              child: Text(
                _error.isNotEmpty
                    ? _error
                    : 'وجدنا $_total نتيجة لـ "$_lastQuery"${_selectedBook != null ? " في ${_selectedBook!.nameAr}" : ""}',
                style: TextStyle(
                  color:    _error.isNotEmpty ? AppColors.danger : AppColors.textSecondary,
                  fontSize: 12,
                ),
                textAlign: TextAlign.right,
              ),
            ),

          // ── Results list / Search History ───────────────────────
          Expanded(
            child: _results.isEmpty && !_loading
                ? (_ctrl.text.isEmpty && _searchHistory.isNotEmpty
                    ? _SearchHistoryView(
                        history: _searchHistory,
                        onSelect: (item) => _search(reset: true, explicitQuery: item),
                        onDelete: (item) async {
                          await SearchHistoryService.removeQuery(item);
                          final h = await SearchHistoryService.getRecentQueries();
                          setState(() { _searchHistory = h; });
                        },
                        onClearAll: () async {
                          await SearchHistoryService.clearHistory();
                          setState(() { _searchHistory = []; });
                        },
                      )
                    : _EmptyState(query: _lastQuery))
                : NotificationListener<ScrollNotification>(
                    onNotification: (n) {
                      if (n.metrics.pixels >= n.metrics.maxScrollExtent - 200) {
                        _loadMore();
                      }
                      return false;
                    },
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(12, 8, 12, 40),
                      itemCount: _results.length + (_loading || _hasMore && _results.isNotEmpty ? 1 : 0),
                      itemBuilder: (ctx, i) {
                        if (i >= _results.length) {
                          return Padding(
                            padding: const EdgeInsets.all(20),
                            child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)),
                          );
                        }
                        return _SearchResultCard(
                          verse: _results[i],
                          query: _lastQuery,
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip({required String label, required int? testamentId}) {
    final selected = _selectedTestamentId == testamentId;
    return InkWell(
      borderRadius: BorderRadius.circular(100),
      onTap: () {
        if (_selectedTestamentId != testamentId) {
          setState(() {
            _selectedTestamentId = testamentId;
            // If the selected book belongs to another testament, reset it
            if (_selectedBook != null && testamentId != null && _selectedBook!.testamentId != testamentId) {
              _selectedBook = null;
            }
          });
          if (_ctrl.text.trim().isNotEmpty) {
            _search(reset: true);
          }
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : AppColors.bgCard,
          borderRadius: BorderRadius.circular(100),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : AppColors.textSecondary,
            fontSize: 12,
            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

// ── Direct Strong's Matched Card ───────────────────────────────────────────
class _DirectStrongsCard extends StatelessWidget {
  final StrongsEntry entry;
  final VoidCallback onTap;

  const _DirectStrongsCard({required this.entry, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isHeb = entry.language == 'hebrew' || entry.language == 'aramaic';
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 10, 12, 4),
      decoration: BoxDecoration(
        color: AppColors.bgSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withOpacity(0.5), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.08),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          entry.strongsId,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        isHeb ? 'معجم العهد القديم (عبري)' : 'معجم العهد الجديد (يوناني)',
                        style: TextStyle(
                          color: isHeb ? AppColors.hebrewText : AppColors.greekText,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Text('عرض المعجم بالكامل', style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.bold)),
                      Icon(Icons.chevron_right, size: 16, color: AppColors.primary),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Directionality(
                textDirection: TextDirection.rtl,
                child: Row(
                  children: [
                    Text(
                      entry.originalWord,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                        fontFamily: isHeb ? 'HebrewFont' : 'GreekFont',
                      ),
                    ),
                    if (entry.pronunciationAr != null && entry.pronunciationAr!.isNotEmpty) ...[
                      const SizedBox(width: 8),
                      Text(
                        '(${entry.pronunciationAr})',
                        style: TextStyle(color: AppColors.primaryText, fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ],
                ),
              ),
              if (entry.definitionAr != null && entry.definitionAr!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  entry.definitionAr!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  textDirection: TextDirection.rtl,
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ── Search History View ────────────────────────────────────────────────────
class _SearchHistoryView extends StatelessWidget {
  final List<String> history;
  final ValueChanged<String> onSelect;
  final ValueChanged<String> onDelete;
  final VoidCallback onClearAll;

  const _SearchHistoryView({
    required this.history,
    required this.onSelect,
    required this.onDelete,
    required this.onClearAll,
  });

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.history, size: 16, color: AppColors.textMuted),
                  const SizedBox(width: 6),
                  Text(
                    'عمليات البحث الأخيرة',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              TextButton(
                onPressed: onClearAll,
                child: Text('مسح الكل', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: history.map((item) {
              return InputChip(
                backgroundColor: AppColors.bgCard,
                elevation: 0,
                side: BorderSide(color: AppColors.border),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                label: Text(
                  item,
                  style: TextStyle(color: AppColors.textPrimary, fontSize: 13),
                ),
                deleteIcon: Icon(Icons.close, size: 14, color: AppColors.textMuted),
                onDeleted: () => onDelete(item),
                onPressed: () => onSelect(item),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          // Suggested quick searches
          Row(
            children: [
              Icon(Icons.lightbulb_outline, size: 16, color: AppColors.primary),
              const SizedBox(width: 6),
              Text(
                'اقتراحات للدراسة',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _SuggestionChip(label: 'مَلِك (H4428)', onSelected: () => onSelect('H4428')),
              _SuggestionChip(label: 'المحبة (G26)', onSelected: () => onSelect('G26')),
              _SuggestionChip(label: 'يسوع المسيح', onSelected: () => onSelect('يسوع المسيح')),
              _SuggestionChip(label: 'النعمة والسلام', onSelected: () => onSelect('النعمة والسلام')),
              _SuggestionChip(label: 'الرَّبُّ رَاعِيَّ', onSelected: () => onSelect('الرب راعي')),
            ],
          ),
        ],
      ),
    );
  }
}

class _SuggestionChip extends StatelessWidget {
  final String label;
  final VoidCallback onSelected;

  const _SuggestionChip({required this.label, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      backgroundColor: AppColors.primaryGlow,
      side: BorderSide(color: AppColors.primary.withOpacity(0.3)),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
      label: Text(
        label,
        style: TextStyle(color: AppColors.primaryText, fontSize: 12, fontWeight: FontWeight.w600),
      ),
      onPressed: onSelected,
    );
  }
}

// ── Search Result Card ─────────────────────────────────────────────────────
class _SearchResultCard extends StatelessWidget {
  final Verse  verse;
  final String query;
  const _SearchResultCard({required this.verse, required this.query});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
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
            'reader',
            pathParameters: {
              'bookId':     '${verse.bookId}',
              'chapterNum': '${verse.chapterNum}',
            },
            queryParameters: {
              'verseNum': '${verse.verseNum}',
            },
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Reference
                Directionality(
                  textDirection: TextDirection.rtl,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color:        AppColors.primaryGlow,
                          borderRadius: BorderRadius.circular(100),
                          border:       Border.all(color: AppColors.primary.withOpacity(0.3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          textDirection: TextDirection.rtl,
                          children: [
                            Text(
                              verse.displayBookName,
                              style: TextStyle(
                                color:      AppColors.primaryText,
                                fontSize:   12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              '${verse.chapterNum}:${verse.verseNum}',
                              style: TextStyle(
                                color:      AppColors.primaryText,
                                fontSize:   12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color:        AppColors.bgSurface,
                          borderRadius: BorderRadius.circular(100),
                          border:       Border.all(color: AppColors.border),
                        ),
                        child: Text(
                          verse.isHebrew ? 'العبرية' : 'اليونانية',
                          style: TextStyle(
                            color:    verse.isHebrew ? AppColors.hebrewText : AppColors.greekText,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // Arabic text (highlighted query match)
                Directionality(
                  textDirection: TextDirection.rtl,
                  child: _HighlightedText(
                    text:  verse.textAvdAr,
                    query: query,
                    style: AppTheme.arabicVerse(size: 16),
                  ),
                ),

                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Icon(Icons.chevron_right, size: 14, color: AppColors.textMuted),
                    Text('الانتقال للأصحاح', style: TextStyle(color: AppColors.textMuted, fontSize: 10)),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Highlighted text (Diacritics-Insensitive) ──────────────────────────────
class _HighlightedText extends StatelessWidget {
  final String text;
  final String query;
  final TextStyle style;
  const _HighlightedText({required this.text, required this.query, required this.style});

  static RegExp? _buildDiacriticsRegex(String q) {
    // If it's a Strong's code, we don't highlight in verse text unless words match
    if (RegExp(r'^[HhGg]\d+$').hasMatch(q.trim())) return null;

    final clean = q.replaceAll(RegExp(r'[\u064B-\u065F\u0670\u0640]'), '').trim();
    if (clean.isEmpty) return null;

    final words = clean.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
    if (words.isEmpty) return null;

    String wordPattern(String w) {
      final buf = StringBuffer();
      for (int i = 0; i < w.length; i++) {
        final c = w[i];
        if (RegExp(r'[أإآا]').hasMatch(c)) {
          buf.write(r'[أإآا][\u064B-\u065F\u0670\u0640]*');
        } else if (RegExp(r'[ةه]').hasMatch(c)) {
          buf.write(r'[ةه][\u064B-\u065F\u0670\u0640]*');
        } else if (RegExp(r'[ىي]').hasMatch(c)) {
          buf.write(r'[ىي][\u064B-\u065F\u0670\u0640]*');
        } else {
          buf.write('${RegExp.escape(c)}[\\u064B-\\u065F\\u0670\\u0640]*');
        }
      }
      return buf.toString();
    }

    final pattern = words.map(wordPattern).join('|');
    return RegExp(pattern, caseSensitive: false);
  }

  @override
  Widget build(BuildContext context) {
    if (query.trim().isEmpty) {
      return Text(text, style: style, maxLines: 3, overflow: TextOverflow.ellipsis);
    }

    final reg = _buildDiacriticsRegex(query);
    if (reg == null) {
      return Text(text, style: style, maxLines: 3, overflow: TextOverflow.ellipsis);
    }

    final spans = <TextSpan>[];
    int lastEnd = 0;

    for (final match in reg.allMatches(text)) {
      if (match.start > lastEnd) {
        spans.add(TextSpan(text: text.substring(lastEnd, match.start)));
      }
      spans.add(TextSpan(
        text: text.substring(match.start, match.end),
        style: TextStyle(
          backgroundColor: AppColors.primary.withOpacity(0.35),
          color:           AppColors.primaryText,
          fontWeight:      FontWeight.w800,
        ),
      ));
      lastEnd = match.end;
    }

    if (lastEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastEnd)));
    }

    return RichText(
      text:          TextSpan(style: style, children: spans),
      maxLines:      3,
      overflow:      TextOverflow.ellipsis,
      textDirection: TextDirection.rtl,
    );
  }
}

// ── Empty / Initial State ─────────────────────────────────────────────────
class _EmptyState extends StatelessWidget {
  final String query;
  const _EmptyState({required this.query});

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            query.isEmpty ? '🔍' : '😔',
            style: const TextStyle(fontSize: 48),
          ),
          const SizedBox(height: 16),
          Text(
            query.isEmpty
                ? 'ابحث في الكتاب المقدس'
                : 'لا توجد نتائج لـ "$query"',
            style: TextStyle(
              color:      AppColors.textSecondary,
              fontSize:   16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            query.isEmpty
                ? 'اكتب أي كلمة، عبارة، أو رقم سترونج للبحث في جميع آيات الكتاب المقدس'
                : 'جرب كلمات أخرى أو تأكد من صحة الحروف',
            style: TextStyle(color: AppColors.textMuted, fontSize: 13),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ),
  );
}
