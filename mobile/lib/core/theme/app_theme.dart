// lib/core/theme/app_theme.dart
// ─────────────────────────────────────────────────────────────────────────────
// Material 3 themes (Light + Dark/Night mode) with manuscript gold accents
// and dedicated Arabic/Hebrew/Greek typography.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';

class AppTheme {
  AppTheme._();

  // ── Light Theme ───────────────────────────────────────────────
  static ThemeData get light {
    final base = ThemeData.light(useMaterial3: true);

    return base.copyWith(
      scaffoldBackgroundColor: AppColors.lightBgBase,

      colorScheme: const ColorScheme.light(
        primary:              AppColors.lightPrimary,
        onPrimary:            Colors.white,
        secondary:            AppColors.info,
        onSecondary:          Colors.white,
        surface:              AppColors.lightBgSurface,
        onSurface:            AppColors.lightTextPrimary,
        error:                AppColors.danger,
        onError:              Colors.white,
        outline:              AppColors.lightBorder,
        surfaceContainerHigh: AppColors.lightBgCard,
      ),

      // AppBar
      appBarTheme: AppBarTheme(
        backgroundColor:  AppColors.lightBgSurface,
        foregroundColor:  AppColors.lightTextPrimary,
        elevation:        0,
        scrolledUnderElevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        centerTitle:      true,
        titleTextStyle: GoogleFonts.inter(
          fontSize:   17,
          fontWeight: FontWeight.w600,
          color:      AppColors.lightTextPrimary,
        ),
        shape: Border(
          bottom: BorderSide(color: AppColors.lightBorder, width: 1.0),
        ),
      ),

      // Cards
      cardTheme: CardTheme(
        color:       AppColors.lightBgCard,
        elevation:   0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: AppColors.lightBorder),
        ),
        margin: EdgeInsets.zero,
      ),

      // Bottom sheet
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor:    AppColors.lightBgCard,
        surfaceTintColor:   Colors.transparent,
        showDragHandle:     true,
        dragHandleColor:    AppColors.lightBorderLight,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
      ),

      // Dividers
      dividerTheme: DividerThemeData(
        color:     AppColors.lightBorder,
        thickness: 1,
        space:     0,
      ),

      // Input decoration
      inputDecorationTheme: InputDecorationTheme(
        filled:           true,
        fillColor:        AppColors.lightBgSurface,
        border:           _inputBorder(AppColors.lightBorder),
        enabledBorder:    _inputBorder(AppColors.lightBorder),
        focusedBorder:    _inputBorder(AppColors.lightPrimary),
        hintStyle: GoogleFonts.inter(color: AppColors.lightTextMuted, fontSize: 14),
        contentPadding:   const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),

      // Chips
      chipTheme: ChipThemeData(
        backgroundColor:  AppColors.lightBgCard,
        labelStyle:       TextStyle(color: AppColors.lightTextSecondary, fontSize: 12),
        side:             BorderSide(color: AppColors.lightBorder),
        padding:          const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      ),

      // Text
      textTheme: GoogleFonts.interTextTheme(base.textTheme).apply(
        bodyColor:    AppColors.lightTextPrimary,
        displayColor: AppColors.lightTextPrimary,
      ),
    );
  }

  // ── Dark / Night Theme ─────────────────────────────────────────
  static ThemeData get dark {
    final base = ThemeData.dark(useMaterial3: true);

    return base.copyWith(
      scaffoldBackgroundColor: AppColors.darkBgBase,

      colorScheme: const ColorScheme.dark(
        primary:              AppColors.darkPrimary,
        onPrimary:            Colors.black,
        secondary:            AppColors.info,
        onSecondary:          Colors.white,
        surface:              AppColors.darkBgSurface,
        onSurface:            AppColors.darkTextPrimary,
        error:                AppColors.danger,
        onError:              Colors.white,
        outline:              AppColors.darkBorder,
        surfaceContainerHigh: AppColors.darkBgCard,
      ),

      // AppBar
      appBarTheme: AppBarTheme(
        backgroundColor:  AppColors.darkBgSurface,
        foregroundColor:  AppColors.darkTextPrimary,
        elevation:        0,
        scrolledUnderElevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        centerTitle:      true,
        titleTextStyle: GoogleFonts.inter(
          fontSize:   17,
          fontWeight: FontWeight.w600,
          color:      AppColors.darkTextPrimary,
        ),
        shape: Border(
          bottom: BorderSide(color: AppColors.darkBorder, width: 1.0),
        ),
      ),

      // Cards
      cardTheme: CardTheme(
        color:       AppColors.darkBgCard,
        elevation:   0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: AppColors.darkBorder),
        ),
        margin: EdgeInsets.zero,
      ),

      // Bottom sheet
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor:    AppColors.darkBgCard,
        surfaceTintColor:   Colors.transparent,
        showDragHandle:     true,
        dragHandleColor:    AppColors.darkBorderLight,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
      ),

      // Dividers
      dividerTheme: DividerThemeData(
        color:     AppColors.darkBorder,
        thickness: 1,
        space:     0,
      ),

      // Input decoration
      inputDecorationTheme: InputDecorationTheme(
        filled:           true,
        fillColor:        AppColors.darkBgSurface,
        border:           _inputBorder(AppColors.darkBorder),
        enabledBorder:    _inputBorder(AppColors.darkBorder),
        focusedBorder:    _inputBorder(AppColors.darkPrimary),
        hintStyle: GoogleFonts.inter(color: AppColors.darkTextMuted, fontSize: 14),
        contentPadding:   const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),

      // Chips
      chipTheme: ChipThemeData(
        backgroundColor:  AppColors.darkBgCard,
        labelStyle:       TextStyle(color: AppColors.darkTextSecondary, fontSize: 12),
        side:             BorderSide(color: AppColors.darkBorder),
        padding:          const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      ),

      // Text
      textTheme: GoogleFonts.interTextTheme(base.textTheme).apply(
        bodyColor:    AppColors.darkTextPrimary,
        displayColor: AppColors.darkTextPrimary,
      ),
    );
  }

  static OutlineInputBorder _inputBorder(Color color) => OutlineInputBorder(
    borderRadius: BorderRadius.circular(10),
    borderSide: BorderSide(color: color),
  );

  // ── Text styles for language-specific text ─────────────────────
  static TextStyle arabicVerse({double size = 22, Color? color}) => TextStyle(
    fontFamily: 'Amiri',
    fontSize:   size,
    height:     1.85,
    color:      color ?? AppColors.arabicText,
    fontWeight: FontWeight.w400,
  );

  // For inline Arabic UI text (book names, etc.)
  static TextStyle arabicLabel({double size = 16, Color? color}) => TextStyle(
    fontFamily: 'Amiri',
    fontSize:   size,
    color:      color ?? AppColors.arabicText,
    fontWeight: FontWeight.w700,
    height:     1.4,
  );

  static TextStyle hebrewText({double size = 20, Color? color}) => TextStyle(
    fontFamily: 'serif',
    fontSize:   size,
    height:     1.85,
    color:      color ?? AppColors.hebrewText,
    fontWeight: FontWeight.w400,
  );

  static TextStyle greekText({double size = 18, Color? color}) => TextStyle(
    fontFamily: 'serif',
    fontSize:   size,
    height:     1.85,
    color:      color ?? AppColors.greekText,
    fontWeight: FontWeight.w400,
  );

  static TextStyle originalText(String lang, {double size = 20, Color? color}) {
    return lang == 'greek' ? greekText(size: size, color: color) : hebrewText(size: size, color: color);
  }

  // ── Standard decorations (Dynamic with current theme) ─────────
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
