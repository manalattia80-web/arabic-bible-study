import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/services/audio_playback_service.dart';

class AudioButton extends StatelessWidget {
  final String? strongsId;
  final String? url;
  final String? word;
  final String? lang;
  final String? tooltip;

  const AudioButton({
    super.key,
    this.strongsId,
    this.url,
    this.word,
    this.lang,
    this.tooltip,
  });

  bool get _isAramaic => AudioPlaybackService.instance.isAramaic(lang ?? '');

  String get _targetKey {
    if (strongsId != null && strongsId!.isNotEmpty && strongsId != '---' && strongsId != '-') {
      return 'strongs_${strongsId!.trim().toUpperCase()}';
    }
    if (word != null && word!.isNotEmpty) {
      final code = AudioPlaybackService.instance.resolveLangCode(lang ?? 'hebrew');
      final clean = AudioPlaybackService.instance.cleanOriginalWord(word!);
      return '${code}_$clean';
    }
    if (url != null && url!.isNotEmpty) {
      try {
        final uri = Uri.parse(url!);
        final q = uri.queryParameters['q'];
        final tl = uri.queryParameters['tl'] ?? 'iw';
        if (q != null && q.isNotEmpty) {
          final clean = AudioPlaybackService.instance.cleanOriginalWord(q);
          return '${tl}_$clean';
        }
      } catch (_) {}
      return url!;
    }
    return '';
  }

  Future<void> _handleTap(BuildContext context) async {
    // 1. If Strong's ID is available, prioritize trusted Strong's audio
    if (strongsId != null && strongsId!.isNotEmpty && strongsId != '---' && strongsId != '-') {
      final success = await AudioPlaybackService.instance.playStrongs(
        strongsId: strongsId!,
        language: lang ?? 'hebrew',
        word: word,
        fallbackUrl: url,
      );

      if (!success && context.mounted) {
        if (_isAramaic) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('النطق الصوتي للآرامية معلّق حالياً لحين استكمال حزمة التسجيلات الآرامية الأصيلة.'),
              duration: Duration(seconds: 3),
              behavior: SnackBarBehavior.floating,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تعذر تشغيل النطق الصوتي. يرجى التحقق من الاتصال بالإنترنت.'),
              duration: Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
      return;
    }

    // 2. Direct fallback for non-Strongs items
    if (_isAramaic) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('النطق الصوتي للآرامية معلّق حالياً لحين مراجعة واعتماد مصدر صوتي آرامي أصيل.'),
            duration: Duration(seconds: 3),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      return;
    }

    final key = _targetKey;
    if (key.isEmpty) return;

    bool success = false;
    if (word != null && word!.isNotEmpty) {
      success = await AudioPlaybackService.instance.playWord(
        word: word!,
        lang: lang ?? 'hebrew',
      );
    } else if (url != null && url!.isNotEmpty) {
      success = await AudioPlaybackService.instance.playUrl(url!);
    }

    if (!success && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تعذر تشغيل النطق الصوتي. يرجى التحقق من الاتصال بالإنترنت.'),
          duration: Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isAuthenticAramaic = AudioPlaybackService.instance.isAuthenticAramaic(strongsId);

    // 1. Aramaic: only active if verified authentic human recording
    if (_isAramaic && !isAuthenticAramaic) {
      return IconButton(
        tooltip: tooltip ?? 'النطق الآرامي غير متاح حاليًا (معلّق قيد المراجعة)',
        icon: Icon(
          Icons.volume_off_rounded,
          color: AppColors.textMuted,
          size: 24,
        ),
        onPressed: () => _handleTap(context),
      );
    }

    final key = _targetKey;
    if (key.isEmpty) return const SizedBox.shrink();

    // 2. Color: Green ONLY for authentic human Aramaic; primary/slate for automated TTS
    final Color normalColor = (_isAramaic && isAuthenticAramaic)
        ? const Color(0xFF4ADE80)
        : AppColors.primary;

    return ValueListenableBuilder<String?>(
      valueListenable: AudioPlaybackService.instance.currentlyPlayingKey,
      builder: (context, playingKey, _) {
        final isPlaying = playingKey == key;

        return ValueListenableBuilder<bool>(
          valueListenable: AudioPlaybackService.instance.isLoading,
          builder: (context, loading, _) {
            final isLoadingThis = isPlaying && loading;

            final String defaultTooltip;
            if (_isAramaic && isAuthenticAramaic) {
              defaultTooltip = 'استماع: تسجيل آرامي بشري معتمد ($strongsId)';
            } else {
              defaultTooltip = 'استماع: نطق آلي تقريبي للمدخل المعجمي ($strongsId)';
            }

            return IconButton(
              tooltip: isPlaying ? 'إيقاف النطق' : (tooltip ?? defaultTooltip),
              icon: isLoadingThis
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(normalColor),
                      ),
                    )
                  : Icon(
                      isPlaying ? Icons.stop_circle_rounded : Icons.volume_up_rounded,
                      color: isPlaying ? AppColors.info : normalColor,
                      size: 26,
                    ),
              onPressed: () => _handleTap(context),
            );
          },
        );
      },
    );
  }
}
