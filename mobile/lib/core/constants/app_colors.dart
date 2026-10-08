// lib/core/constants/app_colors.dart
// ─────────────────────────────────────────────────────────────────────────────
// Centralized color palette with dynamic Light / Dark (Night) mode support.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  /// Global dark mode toggle state, kept in sync with ThemeProvider
  static bool isDark = false;

  // ── Light Theme Palette ──────────────────────────────────────
  static const Color lightBgBase      = Color(0xFFF8FAFC); // light grayish blue background
  static const Color lightBgSurface   = Color(0xFFFFFFFF); // white card surface
  static const Color lightBgCard      = Color(0xFFF1F5F9); // slightly darker elevated card
  static const Color lightBgCardHov   = Color(0xFFE2E8F0); // hovered card

  static const Color lightPrimary     = Color(0xFFB48512); // darker manuscript gold for light bg
  static const Color lightPrimaryDim  = Color(0xFF8A640D);
  static const Color lightPrimaryGlow = Color(0x20B48512);
  static const Color lightPrimaryText = Color(0xFF926707); // dark warm gold text

  static const Color lightBorder      = Color(0xFFCBD5E1); // light gray border
  static const Color lightBorderLight = Color(0xFF94A3B8);

  static const Color lightTextPrimary   = Color(0xFF0F172A); // almost black
  static const Color lightTextSecondary = Color(0xFF475569); // dark slate gray
  static const Color lightTextMuted     = Color(0xFF94A3B8); // light gray text

  static const Color lightArabicText  = Color(0xFF1C1917); // very dark warm gray/black
  static const Color lightHebrewText  = Color(0xFF0C4A6E); // dark blue
  static const Color lightGreekText   = Color(0xFF4C1D95); // dark purple

  // ── Dark (Night Mode) Palette ────────────────────────────────
  static const Color darkBgBase      = Color(0xFF080E1A); // deepest dark navy
  static const Color darkBgSurface   = Color(0xFF0F1724); // card surface navy
  static const Color darkBgCard      = Color(0xFF161E2E); // elevated dark card
  static const Color darkBgCardHov   = Color(0xFF1C2740); // hovered dark card

  static const Color darkPrimary     = Color(0xFFD4A017); // vibrant manuscript gold
  static const Color darkPrimaryDim  = Color(0xFFA07810);
  static const Color darkPrimaryGlow = Color(0x30D4A017);
  static const Color darkPrimaryText = Color(0xFFFCD34D); // warm gold text

  static const Color darkBorder      = Color(0xFF1E2D45); // dark navy border
  static const Color darkBorderLight = Color(0xFF263548);

  static const Color darkTextPrimary   = Color(0xFFF1F5F9); // bright off-white
  static const Color darkTextSecondary = Color(0xFF94A3B8); // muted slate
  static const Color darkTextMuted     = Color(0xFF64748B); // dark muted slate

  static const Color darkArabicText  = Color(0xFFF1F5F9); // clear high-contrast white/ivory for diacritics
  static const Color darkHebrewText  = Color(0xFFA5F3FC); // soft cyan
  static const Color darkGreekText   = Color(0xFFC4B5FD); // soft purple

  // ── Dynamic Getters (Auto-switch with isDark) ─────────────────
  static Color get bgBase       => isDark ? darkBgBase : lightBgBase;
  static Color get bgSurface    => isDark ? darkBgSurface : lightBgSurface;
  static Color get bgCard       => isDark ? darkBgCard : lightBgCard;
  static Color get bgCardHov    => isDark ? darkBgCardHov : lightBgCardHov;

  static Color get primary      => isDark ? darkPrimary : lightPrimary;
  static Color get primaryDim   => isDark ? darkPrimaryDim : lightPrimaryDim;
  static Color get primaryGlow  => isDark ? darkPrimaryGlow : lightPrimaryGlow;
  static Color get primaryText  => isDark ? darkPrimaryText : lightPrimaryText;

  static Color get border       => isDark ? darkBorder : lightBorder;
  static Color get borderLight  => isDark ? darkBorderLight : lightBorderLight;

  static Color get textPrimary   => isDark ? darkTextPrimary : lightTextPrimary;
  static Color get textSecondary => isDark ? darkTextSecondary : lightTextSecondary;
  static Color get textMuted     => isDark ? darkTextMuted : lightTextMuted;

  static Color get arabicText   => isDark ? darkArabicText : lightArabicText;
  static Color get hebrewText   => isDark ? darkHebrewText : lightHebrewText;
  static Color get greekText    => isDark ? darkGreekText : lightGreekText;

  // ── Status (Constant across modes) ───────────────────────────
  static const Color success    = Color(0xFF10B981);
  static const Color successBg  = Color(0x1F10B981);
  static const Color danger     = Color(0xFFEF4444);
  static const Color dangerBg   = Color(0x1FEF4444);
  static const Color warning    = Color(0xFFF59E0B);
  static const Color info       = Color(0xFF3B82F6);
}
