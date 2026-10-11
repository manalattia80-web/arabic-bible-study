// lib/providers/update_provider.dart
// ─────────────────────────────────────────────────────────────────────────────
// State management provider for in-app updates.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/foundation.dart';
import '../core/services/update_service.dart';

class UpdateProvider extends ChangeNotifier {
  UpdateInfo? _updateInfo;
  bool _isDismissed = false;
  bool _isChecking = false;

  UpdateInfo? get updateInfo => _isDismissed ? null : _updateInfo;
  bool get hasUpdate => (_updateInfo?.hasUpdate ?? false) && !_isDismissed;
  bool get isChecking => _isChecking;

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

  Future<bool> startDownload() async {
    return await UpdateService.instance.launchDownloadUrl(_updateInfo?.downloadUrl);
  }
}
