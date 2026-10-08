const fs = require('fs');
const path = require('path');

// 1. Patch gradle.properties
const gradlePropsPath = path.join(__dirname, '..', 'mobile', 'android', 'gradle.properties');
if (fs.existsSync(gradlePropsPath)) {
  let props = fs.readFileSync(gradlePropsPath, 'utf8');
  if (!props.includes('kotlin.compiler.languageVersion')) {
    props += '\nkotlin.compiler.languageVersion=1.8\nkotlin.compiler.apiVersion=1.8\nkotlin.suppressKotlinVersionCompatibilityCheck=true\n';
    fs.writeFileSync(gradlePropsPath, props, 'utf8');
    console.log('Successfully patched gradle.properties');
  }
}

// 2. Patch root android/build.gradle
const gradlePath = path.join(__dirname, '..', 'mobile', 'android', 'build.gradle');
if (fs.existsSync(gradlePath)) {
  let content = fs.readFileSync(gradlePath, 'utf8');
  if (!content.includes('import org.jetbrains.kotlin.gradle.tasks.KotlinCompile')) {
    content = 'import org.jetbrains.kotlin.gradle.tasks.KotlinCompile\n' + content;
  }
  if (!content.includes('KotlinCompile')) {
    content += `

allprojects {
    tasks.withType(KotlinCompile).configureEach {
        kotlinOptions {
            jvmTarget = "17"
            languageVersion = "1.8"
            apiVersion = "1.8"
        }
    }
}
`;
  }
  fs.writeFileSync(gradlePath, content, 'utf8');
  console.log('Successfully patched android/build.gradle with KotlinCompile override');
}

// 3. Patch mobile/android/app/build.gradle for permanent release signing
const appGradlePath = path.join(__dirname, '..', 'mobile', 'android', 'app', 'build.gradle');
if (fs.existsSync(appGradlePath)) {
  let appGradle = fs.readFileSync(appGradlePath, 'utf8');
  if (!appGradle.includes('signingConfigs.release') && !appGradle.includes('upload-keystore.jks')) {
    const signingBlock = `
    signingConfigs {
        release {
            storeFile file("upload-keystore.jks")
            storePassword "bible_study_2026"
            keyAlias "arabic_bible_study"
            keyPassword "bible_study_2026"
        }
    }
`;
    appGradle = appGradle.replace('buildTypes {', signingBlock + '\n    buildTypes {');
    appGradle = appGradle.replace('signingConfig = signingConfigs.debug', 'signingConfig = signingConfigs.release');
    appGradle = appGradle.replace('signingConfig signingConfigs.debug', 'signingConfig signingConfigs.release');
    fs.writeFileSync(appGradlePath, appGradle, 'utf8');
    console.log('Successfully patched android/app/build.gradle with permanent release signingConfig');
  } else {
    console.log('android/app/build.gradle already contains permanent release signingConfig');
  }
}

// 4. Ensure Android App Name Label is "دليل الكتاب المقدس"
const manifestPath = path.join(__dirname, '..', 'mobile', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  manifest = manifest.replace(/android:label="[^"]*"/g, 'android:label="دليل الكتاب المقدس"');
  if (!manifest.includes('android:label="دليل الكتاب المقدس"')) {
    manifest = manifest.replace('<application', '<application\n        android:label="دليل الكتاب المقدس"');
  }
  fs.writeFileSync(manifestPath, manifest, 'utf8');
  console.log('Successfully patched AndroidManifest.xml with app name: دليل الكتاب المقدس');
}

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
