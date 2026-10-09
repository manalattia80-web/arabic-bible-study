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
import '../../../providers/theme_provider.dart';
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
            expandedHeight: 220,
            pinned: true,
            backgroundColor: AppColors.bgSurface,
            actions: [
              Consumer<ThemeProvider>(
                builder: (ctx, theme, _) => IconButton(
                  onPressed: theme.toggleTheme,
                  icon: Icon(theme.isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded),
                  tooltip: theme.isDark ? 'الوضع النهاري' : 'الوضع الليلي',
                ),
              ),
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
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end:   Alignment.bottomRight,
                    colors: AppColors.isDark
                        ? const [Color(0xFF080E1A), Color(0xFF0F1724), Color(0xFF161E2E)]
                        : const [Color(0xFFF8FAFC), Color(0xFFE2E8F0), Color(0xFFCBD5E1)],
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
                    // Title in 3 centered lines
                    SafeArea(
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            // السطر الأول: دليل الكتاب المقدس (بخط كبير)
                            Directionality(
                              textDirection: TextDirection.rtl,
                              child: Text(
                                'دليل الكتاب المقدس',
                                textAlign: TextAlign.center,
                                style: AppTheme.arabicLabel(size: 26).copyWith(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                            const SizedBox(height: 6),
                            // السطر الثاني: عبري / عربي (بخط ذهبي أصغر)
                            Directionality(
                              textDirection: TextDirection.rtl,
                              child: Text(
                                'عبري / عربي',
                                textAlign: TextAlign.center,
                                style: AppTheme.arabicLabel(size: 16).copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            const SizedBox(height: 4),
                            // السطر الثالث: يوناني / عربي (مثل السطر السابق)
                            Directionality(
                              textDirection: TextDirection.rtl,
                              child: Text(
                                'يوناني / عربي',
                                textAlign: TextAlign.center,
                                style: AppTheme.arabicLabel(size: 16).copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w700,
                                ),
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
              child: Directionality(
                textDirection: TextDirection.rtl,
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
                          Text(
                            testament.nameAr,
                            style: AppTheme.arabicLabel(size: 20),
                          ),
                          const SizedBox(height: 4),
                          Directionality(
                            textDirection: TextDirection.ltr,
                            child: Text(
                              testament.nameEn,
                              style: TextStyle(
                                color:    AppColors.textSecondary,
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              _pill(isOT ? 'عبري' : 'يوناني', accent),
                              const SizedBox(width: 8),
                              _pill(isOT ? '39 سفر' : '27 سفر', AppColors.textMuted),
                            ],
                          ),
                        ],
                      ),
                    ),

                    Icon(Icons.chevron_left_rounded, color: AppColors.textMuted),
                  ],
                ),
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
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('💡', style: TextStyle(fontSize: 20)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'إرشادات وتنبيهات هامة',
                    style: TextStyle(
                      color: AppColors.primaryText,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '• دراسة الكلمات والنص الأصلي: تعرض شاشة القراءة النص الكتابي الأصلي الكامل لكل آية (العبري المشكول للعهد القديم، واليوناني للعهد الجديد) بالتوازي مع ترجمة الفانديك. وعند الضغط على أي آية يُعرض تحليل دقيق يربط كل لفظة بجذرها المعجمي والشرح اللاهوتي في قاموس سترونج.\n\n'
                    '• استخدام النطق الصوتي: استكشف الكلمات الأصلية ومعانيها من قاموس سترونج، بالإضافة إلى إمكانية الاستماع للنطق الصوتي لكل كلمة (باللهجات العبرية واليونانية الحديثة).\n\n'
                    '• العمل بدون إنترنت (أوفلاين): يعمل التطبيق بكامل وظائفه لقراءة كافة الأسفار والآيات الـ 31,102 آية، والبحث الشامل، وتصفح قاموس سترونج بالكامل بدون الحاجة لأي اتصال بالإنترنت، بينما يتطلب الاستماع للنطق الصوتي للكلمات فقط وجود اتصال بالإنترنت.',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                      height: 1.6,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Shared helpers ─────────────────────────────────────────────────────────
class _LoadingCenter extends StatelessWidget {
  const _LoadingCenter();
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(48),
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
          Text(message, style: TextStyle(color: AppColors.textSecondary), textAlign: TextAlign.center),
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
