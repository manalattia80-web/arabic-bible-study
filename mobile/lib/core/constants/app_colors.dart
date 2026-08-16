// lib/core/constants/app_colors.dart
// ─────────────────────────────────────────────────────────────────────────────
// Centralized color palette — dark navy/gold theme matching the Admin Panel.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── Backgrounds ──────────────────────────────────────────────
  static const Color bgBase    = Color(0xFF080E1A); // deepest dark
  static const Color bgSurface = Color(0xFF0F1724); // card surface
  static const Color bgCard    = Color(0xFF161E2E); // elevated card
  static const Color bgCardHov = Color(0xFF1C2740); // hovered card

  // ── Brand / Primary ─────────────────────────────────────────
  static const Color primary     = Color(0xFFD4A017); // manuscript gold
  static const Color primaryDim  = Color(0xFFA07810);
  static const Color primaryGlow = Color(0x30D4A017);
  static const Color primaryText = Color(0xFFFCD34D); // warm gold text

  // ── Borders ──────────────────────────────────────────────────
  static const Color border      = Color(0xFF1E2D45);
  static const Color borderLight = Color(0xFF263548);

  // ── Text ─────────────────────────────────────────────────────
  static const Color textPrimary   = Color(0xFFF1F5F9);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted     = Color(0xFF4B6080);

  // ── Language-specific text ──────────────────────────────────
  static const Color arabicText  = Color(0xFFFDE68A); // warm gold
  static const Color hebrewText  = Color(0xFFA5F3FC); // cyan
  static const Color greekText   = Color(0xFFC4B5FD); // soft purple

  // ── Status ────────────────────────────────────────────────────
  static const Color success    = Color(0xFF10B981);
  static const Color successBg  = Color(0x1F10B981);
  static const Color danger     = Color(0xFFEF4444);
  static const Color dangerBg   = Color(0x1FEF4444);
  static const Color warning    = Color(0xFFF59E0B);
  static const Color info       = Color(0xFF3B82F6);
}
