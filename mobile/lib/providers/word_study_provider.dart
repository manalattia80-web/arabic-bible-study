// lib/providers/word_study_provider.dart
// Manages word mappings for a verse and audio playback state.

import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';
import '../core/services/api_service.dart';
import '../models/word_mapping.dart';
import '../models/strongs_entry.dart';

class WordStudyProvider extends ChangeNotifier {
  List<WordMapping>   _mappings  = [];
  StrongsEntry?       _selectedStrongs;
  bool                _loadingMappings = false;
  bool                _loadingStrongs  = false;
  String              _mappingsError   = '';
  String?             _playingAudioUrl;

  final _player = AudioPlayer();

  List<WordMapping> get mappings        => _mappings;
  StrongsEntry?     get selectedStrongs => _selectedStrongs;
  bool              get loadingMappings => _loadingMappings;
  bool              get loadingStrongs  => _loadingStrongs;
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
    _loadingStrongs  = true;
    notifyListeners();

    try {
      _selectedStrongs = await ApiService.getStrongsEntry(strongsId);
    } catch (_) {
      _selectedStrongs = null;
    } finally {
      _loadingStrongs = false;
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
        await _player.setUrl(url);
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
