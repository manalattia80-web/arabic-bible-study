// lib/core/services/user_backup_service.dart
// ─────────────────────────────────────────────────────────────────────────────
// Offline, zero-permission JSON Backup & Restore for user preferences.
// Enables migrating user preferences (theme + recent search history) cleanly
// when switching from GitHub-signed sideloaded builds to Google Play-signed builds.
// Internal keys (such as db_version) are strictly isolated and never overwritten.
// ─────────────────────────────────────────────────────────────────────────────

import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'search_history_service.dart';

class UserBackupException implements Exception {
  final String message;
  const UserBackupException(this.message);

  @override
  String toString() => 'UserBackupException: $message';
}

class UserBackupData {
  final int schemaVersion;
  final String appId;
  final String exportedAt;
  final bool isDarkMode;
  final List<String> recentSearchQueries;

  const UserBackupData({
    required this.schemaVersion,
    required this.appId,
    required this.exportedAt,
    required this.isDarkMode,
    required this.recentSearchQueries,
  });

  Map<String, dynamic> toJson() => {
        'schema_version': schemaVersion,
        'app_id': appId,
        'exported_at': exportedAt,
        'preferences': {
          UserBackupService.keyIsDarkMode: isDarkMode,
          UserBackupService.keyRecentSearchQueries: recentSearchQueries,
        },
      };
}

class UserBackupResult {
  final bool isDarkMode;
  final List<String> recentSearchQueries;

  const UserBackupResult({
    required this.isDarkMode,
    required this.recentSearchQueries,
  });
}

class UserBackupService {
  static const int currentSchemaVersion = 1;
  static const String expectedAppId = 'com.arabicbible.study';
  static const String keyIsDarkMode = 'is_dark_mode';
  static const String keyRecentSearchQueries = 'recent_search_queries';
  static const int maxSearchQueries = 10;

  /// Captures the current user-facing preferences from SharedPreferences.
  static Future<UserBackupData> captureCurrentData({DateTime? now}) async {
    final prefs = await SharedPreferences.getInstance();
    final isDark = prefs.getBool(keyIsDarkMode) ?? false;
    final queries = await SearchHistoryService.getRecentQueries();

    return UserBackupData(
      schemaVersion: currentSchemaVersion,
      appId: expectedAppId,
      exportedAt: (now ?? DateTime.now()).toUtc().toIso8601String(),
      isDarkMode: isDark,
      recentSearchQueries: List<String>.unmodifiable(queries),
    );
  }

  /// Exports user-facing preferences as a pretty-printed UTF-8 JSON string.
  static Future<String> exportToJson({DateTime? now}) async {
    final data = await captureCurrentData(now: now);
    return const JsonEncoder.withIndent('  ').convert(data.toJson());
  }

  /// Parses and strictly validates a backup JSON payload without mutating state.
  static UserBackupData parseAndValidate(String rawJson) {
    final trimmed = rawJson.trim();
    if (trimmed.isEmpty) {
      throw const UserBackupException('نص النسخة الاحتياطية فارغ.');
    }

    dynamic decoded;
    try {
      decoded = jsonDecode(trimmed);
    } catch (_) {
      throw const UserBackupException('صيغة JSON غير صالحة.');
    }

    if (decoded is! Map<String, dynamic>) {
      throw const UserBackupException('بنية النسخة الاحتياطية غير صالحة.');
    }

    final schemaVersion = decoded['schema_version'];
    if (schemaVersion is! int || schemaVersion != currentSchemaVersion) {
      throw const UserBackupException('إصدار النسخة الاحتياطية غير مدعوم.');
    }

    final appId = decoded['app_id'];
    if (appId is! String || appId != expectedAppId) {
      throw const UserBackupException('هذه النسخة الاحتياطية لا تخص هذا التطبيق.');
    }

    final prefsMap = decoded['preferences'];
    if (prefsMap is! Map<String, dynamic>) {
      throw const UserBackupException('قسم التفضيلات (preferences) مفقود أو غير صالح.');
    }

    final isDark = prefsMap[keyIsDarkMode];
    if (isDark is! bool) {
      throw const UserBackupException('قيمة الوضع الليلي (is_dark_mode) غير صالحة.');
    }

    final rawQueries = prefsMap[keyRecentSearchQueries];
    if (rawQueries is! List) {
      throw const UserBackupException('قائمة سجل البحث (recent_search_queries) غير صالحة.');
    }

    final sanitizedQueries = <String>[];
    final seenLower = <String>{};
    for (final item in rawQueries) {
      if (item is! String) {
        throw const UserBackupException('يحتوي سجل البحث على عنصر غير نصي.');
      }
      final q = item.trim();
      if (q.isEmpty) continue;
      final lower = q.toLowerCase();
      if (seenLower.add(lower)) {
        sanitizedQueries.add(q);
        if (sanitizedQueries.length >= maxSearchQueries) break;
      }
    }

    final exportedAt = decoded['exported_at'] is String
        ? decoded['exported_at'] as String
        : '';

    return UserBackupData(
      schemaVersion: schemaVersion,
      appId: appId,
      exportedAt: exportedAt,
      isDarkMode: isDark,
      recentSearchQueries: List<String>.unmodifiable(sanitizedQueries),
    );
  }

  /// Validates and atomically applies the backup to SharedPreferences.
  /// Never touches internal keys such as `db_version`.
  static Future<UserBackupResult> importFromJson(String rawJson) async {
    final parsed = parseAndValidate(rawJson);
    final prefs = await SharedPreferences.getInstance();

    await prefs.setBool(keyIsDarkMode, parsed.isDarkMode);
    await prefs.setStringList(keyRecentSearchQueries, parsed.recentSearchQueries);

    return UserBackupResult(
      isDarkMode: parsed.isDarkMode,
      recentSearchQueries: parsed.recentSearchQueries,
    );
  }
}
