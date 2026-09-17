// lib/core/theme/app_theme.dart
// Material 3 dark theme with manuscript gold accents + Arabic/Hebrew/Greek text styles.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get light {
    final base = ThemeData.light(useMaterial3: true);

    return base.copyWith(
      scaffoldBackgroundColor: AppColors.bgBase,

      colorScheme: const ColorScheme.light(
        primary:         AppColors.primary,
        onPrimary:       Colors.white,
        secondary:       AppColors.info,
        onSecondary:     Colors.white,
        surface:         AppColors.bgSurface,
        onSurface:       AppColors.textPrimary,
        error:           AppColors.danger,
        onError:         Colors.white,
        outline:         AppColors.border,
        surfaceContainerHigh: AppColors.bgCard,
      ),

      // AppBar
      appBarTheme: AppBarTheme(
        backgroundColor:  AppColors.bgSurface,
        foregroundColor:  AppColors.textPrimary,
        elevation:        0,
        scrolledUnderElevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        centerTitle:      true,
        titleTextStyle: GoogleFonts.inter(
          fontSize:   17,
          fontWeight: FontWeight.w600,
          color:      AppColors.textPrimary,
        ),
        shape: const Border(
          bottom: BorderSide(color: AppColors.border, width: 1),
        ),
      ),

      // Cards
      cardTheme: CardTheme(
        color:       AppColors.bgCard,
        elevation:   0,
        shape:       RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: AppColors.border),
        ),
        margin: EdgeInsets.zero,
      ),

      // Bottom sheet
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor:    AppColors.bgCard,
        surfaceTintColor:   Colors.transparent,
        showDragHandle:     true,
        dragHandleColor:    AppColors.borderLight,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
      ),

      // Dividers
      dividerTheme: const DividerThemeData(
        color:     AppColors.border,
        thickness: 1,
        space:     0,
      ),

      // Input decoration
      inputDecorationTheme: InputDecorationTheme(
        filled:           true,
        fillColor:        AppColors.bgSurface,
        border:           _inputBorder(AppColors.border),
        enabledBorder:    _inputBorder(AppColors.border),
        focusedBorder:    _inputBorder(AppColors.primary),
        hintStyle: GoogleFonts.inter(color: AppColors.textMuted, fontSize: 14),
        contentPadding:   const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),

      // Chips
      chipTheme: const ChipThemeData(
        backgroundColor:  AppColors.bgCard,
        labelStyle:       TextStyle(color: AppColors.textSecondary, fontSize: 12),
        side:             BorderSide(color: AppColors.border),
        padding:          EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      ),

      // Text
      textTheme: GoogleFonts.interTextTheme(base.textTheme).apply(
        bodyColor:    AppColors.textPrimary,
        displayColor: AppColors.textPrimary,
      ),
    );
  }

  static OutlineInputBorder _inputBorder(Color color) => OutlineInputBorder(
    borderRadius: BorderRadius.circular(10),
    borderSide: BorderSide(color: color),
  );

  // ── Text styles for language-specific text ─────────────────────
  static TextStyle arabicVerse({double size = 22, Color? color}) => TextStyle(
    fontFamily: 'Amiri',   // fallback if Amiri not loaded
    fontSize:   size,
    height:     1.85,
    color:      color ?? AppColors.arabicText,
    fontWeight: FontWeight.w400,
  );

  // For inline Arabic UI text (book names, etc.)
  static TextStyle arabicLabel({double size = 16}) => TextStyle(
    fontFamily: 'Amiri',
    fontSize:   size,
    color:      AppColors.arabicText,
    fontWeight: FontWeight.w700,
    height:     1.4,
  );

  static TextStyle hebrewText({double size = 20}) => TextStyle(
    fontFamily: 'serif',   // SBL Hebrew if available, else Times
    fontSize:   size,
    height:     1.85,
    color:      AppColors.hebrewText,
    fontWeight: FontWeight.w400,
  );

  static TextStyle greekText({double size = 18}) => TextStyle(
    fontFamily: 'serif',
    fontSize:   size,
    height:     1.85,
    color:      AppColors.greekText,
    fontWeight: FontWeight.w400,
  );

  static TextStyle originalText(String lang, {double size = 20}) {
    return lang == 'greek' ? greekText(size: size) : hebrewText(size: size);
  }

  // ── Standard decorations ──────────────────────────────────────
  static BoxDecoration get cardDecoration => BoxDecoration(
    color:        AppColors.bgCard,
    border:       Border.all(color: AppColors.border),
    borderRadius: BorderRadius.circular(12),
  );

  static BoxDecoration get surfaceDecoration => BoxDecoration(
    color:        AppColors.bgSurface,
    border:       Border.all(color: AppColors.border),
    borderRadius: BorderRadius.circular(12),
  );

  static BoxDecoration goldAccentDecoration({double radius = 12}) => BoxDecoration(
    color:        AppColors.primaryGlow,
    border:       Border.all(color: AppColors.primary.withOpacity(0.4)),
    borderRadius: BorderRadius.circular(radius),
  );
}
