// lib/providers/update_provider.dart
// ─────────────────────────────────────────────────────────────────────────────
// State management provider for in-app updates with real-time download progress.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/foundation.dart';
import '../core/services/update_service.dart';

class UpdateProvider extends ChangeNotifier {
  UpdateInfo? _updateInfo;
  bool _isDismissed = false;
  bool _isChecking = false;
  bool _isDownloading = false;
  double _downloadProgress = 0.0;
  String? _downloadError;

  UpdateInfo? get updateInfo => _isDismissed ? null : _updateInfo;
  bool get hasUpdate => (_updateInfo?.hasUpdate ?? false) && !_isDismissed;
  bool get isChecking => _isChecking;
  bool get isDownloading => _isDownloading;
  double get downloadProgress => _downloadProgress;
  String? get downloadError => _downloadError;

  Future<void> checkForUpdates() async {
    if (_isChecking) return;
    _isChecking = true;
    notifyListeners();

    try {
      _updateInfo = await UpdateService.instance.checkForUpdate();
    } catch (_) {}

    _isChecking = false;
    notifyListeners();
  }

  void dismissUpdate() {
    _isDismissed = true;
    notifyListeners();
  }

  Future<bool> startDirectUpdate() async {
    if (_isDownloading) return false;
    _isDownloading = true;
    _downloadProgress = 0.0;
    _downloadError = null;
    notifyListeners();

    final success = await UpdateService.instance.downloadAndInstallApk(
      url: _updateInfo?.downloadUrl,
      onProgress: (p) {
        _downloadProgress = p;
        notifyListeners();
      },
    );

    _isDownloading = false;
    if (!success) {
      _downloadError = 'تعذر التثبيت المباشر، تم التحويل للمتصفح';
    }
    notifyListeners();
    return success;
  }

  Future<bool> startDownload() async {
    return await UpdateService.instance.launchDownloadUrl(_updateInfo?.downloadUrl);
  }
}
