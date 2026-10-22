// lib/providers/word_study_provider.dart
// Manages word mappings for a verse and audio playback state.

import 'package:flutter/foundation.dart';
import '../core/services/api_service.dart';
import '../core/services/audio_playback_service.dart';
import '../core/services/database_service.dart';
import '../models/word_mapping.dart';
import '../models/strongs_entry.dart';
import '../models/word_occurrence.dart';

class WordStudyProvider extends ChangeNotifier {
  List<WordMapping>   _mappings  = [];
  StrongsEntry?       _selectedStrongs;
  List<WordOccurrence> _occurrences = [];
  List<Map<String, dynamic>> _bookDistribution = [];
  
  bool                _loadingMappings = false;
  bool                _loadingStrongs  = false;
  bool                _loadingOccurrences = false;
  String              _mappingsError   = '';

  WordStudyProvider() {
    AudioPlaybackService.instance.currentlyPlayingKey.addListener(_onAudioStateChanged);
  }

  void _onAudioStateChanged() {
    notifyListeners();
  }

  List<WordMapping> get mappings        => _mappings;
  StrongsEntry?     get selectedStrongs => _selectedStrongs;
  List<WordOccurrence> get occurrences  => _occurrences;
  List<Map<String, dynamic>> get bookDistribution => _bookDistribution;
  
  bool              get loadingMappings => _loadingMappings;
  bool              get loadingStrongs  => _loadingStrongs;
  bool              get loadingOccurrences => _loadingOccurrences;
  String            get mappingsError   => _mappingsError;

  bool isPlaying(String url) {
    try {
      final uri = Uri.parse(url);
      final q = uri.queryParameters['q'];
      final tl = uri.queryParameters['tl'] ?? 'iw';
      if (q != null && q.isNotEmpty) {
        final clean = AudioPlaybackService.instance.cleanOriginalWord(q);
        return AudioPlaybackService.instance.currentlyPlayingKey.value == '${tl}_$clean';
      }
    } catch (_) {}
    return AudioPlaybackService.instance.currentlyPlayingKey.value == url;
  }

  Future<void> loadWordMappings(String verseId) async {
    _loadingMappings = true;
    _mappingsError   = '';
    notifyListeners();

    try {
      _mappings = await ApiService.getWordMappings(verseId);
      if (_mappings.isEmpty) {
        debugPrint('Remote mappings empty for $verseId, trying local sqlite fallback...');
        _mappings = await DatabaseService.instance.getWordMappings(verseId);
      }
    } catch (e) {
      debugPrint('Error loading word mappings from API ($e), trying local fallback...');
      try {
        _mappings = await DatabaseService.instance.getWordMappings(verseId);
      } catch (localErr) {
        _mappingsError = 'فشل في تحميل الكلمات: $localErr';
      }
    } finally {
      _loadingMappings = false;
      notifyListeners();
    }
  }

  Future<void> loadStrongsEntry(String strongsId, {WordMapping? mapping}) async {
    await selectStrongs(strongsId, fallbackMapping: mapping);
  }

  Future<void> selectStrongs(String strongsId, {WordMapping? fallbackMapping}) async {
    _loadingStrongs = true;
    notifyListeners();

    try {
      // 1. Try local database first (instant offline response)
      _selectedStrongs = await DatabaseService.instance.getStrongsEntry(strongsId);
      
      // 2. If not found in local db, try backend API
      if (_selectedStrongs == null) {
        _selectedStrongs = await ApiService.getStrongsEntry(strongsId);
      }
    } catch (e) {
      debugPrint('Error loading Strongs entry: $e');
    } finally {
      _loadingStrongs = false;
      notifyListeners();
    }

    if (strongsId.isNotEmpty && strongsId != '---') {
      _loadingOccurrences = true;
      notifyListeners();
      try {
        _occurrences = await DatabaseService.instance.getStrongsOccurrences(strongsId);
        _bookDistribution = await DatabaseService.instance.getStrongsBookDistribution(strongsId);
      } catch (e) {
        debugPrint('Error loading occurrences: $e');
      } finally {
        _loadingOccurrences = false;
        notifyListeners();
      }
    } else {
      _occurrences = [];
      _bookDistribution = [];
      _loadingOccurrences = false;
      notifyListeners();
    }
  }

  Future<void> playAudio(String url) async {
    await AudioPlaybackService.instance.playUrl(url);
  }

  void clearStrongs() {
    _selectedStrongs = null;
    notifyListeners();
  }

  @override
  void dispose() {
    AudioPlaybackService.instance.currentlyPlayingKey.removeListener(_onAudioStateChanged);
    super.dispose();
  }
}
