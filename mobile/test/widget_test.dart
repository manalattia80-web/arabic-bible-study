import 'package:flutter_test/flutter_test.dart';
import 'package:arabic_bible_study/app.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ArabicBibleApp());
  });
}
