import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import '../../../core/constants/app_colors.dart';

class AudioButton extends StatefulWidget {
  final String url;
  const AudioButton({super.key, required this.url});

  @override
  State<AudioButton> createState() => _AudioButtonState();
}

class _AudioButtonState extends State<AudioButton> {
  late AudioPlayer _player;
  bool _isPlaying = false;
  bool _isError = false;
  String _errorMsg = '';

  @override
  void initState() {
    super.initState();
    _player = AudioPlayer();
    _initAudio();
  }

  Future<void> _initAudio() async {
    try {
      await _player.setUrl(widget.url);
      _player.playerStateStream.listen((state) {
        if (mounted) {
          setState(() {
            _isPlaying = state.playing;
          });
          if (state.processingState == ProcessingState.completed) {
            _player.seek(Duration.zero);
            _player.pause();
          }
        }
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _isError = true;
          _errorMsg = e.toString();
        });
      }
    }
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isError) {
      return IconButton(
        icon: const Icon(Icons.volume_off, color: Colors.grey, size: 28),
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Audio Error: $_errorMsg')),
          );
        },
      );
    }

    return IconButton(
      icon: Icon(_isPlaying ? Icons.pause_circle_filled : Icons.volume_up, 
                 color: AppColors.primary, size: 28),
      onPressed: () {
        if (_isPlaying) {
          _player.pause();
        } else {
          _player.play();
        }
      },
    );
  }
}
