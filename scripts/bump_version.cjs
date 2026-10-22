const fs = require('fs');
const path = require('path');

// 1. database_service.dart
const dbServicePath = path.resolve(__dirname, '../mobile/lib/core/services/database_service.dart');
let dbService = fs.readFileSync(dbServicePath, 'utf8');
dbService = dbService.replace(/bible_study_v27\.db/g, 'bible_study_v28.db');
dbService = dbService.replace(/const targetDbVersion = 27;/, 'const targetDbVersion = 28;');
if (!dbService.includes("'bible_study_v27.db',")) {
  dbService = dbService.replace("'bible_study_v26.db',", "'bible_study_v26.db',\n        'bible_study_v27.db',");
}
fs.writeFileSync(dbServicePath, dbService, 'utf8');
console.log('Updated database_service.dart to v28');

// 2. pubspec.yaml
const pubspecPath = path.resolve(__dirname, '../mobile/pubspec.yaml');
let pubspec = fs.readFileSync(pubspecPath, 'utf8');
pubspec = pubspec.replace(/version: 1\.0\.265\+265/, 'version: 1.0.266+266');
fs.writeFileSync(pubspecPath, pubspec, 'utf8');
console.log('Updated pubspec.yaml to 1.0.266+266');
