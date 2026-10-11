// lib/core/services/search_history_service.dart
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class SearchHistoryService {
  static const String _key = 'recent_search_queries';
  static const int _maxItems = 10;

  static Future<List<String>> getRecentQueries() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = prefs.getStringList(_key);
      if (list != null) return list;
      // Fallback if stored as JSON string
      final raw = prefs.getString(_key);
      if (raw != null) {
        final decoded = jsonDecode(raw) as List;
        return decoded.map((e) => e.toString()).toList();
      }
    } catch (_) {}
    return [];
  }

  static Future<void> addQuery(String query) async {
    final q = query.trim();
    if (q.isEmpty) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      List<String> list = prefs.getStringList(_key) ?? [];
      list.removeWhere((item) => item.trim().toLowerCase() == q.toLowerCase());
      list.insert(0, q);
      if (list.length > _maxItems) {
        list = list.sublist(0, _maxItems);
      }
      await prefs.setStringList(_key, list);
    } catch (_) {}
  }

  static Future<void> removeQuery(String query) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      List<String> list = prefs.getStringList(_key) ?? [];
      list.removeWhere((item) => item.trim().toLowerCase() == query.trim().toLowerCase());
      await prefs.setStringList(_key, list);
    } catch (_) {}
  }

  static Future<void> clearHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_key);
    } catch (_) {}
  }
}
