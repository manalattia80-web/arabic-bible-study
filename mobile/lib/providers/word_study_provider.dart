// lib/providers/word_study_provider.dart
// Manages word mappings for a verse and audio playback state.

import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';
import '../core/services/api_service.dart';
import '../models/word_mapping.dart';
import '../models/strongs_entry.dart';
import '../models/word_occurrence.dart';

class WordStudyProvider extends ChangeNotifier {
  List<WordMapping>   _mappings  = [];
  StrongsEntry?       _selectedStrongs;
  List<WordOccurrence> _occurrences = [];
  
  bool                _loadingMappings = false;
  bool                _loadingStrongs  = false;
  bool                _loadingOccurrences = false;
  String              _mappingsError   = '';
  String?             _playingAudioUrl;

  final _player = AudioPlayer();

  List<WordMapping> get mappings        => _mappings;
  StrongsEntry?     get selectedStrongs => _selectedStrongs;
  List<WordOccurrence> get occurrences  => _occurrences;
  
  bool              get loadingMappings => _loadingMappings;
  bool              get loadingStrongs  => _loadingStrongs;
  bool              get loadingOccurrences => _loadingOccurrences;
  String            get mappingsError   => _mappingsError;
  String?           get playingAudioUrl => _playingAudioUrl;

  bool isPlaying(String url) => _playingAudioUrl == url && _player.playing;

  Future<void> loadWordMappings(String verseId) async {
    _loadingMappings = true;
    _mappingsError   = '';
    _mappings        = [];
    notifyListeners();

    try {
      _mappings = await ApiService.getWordMappings(verseId);
    } catch (e) {
      _mappingsError = e.toString();
    } finally {
      _loadingMappings = false;
      notifyListeners();
    }
  }

  Future<void> loadStrongsEntry(String strongsId) async {
    _selectedStrongs = null;
    _occurrences = [];
    _loadingStrongs  = true;
    _loadingOccurrences = true;
    notifyListeners();

    try {
      _selectedStrongs = await ApiService.getStrongsEntry(strongsId);
    } catch (_) {
      _selectedStrongs = null;
    } finally {
      _loadingStrongs = false;
      notifyListeners();
    }
    
    // Fetch occurrences independently
    try {
      _occurrences = await ApiService.getStrongsOccurrences(strongsId);
    } catch (_) {
      _occurrences = [];
    } finally {
      _loadingOccurrences = false;
      notifyListeners();
    }
  }

  Future<void> playAudio(String url) async {
    try {
      if (_playingAudioUrl == url && _player.playing) {
        await _player.stop();
        _playingAudioUrl = null;
      } else {
        await _player.stop();
        _playingAudioUrl = url;
        notifyListeners();
        await _player.setUrl(url, headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'});
        await _player.play();
        _player.playerStateStream.listen((state) {
          if (state.processingState == ProcessingState.completed) {
            _playingAudioUrl = null;
            notifyListeners();
          }
        });
      }
    } catch (_) {
      _playingAudioUrl = null;
    }
    notifyListeners();
  }

  void clearStrongs() {
    _selectedStrongs = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }
}
