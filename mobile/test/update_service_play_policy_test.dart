import 'package:flutter_test/flutter_test.dart';
import 'package:arabic_bible_study/core/services/update_service.dart';

void main() {
  test('When DISABLE_AUTO_UPDATE=true, all external GitHub APK update paths are strictly blocked', () async {
    if (!UpdateService.disableAutoUpdate) {
      // Only enforce Play Store blocking assertions when built with --dart-define=DISABLE_AUTO_UPDATE=true
      return;
    }
    expect(UpdateService.disableAutoUpdate, isTrue);
    expect(await UpdateService.instance.checkForUpdate(), isNull);
    expect(
      await UpdateService.instance.downloadAndInstallApk(onProgress: (_) {}),
      isFalse,
    );
    expect(await UpdateService.instance.openDownloadedApk(), isFalse);
    expect(await UpdateService.instance.launchDownloadUrl(), isFalse);
  });
}
