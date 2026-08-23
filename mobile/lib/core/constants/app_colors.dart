// lib/core/constants/app_colors.dart
// ─────────────────────────────────────────────────────────────────────────────
// Centralized color palette — dark navy/gold theme matching the Admin Panel.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── Backgrounds ──────────────────────────────────────────────
  static const Color bgBase    = Color(0xFFF8FAFC); // light grayish blue background
  static const Color bgSurface = Color(0xFFFFFFFF); // white card surface
  static const Color bgCard    = Color(0xFFF1F5F9); // slightly darker elevated card
  static const Color bgCardHov = Color(0xFFE2E8F0); // hovered card

  // ── Brand / Primary ─────────────────────────────────────────
  static const Color primary     = Color(0xFFB48512); // darker manuscript gold for light bg
  static const Color primaryDim  = Color(0xFF8A640D);
  static const Color primaryGlow = Color(0x20B48512);
  static const Color primaryText = Color(0xFF926707); // dark warm gold text

  // ── Borders ──────────────────────────────────────────────────
  static const Color border      = Color(0xFFCBD5E1); // light gray border
  static const Color borderLight = Color(0xFF94A3B8);

  // ── Text ─────────────────────────────────────────────────────
  static const Color textPrimary   = Color(0xFF0F172A); // almost black
  static const Color textSecondary = Color(0xFF475569); // dark slate gray
  static const Color textMuted     = Color(0xFF94A3B8); // light gray text

  // ── Language-specific text ──────────────────────────────────
  static const Color arabicText  = Color(0xFF1C1917); // very dark warm gray/black
  static const Color hebrewText  = Color(0xFF0C4A6E); // dark blue
  static const Color greekText   = Color(0xFF4C1D95); // dark purple

  // ── Status ────────────────────────────────────────────────────
  static const Color success    = Color(0xFF059669);
  static const Color successBg  = Color(0x1F10B981);
  static const Color danger     = Color(0xFFDC2626);
  static const Color dangerBg   = Color(0x1FEF4444);
  static const Color warning    = Color(0xFFD97706);
  static const Color info       = Color(0xFF2563EB);
}
