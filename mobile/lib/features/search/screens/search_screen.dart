// lib/features/search/screens/search_screen.dart
// ─────────────────────────────────────────────────────────────────────────────
// Full-text search across all 31,102 verses in both Arabic and original language.
// Results show verse reference + Arabic text snippet.
// Tapping a result navigates directly to the chapter reader at that verse.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/api_service.dart';
import '../../../models/verse.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _ctrl = TextEditingController();
  final _focus = FocusNode();

  List<Verse> _results      = [];
  int         _total        = 0;
  bool        _loading      = false;
  String      _error        = '';
  String      _lastQuery    = '';
  int         _page         = 1;
  bool        _hasMore      = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focus.requestFocus());
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _focus.dispose();
    super.dispose();
  }

  Future<void> _search({bool reset = true}) async {
    final q = _ctrl.text.trim();
    if (q.isEmpty || q.length < 2) return;

    if (reset) {
      setState(() { _results = []; _page = 1; _hasMore = true; _loading = true; _error = ''; _lastQuery = q; });
    } else {
      setState(() { _loading = true; });
    }

    try {
      final res = await ApiService.searchVerses(q, page: _page, limit: 20);
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
    } catch (e) {
      setState(() { _error = e.toString(); });
    } finally {
      setState(() { _loading = false; });
    }
  }

  void _loadMore() {
    if (!_loading && _hasMore) _search(reset: false);
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
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 15),
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: 'Search in Arabic or Hebrew/Greek…',
              hintStyle: const TextStyle(color: AppColors.textMuted),
              border:  InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              filled: false,
              suffixIcon: _ctrl.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18, color: AppColors.textMuted),
                      onPressed: () { _ctrl.clear(); setState(() { _results = []; _total = 0; }); },
                    )
                  : null,
            ),
            onSubmitted: (_) => _search(),
            onChanged:   (_) => setState(() {}),
          ),
        ),
        actions: [
          TextButton(
            onPressed: _search,
            child: const Text('Search', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
          ),
        ],
      ),

      body: Column(
        children: [
          // ── Results count ──────────────────────────────────────
          if (_lastQuery.isNotEmpty && !_loading)
            Container(
              width:   double.infinity,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              decoration: const BoxDecoration(
                color: AppColors.bgSurface,
                border: Border(bottom: BorderSide(color: AppColors.border)),
              ),
              child: Text(
                _error.isNotEmpty
                    ? _error
                    : '$_total results for "$_lastQuery"',
                style: TextStyle(
                  color:    _error.isNotEmpty ? AppColors.danger : AppColors.textSecondary,
                  fontSize: 12,
                ),
              ),
            ),

          // ── Results list ───────────────────────────────────────
          Expanded(
            child: _results.isEmpty && !_loading
                ? _EmptyState(query: _lastQuery)
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
                          return const Padding(
                            padding: EdgeInsets.all(20),
                            child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)),
                          );
                        }
                        return _SearchResultCard(
                          verse:    _results[i],
                          query:    _lastQuery,
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
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
    return GestureDetector(
      onTap: () {
        context.pushNamed(
          'reader',
          pathParameters: {
            'bookId':     '${verse.bookId}',
            'chapterNum': '${verse.chapterNum}',
          },
        );
      },
      child: Container(
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
            ),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Reference
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color:        AppColors.primaryGlow,
                          borderRadius: BorderRadius.circular(100),
                          border:       Border.all(color: AppColors.primary.withOpacity(0.3)),
                        ),
                        child: Text(
                          '${verse.chapterNum}:${verse.verseNum}',
                          style: const TextStyle(
                            color:      AppColors.primaryText,
                            fontSize:   11,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'monospace',
                          ),
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
                          verse.isHebrew ? 'Hebrew' : 'Greek',
                          style: TextStyle(
                            color:    verse.isHebrew ? AppColors.hebrewText : AppColors.greekText,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
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
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Icon(Icons.chevron_right, size: 14, color: AppColors.textMuted),
                      Text('Go to chapter', style: TextStyle(color: AppColors.textMuted, fontSize: 10)),
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

// ── Highlighted text ───────────────────────────────────────────────────────
class _HighlightedText extends StatelessWidget {
  final String text;
  final String query;
  final TextStyle style;
  const _HighlightedText({required this.text, required this.query, required this.style});

  @override
  Widget build(BuildContext context) {
    if (query.isEmpty) return Text(text, style: style, maxLines: 3, overflow: TextOverflow.ellipsis);

    final lower   = text.toLowerCase();
    final qLower  = query.toLowerCase();
    final spans   = <TextSpan>[];
    int   start   = 0;

    int match = lower.indexOf(qLower, start);
    while (match != -1) {
      if (match > start) spans.add(TextSpan(text: text.substring(start, match)));
      spans.add(TextSpan(
        text: text.substring(match, match + query.length),
        style: TextStyle(
          backgroundColor: AppColors.primary.withOpacity(0.3),
          color:           AppColors.primaryText,
          fontWeight:      FontWeight.w700,
        ),
      ));
      start = match + query.length;
      match = lower.indexOf(qLower, start);
    }
    if (start < text.length) spans.add(TextSpan(text: text.substring(start)));

    return RichText(
      text:      TextSpan(style: style, children: spans),
      maxLines:  3,
      overflow:  TextOverflow.ellipsis,
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
                ? 'Search the Bible'
                : 'No results for "$query"',
            style: const TextStyle(
              color:      AppColors.textSecondary,
              fontSize:   16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            query.isEmpty
                ? 'Type Arabic text, Hebrew, or Greek words to search all 31,102 verses'
                : 'Try different words or check spelling',
            style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ),
  );
}
