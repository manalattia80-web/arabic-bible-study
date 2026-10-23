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

  /// Set of cataloged authentic Strong's entries in the audio repository
  static const Set<String> catalogedStrongsIds = {
    'G18', 'G25', 'G26', 'G32', 'G40', 'G80', 'G129', 'G165', 'G191', 'G225', 'G235', 'G240', 'G243', 'G266', 'G281', 'G386', 'G435', 'G444', 'G450', 'G565', 'G575', 'G599', 'G611', 'G649', 'G749', 'G846', 'G863', 'G906', 'G907', 'G932', 'G935', 'G991', 'G1063', 'G1093', 'G1096', 'G1097', 'G1125', 'G1135', 'G1161', 'G1163', 'G1223', 'G1325', 'G1343', 'G1391', 'G1401', 'G1410', 'G1411', 'G1427', 'G1437', 'G1438', 'G1453', 'G1473', 'G1484', 'G1487', 'G1492', 'G1510', 'G1515', 'G1519', 'G1520', 'G1525', 'G1537', 'G1538', 'G1563', 'G1565', 'G1577', 'G1722', 'G1831', 'G1909', 'G2036', 'G2041', 'G2064', 'G2098', 'G2147', 'G2192', 'G2193', 'G2198', 'G2212', 'G2222', 'G2228', 'G2250', 'G2288', 'G2309', 'G2316', 'G2424', 'G2443', 'G2453', 'G2476', 'G2491', 'G2531', 'G2532', 'G2564', 'G2588', 'G2596', 'G2889', 'G2919', 'G2962', 'G2980', 'G2983', 'G2992', 'G3004', 'G3056', 'G3101', 'G3173', 'G3195', 'G3306', 'G3326', 'G3361', 'G3367', 'G3498', 'G3551', 'G3568', 'G3588', 'G3598', 'G3624', 'G3686', 'G3708', 'G3739', 'G3752', 'G3754', 'G3756', 'G3762', 'G3767', 'G3772', 'G3778', 'G3779', 'G3793', 'G3825', 'G3844', 'G3860', 'G3870', 'G3956', 'G3962', 'G3972', 'G4012', 'G4074', 'G4100', 'G4102', 'G4151', 'G4160', 'G4172', 'G4183', 'G4198', 'G4314', 'G4396', 'G4413', 'G4561', 'G4771', 'G4862', 'G4982', 'G4983', 'G4991', 'G5100', 'G5101', 'G5119', 'G5207', 'G5228', 'G5259', 'G5456', 'G5457', 'G5485', 'G5495', 'G5547', 'G5590', 'G5610', 'G5613', 'H1', 'H85', 'H120', 'H136', 'H168', 'H175', 'H216', 'H251', 'H259', 'H310', 'H369', 'H376', 'H398', 'H408', 'H410', 'H413', 'H426', 'H428', 'H430', 'H505', 'H518', 'H559', 'H589', 'H702', 'H776', 'H784', 'H802', 'H834', 'H853', 'H854', 'H859', 'H899', 'H935', 'H996', 'H1004', 'H1121', 'H1129', 'H1247', 'H1254', 'H1285', 'H1288', 'H1323', 'H1419', 'H1471', 'H1567', 'H1571', 'H1696', 'H1697', 'H1722', 'H1732', 'H1818', 'H1870', 'H1931', 'H1961', 'H1980', 'H1992', 'H2009', 'H2022', 'H2063', 'H2077', 'H2088', 'H2091', 'H2403', 'H2416', 'H2493', 'H2568', 'H2617', 'H2719', 'H2896', 'H3026', 'H3027', 'H3045', 'H3063', 'H3068', 'H3117', 'H3205', 'H3212', 'H3220', 'H3290', 'H3318', 'H3372', 'H3381', 'H3390', 'H3427', 'H3478', 'H3541', 'H3548', 'H3588', 'H3605', 'H3651', 'H3701', 'H3702', 'H3808', 'H3820', 'H3824', 'H3899', 'H3947', 'H3966', 'H3967', 'H4057', 'H4100', 'H4191', 'H4196', 'H4310', 'H4325', 'H4421', 'H4427', 'H4428', 'H4437', 'H4480', 'H4672', 'H4714', 'H4725', 'H4872', 'H4940', 'H4941', 'H5002', 'H5030', 'H5174', 'H5221', 'H5307', 'H5315', 'H5375', 'H5414', 'H5439', 'H5647', 'H5650', 'H5674', 'H5704', 'H5750', 'H5769', 'H5869', 'H5892', 'H5921', 'H5927', 'H5971', 'H5973', 'H5975', 'H6030', 'H6086', 'H6213', 'H6240', 'H6242', 'H6256', 'H6258', 'H6310', 'H6440', 'H6635', 'H6664', 'H6680', 'H6918', 'H6922', 'H6944', 'H6963', 'H6965', 'H7121', 'H7126', 'H7200', 'H7218', 'H7225', 'H7227', 'H7261', 'H7307', 'H7451', 'H7586', 'H7651', 'H7704', 'H7725', 'H7760', 'H7965', 'H7969', 'H7971', 'H8033', 'H8034', 'H8064', 'H8065', 'H8085', 'H8104', 'H8141', 'H8147', 'H8179', 'H8269', 'H8432', 'H8451', 'H8478',
  };

  /// Returns true if the Strong's ID has an authentic recording in the repository
  bool isStrongsCataloged(String? strongsId) {
    if (strongsId == null || strongsId.isEmpty) return false;
    return catalogedStrongsIds.contains(strongsId.trim().toUpperCase());
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
