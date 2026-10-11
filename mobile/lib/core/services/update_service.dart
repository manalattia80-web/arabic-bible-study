// lib/core/services/update_service.dart
// ─────────────────────────────────────────────────────────────────────────────
// Automatic Update Service for Arabic Bible Study App.
// Checks GitHub Releases API in background (with timeout), compares build numbers,
// and launches the direct APK download link via external browser.
// ─────────────────────────────────────────────────────────────────────────────

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

class UpdateInfo {
  final String latestTag;
  final int latestBuildNumber;
  final String releaseName;
  final String releaseNotes;
  final String downloadUrl;
  final bool hasUpdate;

  const UpdateInfo({
    required this.latestTag,
    required this.latestBuildNumber,
    required this.releaseName,
    required this.releaseNotes,
    required this.downloadUrl,
    required this.hasUpdate,
  });
}

class UpdateService {
  UpdateService._();
  static final UpdateService instance = UpdateService._();

  // Current build number injected at build time, default to 156
  static const int currentBuildNumber = int.fromEnvironment('APP_BUILD_NUMBER', defaultValue: 156);
  static const String currentVersionName = 'v1.0.$currentBuildNumber';

  static const String _latestReleaseApi =
      'https://api.github.com/repos/manalattia80-web/arabic-bible-study/releases/latest';

  static const String defaultDownloadUrl =
      'https://github.com/manalattia80-web/arabic-bible-study/releases/latest/download/arabic-bible-study-app.apk';

  Future<UpdateInfo?> checkForUpdate() async {
    try {
      final res = await http.get(
        Uri.parse(_latestReleaseApi),
        headers: {'Accept': 'application/vnd.github.v3+json'},
      ).timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        final tagName = data['tag_name'] as String? ?? '';
        final name = data['name'] as String? ?? 'تحديث جديد';
        final body = data['body'] as String? ?? '';

        // Extract run number from tag e.g. "v1.0.160"
        final match = RegExp(r'v1\.0\.(\d+)').firstMatch(tagName);
        if (match != null) {
          final latestBuild = int.tryParse(match.group(1)!) ?? 0;
          final hasUpdate = latestBuild > currentBuildNumber;

          return UpdateInfo(
            latestTag: tagName,
            latestBuildNumber: latestBuild,
            releaseName: name,
            releaseNotes: body,
            downloadUrl: defaultDownloadUrl,
            hasUpdate: hasUpdate,
          );
        }
      }
    } catch (e) {
      debugPrint('Update check skipped (offline or network timeout): $e');
    }
    return null;
  }

  Future<bool> launchDownloadUrl([String? url]) async {
    final targetUrl = Uri.parse(url ?? defaultDownloadUrl);
    try {
      return await launchUrl(targetUrl, mode: LaunchMode.externalApplication);
    } catch (e) {
      debugPrint('Failed to launch update download url: $e');
      return false;
    }
  }
}
