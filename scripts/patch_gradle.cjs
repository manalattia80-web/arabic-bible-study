const fs = require('fs');
const path = require('path');

// Ensure Arabic app_name in strings.xml (AGP 8.9+ / API 36 / Play-ready config is maintained directly in build.gradle & AndroidManifest.xml)
const stringsDir = path.join(__dirname, '..', 'mobile', 'android', 'app', 'src', 'main', 'res', 'values');
if (!fs.existsSync(stringsDir)) {
  fs.mkdirSync(stringsDir, { recursive: true });
}
const stringsPath = path.join(stringsDir, 'strings.xml');
fs.writeFileSync(stringsPath, `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">دليل الكتاب المقدس</string>
</resources>
`, 'utf8');
console.log('Successfully ensured strings.xml with app_name: دليل الكتاب المقدس');
