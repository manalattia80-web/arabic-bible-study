#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update -qq && sudo apt-get install -y -qq sqlite3
BT_DIR=$(ls -d "${ANDROID_SDK_ROOT:-$ANDROID_HOME}"/build-tools/* | sort -V | tail -n 1)
PKG="com.arabicbible.study"
DB_FILE="/data/data/$PKG/databases/bible_study_v382.db"
PREFS_FILE="/data/data/$PKG/shared_prefs/FlutterSharedPreferences.xml"
EVIDENCE_DIR="emulator_evidence"
mkdir -p "$EVIDENCE_DIR"

capture_evidence() {
  local rc=$?
  echo "Capturing emulator evidence (exit_code=$rc) into $EVIDENCE_DIR/ ..."
  adb logcat -d > "$EVIDENCE_DIR/logcat.txt" 2>&1 || true
  adb exec-out screencap -p > "$EVIDENCE_DIR/screen.png" 2>/dev/null || true
  adb shell uiautomator dump /sdcard/ui_final.xml >/dev/null 2>&1 || true
  adb pull /sdcard/ui_final.xml "$EVIDENCE_DIR/ui.xml" >/dev/null 2>&1 || cp /tmp/ui.xml "$EVIDENCE_DIR/ui.xml" 2>/dev/null || true
  adb shell "cat $PREFS_FILE" > "$EVIDENCE_DIR/FlutterSharedPreferences.xml" 2>/dev/null || true
  ls -lh "$EVIDENCE_DIR" || true
  return "$rc"
}
trap capture_evidence EXIT

echo "Enabling adb root on google_apis emulator..."
adb root
adb wait-for-device
# Prevent background system ANR dialogs (e.g., Pixel Launcher isn't responding) from covering the app window on CI emulators
adb shell settings put global hide_error_dialogs 1 || true
adb shell settings put secure anr_show_background 0 || true

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
adb shell "chown $OWNER $PREFS_FILE && chmod 660 $PREFS_FILE && restorecon $PREFS_FILE"

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

echo "TEST C: CROSS-SIGNATURE REAL JSON EXPORT & IMPORT (KEY A -> UNINSTALL -> KEY B -> UI RESTORE -> COLD RESTART, OFFLINE)"
tap_ui_label() {
  local label="$1"
  local attempt coords x y
  for attempt in $(seq 1 12); do
    adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 || true
    adb pull /sdcard/ui.xml /tmp/ui.xml >/dev/null 2>&1 || true
    # Auto-dismiss system ANR dialog (e.g., Pixel Launcher isn't responding) if present
    local aerr_coords
    aerr_coords=$(python3 - <<'PY'
import re, sys, xml.etree.ElementTree as ET
try:
    root = ET.parse('/tmp/ui.xml').getroot()
except Exception:
    sys.exit(0)
for node in root.iter('node'):
    if node.attrib.get('resource-id') == 'android:id/aerr_close':
        m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.attrib.get('bounds', ''))
        if m:
            x1, y1, x2, y2 = map(int, m.groups())
            print(f"{(x1+x2)//2} {(y1+y2)//2}")
            sys.exit(0)
PY
)
    if [ -n "$aerr_coords" ]; then
      x=$(echo "$aerr_coords" | awk '{print $1}')
      y=$(echo "$aerr_coords" | awk '{print $2}')
      echo "Dismissing system ANR dialog at ($x, $y)..."
      adb shell input tap "$x" "$y"
      sleep 2
      continue
    fi
    coords=$(python3 - "$label" <<'PY'
import re, sys, xml.etree.ElementTree as ET
target = sys.argv[1]
try:
    root = ET.parse('/tmp/ui.xml').getroot()
except Exception:
    sys.exit(0)
for node in root.iter('node'):
    text = node.attrib.get('text', '')
    desc = node.attrib.get('content-desc', '')
    if target in text or target in desc:
        m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.attrib.get('bounds', ''))
        if m:
            x1, y1, x2, y2 = map(int, m.groups())
            print(f"{(x1+x2)//2} {(y1+y2)//2}")
            sys.exit(0)
PY
)
    if [ -n "$coords" ]; then
      x=$(echo "$coords" | awk '{print $1}')
      y=$(echo "$coords" | awk '{print $2}')
      echo "Tapping UI element '$label' at ($x, $y)..."
      adb shell input tap "$x" "$y"
      sleep 2
      return 0
    fi
    sleep 2
  done
  echo "FATAL: Could not find UI element containing '$label' in uiautomator dump!"
  cat /tmp/ui.xml | head -c 4000 || true
  return 1
}

adb uninstall "$PKG"
rm -f /tmp/upgraded_v385.db /tmp/keyA.jks /tmp/keyB.jks /tmp/v385_keyA.apk /tmp/v385_keyB.apk /tmp/ui.xml

keytool -genkeypair -v -keystore /tmp/keyA.jks -storepass passA123 -keypass passA123 \
  -alias keya -keyalg RSA -keysize 2048 -validity 1 \
  -dname "CN=Legacy GitHub Key A" >/dev/null 2>&1
keytool -genkeypair -v -keystore /tmp/keyB.jks -storepass passB123 -keypass passB123 \
  -alias keyb -keyalg RSA -keysize 2048 -validity 1 \
  -dname "CN=New Play Upload Key B" >/dev/null 2>&1

"$BT_DIR/apksigner" sign --ks /tmp/keyA.jks --ks-pass pass:passA123 --key-pass pass:passA123 --ks-key-alias keya --out /tmp/v385_keyA.apk artifacts/arabic-bible-study-v385.apk
"$BT_DIR/apksigner" sign --ks /tmp/keyB.jks --ks-pass pass:passB123 --key-pass pass:passB123 --ks-key-alias keyb --out /tmp/v385_keyB.apk artifacts/arabic-bible-study-v385.apk

CERT_A=$("$BT_DIR/apksigner" verify --print-certs /tmp/v385_keyA.apk | awk '/certificate SHA-256/ && !done {print; done=1}')
CERT_B=$("$BT_DIR/apksigner" verify --print-certs /tmp/v385_keyB.apk | awk '/certificate SHA-256/ && !done {print; done=1}')
echo "Key A cert: $CERT_A"
echo "Key B cert: $CERT_B"
if [ -z "$CERT_A" ] || [ -z "$CERT_B" ] || [ "$CERT_A" = "$CERT_B" ]; then
  echo "FATAL: Key A and Key B certificates must both exist and differ!"
  exit 1
fi

echo "Installing Key A app and assembling DB offline..."
adb install /tmp/v385_keyA.apk
adb shell am start -n "$PKG/.MainActivity"
READY_A=0
SZ=0
for i in $(seq 1 60); do
  SZ=$(adb shell "stat -c %s $DB_FILE 2>/dev/null || echo 0" | tr -d '\r\n')
  if [ "$SZ" -ge 365416448 ]; then
    echo "Key A assembled bible_study_v382.db ($SZ bytes) in $((i*2))s."
    READY_A=1
    break
  fi
  sleep 2
done
[ "$READY_A" -eq 1 ]
sleep 3

# Seed Key A with real user preferences (dark mode + ordered Arabic search queries) and verify Key A reads them
adb shell am force-stop "$PKG"
OWNER_A=$(adb shell "stat -c %u:%g /data/data/$PKG" | tr -d '\r\n')
adb shell "mkdir -p /data/data/$PKG/shared_prefs"
adb push /tmp/FlutterSharedPreferences.xml "$PREFS_FILE" >/dev/null
adb shell "chown $OWNER_A $PREFS_FILE && chmod 660 $PREFS_FILE && restorecon $PREFS_FILE"

adb logcat -c
adb shell am start -n "$PKG/.MainActivity"
KEYA_LOG=""
for i in $(seq 1 15); do
  KEYA_LOG=$(adb logcat -d | grep "APP_PREFS_LOADED:" | tail -n 1 || true)
  if [ -n "$KEYA_LOG" ]; then
    break
  fi
  sleep 2
done
echo "Key A loaded prefs before export: $KEYA_LOG"
echo "$KEYA_LOG" | grep -qF 'is_dark_mode=true | recent_search_queries=["المحبة","الإيمان"]'

# Step 1: Execute REAL in-app JSON export via BackupRestoreModal UI on Key A -> Android system clipboard
tap_ui_label "النسخ الاحتياطي والاستعادة"
tap_ui_label "نسخ النسخة الاحتياطية (JSON)"
EXPORT_LOG=$(adb logcat -d | grep "APP_BACKUP_EXPORTED:" | tail -n 1 || true)
echo "Key A real JSON export log: $EXPORT_LOG"
echo "$EXPORT_LOG" | grep -qF '"is_dark_mode":true'
echo "$EXPORT_LOG" | grep -qF '"recent_search_queries":["المحبة","الإيمان"]'

# Step 2: Confirm Android blocks in-place upgrade from Key A -> Key B
echo "Verifying Android blocks in-place upgrade across different signing keys..."
if adb install -r /tmp/v385_keyB.apk >/tmp/cross_sign_err.txt 2>&1; then
  echo "FATAL: Expected INSTALL_FAILED_UPDATE_INCOMPATIBLE across different keys!"
  exit 1
fi
cat /tmp/cross_sign_err.txt
grep -q "INSTALL_FAILED_UPDATE_INCOMPATIBLE" /tmp/cross_sign_err.txt
echo "Confirmed: Android blocked cross-signature in-place upgrade as expected."

# Step 3: Uninstall Key A completely and clean-install Key B offline
echo "Uninstalling Key A app and performing clean offline install of Key B app..."
adb uninstall "$PKG"
adb logcat -c
adb install /tmp/v385_keyB.apk
adb shell am start -n "$PKG/.MainActivity"

READY_B=0
SZ=0
for i in $(seq 1 60); do
  SZ=$(adb shell "stat -c %s $DB_FILE 2>/dev/null || echo 0" | tr -d '\r\n')
  if [ "$SZ" -ge 365416448 ]; then
    echo "Key B clean install assembled bible_study_v382.db ($SZ bytes) in $((i*2))s while OFFLINE."
    READY_B=1
    break
  fi
  sleep 2
done
[ "$READY_B" -eq 1 ]

DEFAULT_LOG=""
for i in $(seq 1 15); do
  DEFAULT_LOG=$(adb logcat -d | grep "APP_PREFS_LOADED:" | tail -n 1 || true)
  if [ -n "$DEFAULT_LOG" ]; then
    break
  fi
  sleep 2
done
echo "Key B pre-restore startup log: $DEFAULT_LOG"
echo "$DEFAULT_LOG" | grep -qF 'is_dark_mode=false | recent_search_queries=[]'

# Step 4: Execute REAL in-app JSON paste & restore via BackupRestoreModal UI on Key B (ZERO XML injection!)
tap_ui_label "النسخ الاحتياطي والاستعادة"
tap_ui_label "لصق"
tap_ui_label "استعادة التفضيلات"
RESTORE_ACTION_LOG=$(adb logcat -d | grep "APP_BACKUP_RESTORED:" | tail -n 1 || true)
echo "Key B real JSON restore log: $RESTORE_ACTION_LOG"
echo "$RESTORE_ACTION_LOG" | grep -qF 'is_dark_mode=true | recent_search_queries=["المحبة","الإيمان"]'

# Step 5: Cold-restart Key B offline and verify exact values AND search order persist
adb shell am force-stop "$PKG"
adb logcat -c
adb shell am start -n "$PKG/.MainActivity"
RESTORED_LOG=""
for i in $(seq 1 15); do
  RESTORED_LOG=$(adb logcat -d | grep "APP_PREFS_LOADED:" | tail -n 1 || true)
  if [ -n "$RESTORED_LOG" ]; then
    break
  fi
  sleep 2
done
echo "Key B post-cold-restart runtime log: $RESTORED_LOG"
echo "$RESTORED_LOG" | grep -qF 'is_dark_mode=true | recent_search_queries=["المحبة","الإيمان"]'

PREFS_B=$(adb shell "cat $PREFS_FILE" | tr -d '\r')
echo "Key B FlutterSharedPreferences.xml after cold restart:"
echo "$PREFS_B"
echo "$PREFS_B" | grep -q 'name="flutter.db_version" value="382"'
echo "$PREFS_B" | grep -q 'name="flutter.is_dark_mode" value="true"'
echo "$PREFS_B" | grep -qF '[&quot;المحبة&quot;,&quot;الإيمان&quot;]'

adb pull "$DB_FILE" /tmp/keyB_v385.db >/dev/null
IC_B=$(sqlite3 /tmp/keyB_v385.db "PRAGMA integrity_check;")
CNT_B=$(sqlite3 /tmp/keyB_v385.db "SELECT COUNT(*) FROM word_mappings;")
echo "Key B DB -> integrity=$IC_B | word_mappings=$CNT_B"
[ "$IC_B" = "ok" ]
[ "$CNT_B" = "434351" ]

if adb logcat -d | grep -q "FATAL EXCEPTION"; then
  echo "FATAL EXCEPTION detected during cross-signature migration test!"
  adb logcat -d | grep -A 25 "FATAL EXCEPTION"
  exit 1
fi
echo "TEST C (Real Cross-Signature JSON Export/Restore Key A -> Uninstall -> Key B -> Cold Restart Offline): PASSED!"
