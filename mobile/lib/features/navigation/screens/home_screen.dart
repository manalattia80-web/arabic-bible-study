// lib/features/navigation/screens/home_screen.dart
// ─────────────────────────────────────────────────────────────────────────────
// Landing screen: two large cards for Old and New Testament.
// Arabic title, gold gradient header, search FAB.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/navigation_provider.dart';
import '../../../models/testament.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NavigationProvider>().loadTestaments();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // ── Gradient App Bar ──────────────────────────────────
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AppColors.bgSurface,
            actions: [
              IconButton(
                onPressed: () => context.pushNamed('search'),
                icon: const Icon(Icons.search_rounded),
                tooltip: 'Search',
              ),
              const SizedBox(width: 8),
            ],
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.parallax,
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end:   Alignment.bottomRight,
                    colors: [Color(0xFFF8FAFC), Color(0xFFE2E8F0), Color(0xFFCBD5E1)],
                  ),
                ),
                child: Stack(
                  children: [
                    // Subtle grid pattern
                    Positioned.fill(
                      child: CustomPaint(painter: _GridPainter()),
                    ),
                    // Glow
                    Center(
                      child: Container(
                        width: 300, height: 300,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(colors: [
                            AppColors.primary.withOpacity(0.08),
                            Colors.transparent,
                          ]),
                        ),
                      ),
                    ),
                    // Title
                    SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 24),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            // Arabic title
                            Directionality(
                              textDirection: TextDirection.rtl,
                              child: Text(
                                'البحث الكتابي العربي',
                                style: AppTheme.arabicLabel(size: 26),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Arabic Van Dyck Bible Study',
                              style: TextStyle(
                                color:    AppColors.textSecondary,
                                fontSize: 13,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── Testament Cards ───────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: Consumer<NavigationProvider>(
              builder: (ctx, nav, _) {
                if (nav.loading) {
                  return const SliverToBoxAdapter(child: _LoadingCenter());
                }
                if (nav.error.isNotEmpty) {
                  return SliverToBoxAdapter(child: _ErrorWidget(nav.error, onRetry: nav.loadTestaments));
                }
                if (nav.testaments.isEmpty) {
                  return const SliverToBoxAdapter(child: _LoadingCenter());
                }
                return SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _TestamentCard(testament: nav.testaments[i]),
                    ),
                    childCount: nav.testaments.length,
                  ),
                );
              },
            ),
          ),

          // ── Footer ────────────────────────────────────────────
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 40),
              child: _InfoCard(),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Testament Card ─────────────────────────────────────────────────────────
class _TestamentCard extends StatelessWidget {
  final Testament testament;
  const _TestamentCard({required this.testament});

  @override
  Widget build(BuildContext context) {
    final isOT = testament.isOldTestament;
    final accent = isOT ? AppColors.hebrewText : AppColors.greekText;
    final icon   = isOT ? '📜' : '✝';

    return GestureDetector(
      onTap: () => context.pushNamed('books', pathParameters: {'testamentId': '${testament.id}'}),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color:        AppColors.bgCard,
          border:       Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color:      Colors.black.withOpacity(0.3),
              blurRadius: 12, offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => context.pushNamed('books', pathParameters: {'testamentId': '${testament.id}'}),
            splashColor: AppColors.primaryGlow,
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  // Icon + accent bar
                  Container(
                    width: 56, height: 56,
                    decoration: BoxDecoration(
                      color:        accent.withOpacity(0.12),
                      border:       Border.all(color: accent.withOpacity(0.3)),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Center(child: Text(icon, style: const TextStyle(fontSize: 26))),
                  ),
                  const SizedBox(width: 20),

                  // Text
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Directionality(
                          textDirection: TextDirection.rtl,
                          child: Text(
                            testament.nameAr,
                            style: AppTheme.arabicLabel(size: 20),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          testament.nameEn,
                          style: const TextStyle(
                            color:    AppColors.textSecondary,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            _pill(isOT ? 'Hebrew' : 'Greek', accent),
                            const SizedBox(width: 8),
                            _pill(isOT ? '39 Books' : '27 Books', AppColors.textMuted),
                          ],
                        ),
                      ],
                    ),
                  ),

                  Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _pill(String text, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color:        color.withOpacity(0.1),
      borderRadius: BorderRadius.circular(100),
      border:       Border.all(color: color.withOpacity(0.25)),
    ),
    child: Text(text, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
  );
}

// ── Info Card ─────────────────────────────────────────────────────────────
class _InfoCard extends StatelessWidget {
  const _InfoCard();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primaryGlow,
        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Text('💡', style: TextStyle(fontSize: 18)),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Tap any verse to open Word Study', style: TextStyle(color: AppColors.primaryText, fontSize: 13, fontWeight: FontWeight.w600)),
                SizedBox(height: 2),
                Text('See Arabic ↔ Hebrew/Greek word-by-word alignment with Strong\'s definitions', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Shared helpers ─────────────────────────────────────────────────────────
class _LoadingCenter extends StatelessWidget {
  const _LoadingCenter();
  @override
  Widget build(BuildContext context) => const Center(
    child: Padding(
      padding: EdgeInsets.all(48),
      child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2),
    ),
  );
}

class _ErrorWidget extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorWidget(this.message, {required this.onRetry});
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          const Text('⚠', style: TextStyle(fontSize: 40)),
          const SizedBox(height: 12),
          Text(message, style: const TextStyle(color: AppColors.textSecondary), textAlign: TextAlign.center),
          const SizedBox(height: 16),
          ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    ),
  );
}

// ── Grid Background Painter ────────────────────────────────────────────────
class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color  = AppColors.primary.withOpacity(0.04)
      ..strokeWidth = 1;
    const step = 48.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }
  @override
  bool shouldRepaint(_) => false;
}
