// lib/providers/theme_provider.dart
// ─────────────────────────────────────────────────────────────────────────────
// State management for Theme (Light / Dark Mode) with SharedPreferences persistence.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_colors.dart';

class ThemeProvider extends ChangeNotifier {
  static const String _prefKey = 'is_dark_mode';
  bool _isDark = false;

  bool get isDark => _isDark;
  ThemeMode get themeMode => _isDark ? ThemeMode.dark : ThemeMode.light;

  ThemeProvider() {
    _loadFromPrefs();
  }

  Future<void> _loadFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedDark = prefs.getBool(_prefKey);
      if (savedDark != null && savedDark != _isDark) {
        _isDark = savedDark;
        AppColors.isDark = _isDark;
        notifyListeners();
      }
    } catch (_) {
      // Fallback gracefully if SharedPreferences is unavailable
    }
  }

  Future<void> toggleTheme() async {
    _isDark = !_isDark;
    AppColors.isDark = _isDark;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_prefKey, _isDark);
    } catch (_) {}
  }

  Future<void> setDarkMode(bool dark) async {
    if (_isDark == dark) return;
    _isDark = dark;
    AppColors.isDark = _isDark;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_prefKey, _isDark);
    } catch (_) {}
  }
}
