// lib/core/services/audio_playback_service.dart
// ─────────────────────────────────────────────────────────────────────────────
// Robust, Cached Audio Playback Service for Hebrew & Greek Pronunciations.
// Downloads audio via HTTP client with full desktop headers into local cache,
// then plays directly off disk using local file paths.
// Eliminates ExoPlayer 403 Forbidden errors and provides offline playback for
// previously played words.
// ─────────────────────────────────────────────────────────────────────────────

import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:just_audio/just_audio.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

class AudioPlaybackService {
  AudioPlaybackService._() {
    _init();
  }
  static final AudioPlaybackService instance = AudioPlaybackService._();

  final AudioPlayer _player = AudioPlayer();
  final ValueNotifier<String?> currentlyPlayingKey = ValueNotifier<String?>(null);
  final ValueNotifier<bool> isLoading = ValueNotifier<bool>(false);

  void _init() {
    _player.playerStateStream.listen((state) {
      if (state.processingState == ProcessingState.completed) {
        currentlyPlayingKey.value = null;
        isLoading.value = false;
      }
    });
  }

  bool isPlaying(String key) => currentlyPlayingKey.value == key;

  Future<void> stop() async {
    try {
      await _player.stop();
    } catch (_) {}
    currentlyPlayingKey.value = null;
    isLoading.value = false;
  }

  /// Cleans pointed/unpointed original Hebrew or Greek words
  String cleanOriginalWord(String word) {
    return word
        .replaceAll(RegExp(r'[\.,;:!?׃־—–\[\]\(\)\{\}\x22\x27״׳·]'), '')
        .trim();
  }

  /// Checks if language is Aramaic (currently suspended pending scholarly review)
  bool isAramaic(String lang) => lang.toLowerCase().trim() == 'aramaic';

  /// Resolves standard Google TTS language code (iw for Hebrew, el for Greek)
  String resolveLangCode(String lang) {
    final l = lang.toLowerCase().trim();
    if (l == 'hebrew' || l == 'he' || l == 'iw') {
      return 'iw';
    }
    return 'el';
  }

  /// Base URL for verified human-recorded Strong's audio files (Erasmian Greek, Masoretic Hebrew, Biblical Aramaic)
  static const String trustedAudioBaseUrl =
      'https://raw.githubusercontent.com/manalattia80-web/arabic-bible-study/main/audio_repository/strongs';

  /// Plays trusted audio for a given Strong's ID, prioritizing authentic human recordings.
  /// 1. Checks local cache for `strongs_${cleanId}.mp3`.
  /// 2. If not found locally, attempts to fetch from the authentic Strong's audio repository.
  /// 3. If not yet in the authentic repository:
  ///    - For Aramaic: halts cleanly without playing modern Hebrew TTS.
  ///    - For Greek/Hebrew: falls back to approximate automated pronunciation if word is provided.
  Future<bool> playStrongs({
    required String strongsId,
    required String language,
    String? word,
    String? fallbackUrl,
  }) async {
    final cleanId = strongsId.trim().toUpperCase();
    if (cleanId.isEmpty || cleanId == '---' || cleanId == '-' || cleanId.startsWith('NEG-') || cleanId.startsWith('PREP-') || cleanId.startsWith('CONJ-') || cleanId.startsWith('PRON-')) {
      if (word != null && word.isNotEmpty) {
        return await playWord(word: word, lang: language);
      }
      return false;
    }

    final bool aramaic = isAramaic(language);
    final cacheKey = 'strongs_$cleanId';

    // Toggle pause/stop if already playing this Strong's audio
    if (currentlyPlayingKey.value == cacheKey) {
      await stop();
      return true;
    }

    await stop();
    isLoading.value = true;
    currentlyPlayingKey.value = cacheKey;

    try {
      final cacheDir = await _getCacheDir();
      final localFile = File(p.join(cacheDir.path, '$cacheKey.mp3'));

      // 1. Play from local cache if file exists and has valid audio data
      if (await localFile.exists() && (await localFile.length()) > 200) {
        isLoading.value = false;
        await _player.setFilePath(localFile.path);
        await _player.play();
        return true;
      }

      // 2. Fetch authentic Strong's audio from repository
      final trustedUrl = '$trustedAudioBaseUrl/$cleanId.mp3';
      try {
        final res = await http.get(Uri.parse(trustedUrl), headers: const {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'audio/mpeg, audio/*; q=0.9, */*; q=0.1',
        }).timeout(const Duration(seconds: 4));

        if (res.statusCode == 200 && res.bodyBytes.length > 200) {
          await localFile.writeAsBytes(res.bodyBytes, flush: true);
          isLoading.value = false;
          await _player.setFilePath(localFile.path);
          await _player.play();
          return true;
        }
      } catch (e) {
        debugPrint('Trusted audio fetch attempt for $cleanId: $e');
      }

      // 3. Fallback behavior
      if (aramaic) {
        debugPrint('Authentic audio for Aramaic $cleanId not yet in repository. Fallback to Hebrew TTS is suspended.');
        await stop();
        return false;
      }

      // Fallback to approximate pronunciation for Greek or Hebrew
      if (word != null && word.trim().isNotEmpty && word != '-' && word != '---') {
        return await playWord(word: word, lang: language);
      } else if (fallbackUrl != null && fallbackUrl.isNotEmpty) {
        return await playUrl(fallbackUrl);
      }

      await stop();
      return false;
    } catch (e) {
      debugPrint('AudioPlaybackService playStrongs error: $e');
      await stop();
      return false;
    }
  }

  /// Plays audio for a given word and language.
  /// Checks local disk cache first. If not cached, downloads audio bytes,
  /// saves to file, and plays via setFilePath.
  Future<bool> playWord({
    required String word,
    required String lang,
  }) async {
    final cleanWord = cleanOriginalWord(word);
    if (cleanWord.isEmpty || cleanWord == '-' || cleanWord == '—' || cleanWord.contains('---')) {
      return false;
    }

    if (isAramaic(lang)) {
      debugPrint('Aramaic audio playback is suspended pending scholarly review: $cleanWord');
      return false;
    }

    final langCode = resolveLangCode(lang);
    final cacheKey = '${langCode}_$cleanWord';

    // If already playing this word, toggle pause/stop
    if (currentlyPlayingKey.value == cacheKey) {
      await stop();
      return true;
    }

    await stop();
    isLoading.value = true;
    currentlyPlayingKey.value = cacheKey;

    try {
      final cacheDir = await _getCacheDir();
      final safeFileName = '${base64Url.encode(utf8.encode(cacheKey)).replaceAll('=', '')}.mp3';
      final localFile = File(p.join(cacheDir.path, safeFileName));

      // 1. Play from local cache if file exists and has valid audio data
      if (await localFile.exists() && (await localFile.length()) > 200) {
        isLoading.value = false;
        await _player.setFilePath(localFile.path);
        await _player.play();
        return true;
      }

      // 2. Not cached: fetch audio bytes via HTTP client
      final endpoints = [
        'https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${Uri.encodeComponent(cleanWord)}&tl=$langCode&client=gtx',
        'https://translate.google.com/translate_tts?ie=UTF-8&q=${Uri.encodeComponent(cleanWord)}&tl=$langCode&client=tw-ob',
      ];

      final headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': 'https://translate.google.com/',
      };

      Uint8List? audioBytes;
      for (final endpoint in endpoints) {
        try {
          final res = await http.get(Uri.parse(endpoint), headers: headers).timeout(const Duration(seconds: 5));
          if (res.statusCode == 200 && res.bodyBytes.length > 200) {
            audioBytes = res.bodyBytes;
            break;
          }
        } catch (_) {}
      }

      if (audioBytes != null && audioBytes.isNotEmpty) {
        await localFile.writeAsBytes(audioBytes, flush: true);
        isLoading.value = false;
        await _player.setFilePath(localFile.path);
        await _player.play();
        return true;
      } else {
        // Failed to download audio
        debugPrint('Failed to download TTS audio for: $cleanWord ($langCode)');
        await stop();
        return false;
      }
    } catch (e) {
      debugPrint('AudioPlaybackService error: $e');
      await stop();
      return false;
    }
  }

  /// Plays audio from an existing URL or parses query parameters
  Future<bool> playUrl(String url) async {
    try {
      final uri = Uri.parse(url);
      final word = uri.queryParameters['q'];
      final lang = uri.queryParameters['tl'] ?? 'iw';

      if (word != null && word.isNotEmpty) {
        return await playWord(word: word, lang: lang);
      }

      // Direct fallback if not a Google TTS URL
      await stop();
      currentlyPlayingKey.value = url;
      isLoading.value = false;
      await _player.setUrl(
        url,
        headers: const {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
      );
      await _player.play();
      return true;
    } catch (e) {
      debugPrint('Direct audio URL playback failed: $e');
      await stop();
      return false;
    }
  }

  Future<Directory> _getCacheDir() async {
    final temp = await getTemporaryDirectory();
    final d = Directory(p.join(temp.path, 'audio_cache'));
    if (!await d.exists()) {
      await d.create(recursive: true);
    }
    return d;
  }

  void dispose() {
    _player.dispose();
    currentlyPlayingKey.dispose();
    isLoading.dispose();
  }
}
