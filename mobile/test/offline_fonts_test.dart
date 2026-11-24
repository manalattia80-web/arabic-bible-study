import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:arabic_bible_study/core/theme/app_theme.dart';

void main() {
  test('AppTheme light and dark use bundled local Inter font with zero runtime fetching', () {
    GoogleFonts.config.allowRuntimeFetching = false;

    final light = AppTheme.light;
    final dark = AppTheme.dark;

    expect(light.appBarTheme.titleTextStyle?.fontFamily, 'Inter');
    expect(light.inputDecorationTheme.hintStyle?.fontFamily, 'Inter');
    expect(light.textTheme.bodyMedium?.fontFamily, 'Inter');

    expect(dark.appBarTheme.titleTextStyle?.fontFamily, 'Inter');
    expect(dark.inputDecorationTheme.hintStyle?.fontFamily, 'Inter');
    expect(dark.textTheme.bodyMedium?.fontFamily, 'Inter');
    expect(GoogleFonts.config.allowRuntimeFetching, isFalse);
  });
}
