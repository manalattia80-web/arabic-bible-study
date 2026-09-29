const fs = require('fs');
const path = require('path');

const gradlePropsPath = path.join(__dirname, '..', 'mobile', 'android', 'gradle.properties');
if (fs.existsSync(gradlePropsPath)) {
  let props = fs.readFileSync(gradlePropsPath, 'utf8');
  if (!props.includes('kotlin.compiler.languageVersion')) {
    props += '\nkotlin.compiler.languageVersion=1.8\nkotlin.compiler.apiVersion=1.8\nkotlin.suppressKotlinVersionCompatibilityCheck=true\n';
    fs.writeFileSync(gradlePropsPath, props, 'utf8');
    console.log('Successfully patched gradle.properties');
  }
}

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
