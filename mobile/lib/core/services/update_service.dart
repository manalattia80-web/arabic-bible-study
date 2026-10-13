// lib/core/services/update_service.dart
// ─────────────────────────────────────────────────────────────────────────────
// Automatic Update Service for Arabic Bible Study App.
// Checks GitHub Releases API in background, downloads the latest APK locally
// with real-time download progress, and triggers direct Android package installer.
// ─────────────────────────────────────────────────────────────────────────────

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
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

          final assets = data['assets'] as List<dynamic>? ?? [];
          String resolvedDownloadUrl = defaultDownloadUrl;
          if (assets.isNotEmpty && assets[0] is Map && assets[0]['browser_download_url'] != null) {
            resolvedDownloadUrl = assets[0]['browser_download_url'] as String;
          }

          return UpdateInfo(
            latestTag: tagName,
            latestBuildNumber: latestBuild,
            releaseName: name,
            releaseNotes: body,
            downloadUrl: resolvedDownloadUrl,
            hasUpdate: hasUpdate,
          );
        }
      }
    } catch (e) {
      debugPrint('Update check skipped (offline or network timeout): $e');
    }
    return null;
  }

  /// Downloads the APK directly to local device storage with progress callbacks,
  /// and automatically triggers the Android APK package installer.
  Future<bool> downloadAndInstallApk({
    String? url,
    required void Function(double progress) onProgress,
  }) async {
    final downloadUri = Uri.parse(url ?? defaultDownloadUrl);

    try {
      final client = http.Client();
      final request = http.Request('GET', downloadUri);
      final response = await client.send(request);

      if (response.statusCode != 200) {
        // Fallback to browser download if direct stream fails
        return await launchDownloadUrl(url);
      }

      final totalBytes = response.contentLength ?? 0;
      int receivedBytes = 0;

      // Save APK into external cache or temp directory
      final dir = await getExternalStorageDirectory() ?? await getTemporaryDirectory();
      final filePath = p.join(dir.path, 'arabic-bible-study-update.apk');
      final file = File(filePath);
      if (await file.exists()) {
        await file.delete();
      }

      final sink = file.openWrite();

      await response.stream.listen(
        (chunk) {
          receivedBytes += chunk.length;
          sink.add(chunk);
          if (totalBytes > 0) {
            onProgress(receivedBytes / totalBytes);
          }
        },
        cancelOnError: true,
      ).asFuture();

      await sink.flush();
      await sink.close();
      client.close();

      onProgress(1.0);

      // Verify file size: a real APK must be at least 15 MB
      if (receivedBytes < 15 * 1024 * 1024) {
        debugPrint('Downloaded file too small ($receivedBytes bytes), likely incomplete.');
        if (await file.exists()) {
          await file.delete();
        }
        return false;
      }

      // Trigger Android APK Package Installer
      final result = await OpenFilex.open(
        filePath,
        type: 'application/vnd.android.package-archive',
      );

      if (result.type == ResultType.done) {
        return true;
      } else {
        debugPrint('OpenFilex returned: ${result.message}');
        // The file is downloaded, so return true even if prompt dismissed
        return true;
      }
    } catch (e) {
      debugPrint('Direct APK download failed: $e');
      return false;
    }
  }

  Future<bool> openDownloadedApk() async {
    try {
      final dir = await getExternalStorageDirectory() ?? await getTemporaryDirectory();
      final filePath = p.join(dir.path, 'arabic-bible-study-update.apk');
      final file = File(filePath);
      if (await file.exists()) {
        final result = await OpenFilex.open(
          filePath,
          type: 'application/vnd.android.package-archive',
        );
        return result.type == ResultType.done;
      }
    } catch (e) {
      debugPrint('Failed to open downloaded apk: $e');
    }
    return false;
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
