import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/services/audio_playback_service.dart';

class AudioButton extends StatelessWidget {
  final String? url;
  final String? word;
  final String? lang;

  const AudioButton({
    super.key,
    this.url,
    this.word,
    this.lang,
  });

  String get _targetKey {
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
    final key = _targetKey;
    if (key.isEmpty) return const SizedBox.shrink();

    return ValueListenableBuilder<String?>(
      valueListenable: AudioPlaybackService.instance.currentlyPlayingKey,
      builder: (context, playingKey, _) {
        final isPlaying = playingKey == key;

        return ValueListenableBuilder<bool>(
          valueListenable: AudioPlaybackService.instance.isLoading,
          builder: (context, loading, _) {
            final isLoadingThis = isPlaying && loading;

            return IconButton(
              tooltip: isPlaying ? 'إيقاف النطق' : 'استماع للنطق الأصلي',
              icon: isLoadingThis
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                      ),
                    )
                  : Icon(
                      isPlaying ? Icons.stop_circle_rounded : Icons.volume_up_rounded,
                      color: isPlaying ? AppColors.accent : AppColors.primary,
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
