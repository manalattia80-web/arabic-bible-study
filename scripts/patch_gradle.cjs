const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '..', 'mobile', 'android', 'build.gradle');
if (fs.existsSync(gradlePath)) {
  let content = fs.readFileSync(gradlePath, 'utf8');
  if (!content.includes('KotlinCompile')) {
    content += `

subprojects {
    afterEvaluate { project ->
        if (project.plugins.hasPlugin('kotlin-android') || project.plugins.hasPlugin('kotlin')) {
            project.tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
                kotlinOptions {
                    jvmTarget = "17"
                    freeCompilerArgs += ["-Xsuppress-version-warnings", "-Xlanguage-version=1.8", "-Xapi-version=1.8"]
                }
            }
        }
    }
}
`;
    fs.writeFileSync(gradlePath, content, 'utf8');
    console.log('Successfully patched android/build.gradle with KotlinCompile override');
  }
}
