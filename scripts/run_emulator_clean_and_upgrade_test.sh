#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update -qq && sudo apt-get install -y -qq sqlite3
BT_DIR=$(ls -d "${ANDROID_SDK_ROOT:-$ANDROID_HOME}"/build-tools/* | sort -V | tail -n 1)
PKG="com.arabicbible.study"
DB_FILE="/data/data/$PKG/databases/bible_study_v382.db"
PREFS_FILE="/data/data/$PKG/shared_prefs/FlutterSharedPreferences.xml"

echo "Enabling adb root on google_apis emulator..."
adb root
adb wait-for-device

echo "=== TEST A: CLEAN INSTALL OFFLINE (v1.0.385 Compressed .dat Assembly) ==="
adb shell svc wifi disable
adb shell svc data disable
adb logcat -c
adb install artifacts/arabic-bible-study-v385.apk
adb shell am start -n "$PKG/.MainActivity"

READY=0
SZ=0
for i in $(seq 1 60); do
  SZ=$(adb shell "stat -c %s $DB_FILE 2>/dev/null || echo 0" | tr -d '\r\n')
  if [ "$SZ" -ge 365416448 ]; then
    echo "Clean install assembled bible_study_v382.db ($SZ bytes) in $((i*2))s while OFFLINE!"
    READY=1
    break
  fi
  sleep 2
done
if [ "$READY" -ne 1 ]; then
  echo "FATAL: DB did not reach 365416448 bytes (last size: $SZ)"
  adb logcat -d | tail -n 80
  exit 1
fi

sleep 4
adb pull "$DB_FILE" /tmp/clean_v385.db >/dev/null
IC=$(sqlite3 /tmp/clean_v385.db "PRAGMA integrity_check;")
CNT=$(sqlite3 /tmp/clean_v385.db "SELECT COUNT(*) FROM word_mappings;")
CLEAN_SHA=$(sha256sum /tmp/clean_v385.db | awk '{print $1}')
echo "Clean Install DB -> integrity=$IC | word_mappings=$CNT | sha256=$CLEAN_SHA"
[ "$IC" = "ok" ]
[ "$CNT" = "434351" ]
if adb logcat -d | grep -q "FATAL EXCEPTION"; then
  echo "FATAL EXCEPTION detected during clean install!"
  adb logcat -d | grep -A 25 "FATAL EXCEPTION"
  exit 1
fi
echo "TEST A (Clean Install Offline): PASSED!"

echo "=== TEST B: IN-PLACE UPGRADE OVER v382 WITH REAL PREFERENCE READ VERIFICATION (OFFLINE) ==="
adb uninstall "$PKG"
rm -f /tmp/clean_v385.db
curl -sSL -o /tmp/v382.apk https://github.com/manalattia80-web/arabic-bible-study/releases/download/v1.0.382/arabic-bible-study-app.apk

# Re-sign both v382 and v385 with a shared ephemeral test keystore to simulate Play-signed in-place upgrade
keytool -genkeypair -v -keystore /tmp/upg_test.jks -storepass testpass123 -keypass testpass123 \
  -alias upgtest -keyalg RSA -keysize 2048 -validity 1 \
  -dname "CN=Emulator Upgrade Test" >/dev/null 2>&1
"$BT_DIR/apksigner" sign --ks /tmp/upg_test.jks --ks-pass pass:testpass123 --key-pass pass:testpass123 --ks-key-alias upgtest --out /tmp/v382_resigned.apk /tmp/v382.apk
"$BT_DIR/apksigner" sign --ks /tmp/upg_test.jks --ks-pass pass:testpass123 --key-pass pass:testpass123 --ks-key-alias upgtest --out /tmp/v385_resigned.apk artifacts/arabic-bible-study-v385.apk

adb install /tmp/v382_resigned.apk
adb shell am start -n "$PKG/.MainActivity"
READY_382=0
SZ=0
for i in $(seq 1 60); do
  SZ=$(adb shell "stat -c %s $DB_FILE 2>/dev/null || echo 0" | tr -d '\r\n')
  if [ "$SZ" -ge 365416448 ]; then
    echo "v382 baseline assembled bible_study_v382.db ($SZ bytes) in $((i*2))s."
    READY_382=1
    break
  fi
  sleep 2
done
[ "$READY_382" -eq 1 ]
sleep 3
adb shell am force-stop "$PKG"

# Seed the ACTUAL app preference keys (is_dark_mode + recent_search_queries + db_version)
# Note: shared_preferences_android uses JSON_LIST_PREFIX (ending with '!') for List<String>.
cat <<'XML' > /tmp/FlutterSharedPreferences.xml
<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
    <long name="flutter.db_version" value="382" />
    <boolean name="flutter.is_dark_mode" value="true" />
    <string name="flutter.recent_search_queries">VGhpcyBpcyB0aGUgcHJlZml4IGZvciBhIGxpc3Qu!["المحبة","الإيمان"]</string>
</map>
XML

OWNER=$(adb shell "stat -c %u:%g /data/data/$PKG" | tr -d '\r\n')
adb shell "mkdir -p /data/data/$PKG/shared_prefs"
adb push /tmp/FlutterSharedPreferences.xml "$PREFS_FILE" >/dev/null
adb shell "chown $OWNER $PREFS_FILE && chmod 660 $PREFS_FILE"

echo "Upgrading in-place v382 -> v385 while OFFLINE..."
adb logcat -c
adb install -r /tmp/v385_resigned.apk
VER_CODE=$(adb shell dumpsys package "$PKG" | grep "versionCode=" | head -n 1 | tr -d '\r')
echo "Post-upgrade package: $VER_CODE"
echo "$VER_CODE" | grep -q "versionCode=385"

adb shell am start -n "$PKG/.MainActivity"

# Wait for the running Flutter app to actually read and log its loaded preferences
PREFS_LOG=""
for i in $(seq 1 15); do
  PREFS_LOG=$(adb logcat -d | grep "APP_PREFS_LOADED:" | tail -n 1 || true)
  if [ -n "$PREFS_LOG" ]; then
    break
  fi
  sleep 2
done

if [ -z "$PREFS_LOG" ]; then
  echo "FATAL: Running app did not emit APP_PREFS_LOADED diagnostic line!"
  adb logcat -d | tail -n 80
  exit 1
fi
echo "Runtime Flutter preference read proof:"
echo "  $PREFS_LOG"
echo "$PREFS_LOG" | grep -q 'is_dark_mode=true'
echo "$PREFS_LOG" | grep -q 'المحبة'
echo "$PREFS_LOG" | grep -q 'الإيمان'

PREFS_AFTER=$(adb shell "cat $PREFS_FILE" | tr -d '\r')
echo "Post-upgrade FlutterSharedPreferences.xml:"
echo "$PREFS_AFTER"
echo "$PREFS_AFTER" | grep -q 'name="flutter.db_version" value="382"'
echo "$PREFS_AFTER" | grep -q 'name="flutter.is_dark_mode" value="true"'
echo "$PREFS_AFTER" | grep -q 'name="flutter.recent_search_queries"'
echo "$PREFS_AFTER" | grep -q 'المحبة'
echo "$PREFS_AFTER" | grep -q 'الإيمان'

SZ_AFTER=$(adb shell "stat -c %s $DB_FILE" | tr -d '\r\n')
echo "Post-upgrade DB size: $SZ_AFTER bytes"
[ "$SZ_AFTER" -ge 365416448 ]

adb pull "$DB_FILE" /tmp/upgraded_v385.db >/dev/null
IC_UPG=$(sqlite3 /tmp/upgraded_v385.db "PRAGMA integrity_check;")
CNT_UPG=$(sqlite3 /tmp/upgraded_v385.db "SELECT COUNT(*) FROM word_mappings;")
echo "Post-upgrade DB -> integrity=$IC_UPG | word_mappings=$CNT_UPG"
[ "$IC_UPG" = "ok" ]
[ "$CNT_UPG" = "434351" ]

if adb logcat -d | grep -q "FATAL EXCEPTION"; then
  echo "FATAL EXCEPTION detected during upgrade!"
  adb logcat -d | grep -A 25 "FATAL EXCEPTION"
  exit 1
fi
echo "TEST B (Upgrade Over v382 Offline With Exact Preference-Value & Runtime-Read Verification): PASSED!"
