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
    'G11', 'G18', 'G25', 'G26', 'G27', 'G32', 'G40', 'G71', 'G80', 'G129', 'G142', 'G154', 'G165', 'G166', 'G190', 'G191', 'G225', 'G235', 'G240', 'G243', 'G264', 'G266', 'G268', 'G281', 'G305', 'G386', 'G435', 'G444', 'G450', 'G455', 'G518', 'G565', 'G575', 'G599', 'G611', 'G615', 'G622', 'G630', 'G649', 'G652', 'G740', 'G746', 'G749', 'G756', 'G770', 'G782', 'G846', 'G863', 'G906', 'G907', 'G932', 'G935', 'G991', 'G1056', 'G1063', 'G1074', 'G1080', 'G1093', 'G1096', 'G1097', 'G1100', 'G1122', 'G1124', 'G1125', 'G1135', 'G1138', 'G1140', 'G1161', 'G1163', 'G1188', 'G1209', 'G1210', 'G1223', 'G1320', 'G1321', 'G1325', 'G1330', 'G1342', 'G1343', 'G1344', 'G1352', 'G1377', 'G1380', 'G1391', 'G1392', 'G1401', 'G1410', 'G1411', 'G1417', 'G1427', 'G1437', 'G1438', 'G1453', 'G1473', 'G1484', 'G1487', 'G1492', 'G1510', 'G1515', 'G1519', 'G1520', 'G1525', 'G1535', 'G1537', 'G1538', 'G1543', 'G1544', 'G1563', 'G1565', 'G1577', 'G1680', 'G1715', 'G1722', 'G1785', 'G1799', 'G1831', 'G1849', 'G1854', 'G1860', 'G1905', 'G1909', 'G2033', 'G2036', 'G2038', 'G2041', 'G2046', 'G2064', 'G2065', 'G2068', 'G2078', 'G2087', 'G2089', 'G2090', 'G2094', 'G2097', 'G2098', 'G2112', 'G2147', 'G2192', 'G2193', 'G2198', 'G2212', 'G2222', 'G2228', 'G2249', 'G2250', 'G2281', 'G2288', 'G2296', 'G2307', 'G2309', 'G2316', 'G2323', 'G2334', 'G2347', 'G2362', 'G2411', 'G2414', 'G2419', 'G2424', 'G2440', 'G2443', 'G2453', 'G2474', 'G2476', 'G2491', 'G2504', 'G2521', 'G2531', 'G2532', 'G2540', 'G2556', 'G2564', 'G2588', 'G2590', 'G2596', 'G2597', 'G2730', 'G2776', 'G2784', 'G2889', 'G2896', 'G2902', 'G2919', 'G2920', 'G2962', 'G2980', 'G2983', 'G2992', 'G3004', 'G3037', 'G3056', 'G3062', 'G3101', 'G3107', 'G3123', 'G3137', 'G3140', 'G3173', 'G3195', 'G3306', 'G3319', 'G3326', 'G3361', 'G3366', 'G3367', 'G3384', 'G3398', 'G3419', 'G3440', 'G3441', 'G3475', 'G3485', 'G3498', 'G3551', 'G3568', 'G3571', 'G3588', 'G3598', 'G3614', 'G3624', 'G3641', 'G3650', 'G3686', 'G3699', 'G3704', 'G3708', 'G3735', 'G3739', 'G3745', 'G3748', 'G3752', 'G3753', 'G3754', 'G3756', 'G3759', 'G3761', 'G3762', 'G3767', 'G3772', 'G3778', 'G3779', 'G3788', 'G3793', 'G3813', 'G3825', 'G3844', 'G3860', 'G3870', 'G3956', 'G3962', 'G3972', 'G3982', 'G3992', 'G4012', 'G4043', 'G4074', 'G4091', 'G4095', 'G4098', 'G4100', 'G4102', 'G4103', 'G4137', 'G4143', 'G4151', 'G4159', 'G4160', 'G4172', 'G4183', 'G4190', 'G4198', 'G4228', 'G4245', 'G4253', 'G4314', 'G4334', 'G4335', 'G4336', 'G4352', 'G4374', 'G4383', 'G4396', 'G4412', 'G4413', 'G4442', 'G4459', 'G4487', 'G4521', 'G4561', 'G4592', 'G4613', 'G4678', 'G4687', 'G4717', 'G4750', 'G4771', 'G4862', 'G4863', 'G4864', 'G4982', 'G4983', 'G4991', 'G5043', 'G5064', 'G5083', 'G5087', 'G5100', 'G5101', 'G5108', 'G5117', 'G5119', 'G5140', 'G5154', 'G5185', 'G5204', 'G5207', 'G5217', 'G5228', 'G5259', 'G5315', 'G5319', 'G5330', 'G5342', 'G5399', 'G5401', 'G5438', 'G5456', 'G5457', 'G5463', 'G5479', 'G5485', 'G5495', 'G5547', 'G5550', 'G5590', 'G5602', 'G5610', 'G5613', 'G5620', 'H1', 'H68', 'H85', 'H120', 'H127', 'H136', 'H157', 'H168', 'H175', 'H176', 'H216', 'H227', 'H241', 'H251', 'H259', 'H310', 'H312', 'H341', 'H352', 'H369', 'H376', 'H389', 'H398', 'H408', 'H410', 'H413', 'H426', 'H428', 'H430', 'H505', 'H517', 'H518', 'H520', 'H559', 'H561', 'H571', 'H582', 'H587', 'H589', 'H595', 'H622', 'H639', 'H669', 'H702', 'H705', 'H727', 'H758', 'H776', 'H784', 'H802', 'H804', 'H834', 'H853', 'H854', 'H859', 'H894', 'H899', 'H905', 'H929', 'H935', 'H977', 'H982', 'H995', 'H996', 'H1004', 'H1008', 'H1058', 'H1060', 'H1121', 'H1129', 'H1144', 'H1167', 'H1241', 'H1242', 'H1245', 'H1247', 'H1254', 'H1285', 'H1288', 'H1320', 'H1323', 'H1366', 'H1368', 'H1419', 'H1431', 'H1471', 'H1540', 'H1567', 'H1568', 'H1571', 'H1696', 'H1697', 'H1722', 'H1732', 'H1755', 'H1818', 'H1847', 'H1870', 'H1875', 'H1931', 'H1934', 'H1961', 'H1980', 'H1984', 'H1992', 'H2005', 'H2009', 'H2022', 'H2026', 'H2063', 'H2076', 'H2077', 'H2088', 'H2091', 'H2142', 'H2205', 'H2233', 'H2320', 'H2346', 'H2351', 'H2388', 'H2398', 'H2403', 'H2416', 'H2421', 'H2428', 'H2450', 'H2451', 'H2490', 'H2493', 'H2534', 'H2568', 'H2572', 'H2583', 'H2617', 'H2677', 'H2691', 'H2708', 'H2719', 'H2896', 'H2931', 'H3026', 'H3027', 'H3045', 'H3050', 'H3063', 'H3068', 'H3083', 'H3091', 'H3097', 'H3117', 'H3130', 'H3162', 'H3196', 'H3201', 'H3205', 'H3212', 'H3220', 'H3225', 'H3254', 'H3290', 'H3318', 'H3327', 'H3372', 'H3381', 'H3383', 'H3390', 'H3414', 'H3423', 'H3427', 'H3467', 'H3477', 'H3478', 'H3513', 'H3519', 'H3532', 'H3541', 'H3548', 'H3559', 'H3581', 'H3588', 'H3605', 'H3615', 'H3627', 'H3651', 'H3678', 'H3680', 'H3701', 'H3702', 'H3772', 'H3789', 'H3808', 'H3820', 'H3824', 'H3845', 'H3881', 'H3898', 'H3899', 'H3915', 'H3947', 'H3966', 'H3967', 'H4057', 'H4100', 'H4124', 'H4150', 'H4191', 'H4194', 'H4196', 'H4264', 'H4294', 'H4310', 'H4325', 'H4390', 'H4397', 'H4399', 'H4421', 'H4427', 'H4428', 'H4437', 'H4467', 'H4480', 'H4503', 'H4519', 'H4557', 'H4592', 'H4616', 'H4639', 'H4672', 'H4687', 'H4714', 'H4725', 'H4872', 'H4908', 'H4940', 'H4941', 'H5002', 'H5030', 'H5046', 'H5048', 'H5060', 'H5066', 'H5104', 'H5127', 'H5158', 'H5159', 'H5174', 'H5178', 'H5186', 'H5221', 'H5265', 'H5288', 'H5307', 'H5315', 'H5337', 'H5375', 'H5387', 'H5414', 'H5437', 'H5439', 'H5483', 'H5493', 'H5608', 'H5612', 'H5647', 'H5650', 'H5656', 'H5674', 'H5703', 'H5704', 'H5712', 'H5750', 'H5769', 'H5771', 'H5800', 'H5869', 'H5892', 'H5921', 'H5927', 'H5930', 'H5971', 'H5973', 'H5975', 'H5983', 'H6030', 'H6086', 'H6106', 'H6153', 'H6213', 'H6235', 'H6240', 'H6242', 'H6256', 'H6258', 'H6310', 'H6430', 'H6440', 'H6485', 'H6499', 'H6529', 'H6547', 'H6605', 'H6607', 'H6629', 'H6635', 'H6662', 'H6664', 'H6666', 'H6680', 'H6726', 'H6828', 'H6862', 'H6912', 'H6918', 'H6922', 'H6942', 'H6944', 'H6951', 'H6963', 'H6965', 'H7097', 'H7121', 'H7126', 'H7130', 'H7200', 'H7218', 'H7223', 'H7225', 'H7227', 'H7230', 'H7235', 'H7261', 'H7272', 'H7307', 'H7311', 'H7393', 'H7451', 'H7453', 'H7462', 'H7563', 'H7586', 'H7592', 'H7604', 'H7626', 'H7650', 'H7651', 'H7665', 'H7704', 'H7725', 'H7760', 'H7812', 'H7843', 'H7901', 'H7965', 'H7969', 'H7970', 'H7971', 'H7993', 'H8010', 'H8033', 'H8034', 'H8050', 'H8055', 'H8064', 'H8065', 'H8081', 'H8085', 'H8104', 'H8121', 'H8130', 'H8141', 'H8145', 'H8147', 'H8179', 'H8193', 'H8199', 'H8255', 'H8269', 'H8313', 'H8337', 'H8354', 'H8432', 'H8441', 'H8451', 'H8478',
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
