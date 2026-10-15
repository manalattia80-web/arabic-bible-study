// lib/providers/update_provider.dart
// ─────────────────────────────────────────────────────────────────────────────
// State management provider for in-app updates with real-time download progress.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/services/update_service.dart';

class UpdateProvider extends ChangeNotifier {
  static const String _autoDownloadKey = 'pref_auto_download_updates';

  UpdateInfo? _updateInfo;
  bool _isDismissed = false;
  bool _isChecking = false;
  bool _isDownloading = false;
  bool _isDownloaded = false;
  bool _autoDownload = true;
  double _downloadProgress = 0.0;
  String? _downloadError;

  UpdateProvider() {
    _loadPreferences();
  }

  UpdateInfo? get updateInfo => _isDismissed ? null : _updateInfo;
  bool get hasUpdate => (_updateInfo?.hasUpdate ?? false) && !_isDismissed;
  bool get isChecking => _isChecking;
  bool get isDownloading => _isDownloading;
  bool get isDownloaded => _isDownloaded;
  bool get autoDownload => _autoDownload;
  double get downloadProgress => _downloadProgress;
  String? get downloadError => _downloadError;

  Future<void> _loadPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _autoDownload = prefs.getBool(_autoDownloadKey) ?? true;
      notifyListeners();
    } catch (_) {}
  }

  Future<void> setAutoDownload(bool enabled) async {
    _autoDownload = enabled;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_autoDownloadKey, enabled);
    } catch (_) {}
  }

  Future<void> checkForUpdates({
    void Function(String version)? onUpdateStarting,
    void Function()? onUpdateReady,
  }) async {
    if (_isChecking) return;
    _isChecking = true;
    notifyListeners();

    try {
      _updateInfo = await UpdateService.instance.checkForUpdate();
    } catch (_) {}

    _isChecking = false;
    notifyListeners();

    // Automatically trigger background download if connected & update is available
    if ((_updateInfo?.hasUpdate ?? false) && _autoDownload && !_isDownloading && !_isDownloaded) {
      if (onUpdateStarting != null && _updateInfo?.latestTag != null) {
        onUpdateStarting(_updateInfo!.latestTag);
      }
      final ok = await startDirectUpdate();
      if (ok && onUpdateReady != null) {
        onUpdateReady();
      }
    }
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
    if (success) {
      _isDownloaded = true;
    } else {
      _downloadError = 'تعذر تنزيل التحديث تلقائياً';
    }
    notifyListeners();
    return success;
  }

  Future<bool> installDownloadedApk() async {
    final success = await UpdateService.instance.openDownloadedApk(_updateInfo?.downloadUrl);
    if (!success) {
      return await startDownload();
    }
    return true;
  }

  Future<bool> startDownload() async {
    return await UpdateService.instance.launchDownloadUrl(_updateInfo?.downloadUrl);
  }
}
