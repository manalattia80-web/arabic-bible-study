const fs = require('fs');

// 1. Update database_service.dart
const dbServicePath = 'mobile/lib/core/services/database_service.dart';
let dbService = fs.readFileSync(dbServicePath, 'utf8');
dbService = dbService.replace(/bible_study_v21\.db/g, 'bible_study_v22.db');
dbService = dbService.replace(/const targetDbVersion = 21;/, 'const targetDbVersion = 22;');
if (!dbService.includes("'bible_study_v21.db'")) {
  dbService = dbService.replace(
    "'bible_study_v20.db',",
    "'bible_study_v20.db',\r\n        'bible_study_v21.db',"
  );
}
fs.writeFileSync(dbServicePath, dbService, 'utf8');
console.log('database_service.dart updated to targetDbVersion 22 and bible_study_v22.db');

// 2. Update pubspec.yaml
const pubspecPath = 'mobile/pubspec.yaml';
let pubspec = fs.readFileSync(pubspecPath, 'utf8');
pubspec = pubspec.replace(/version: 1\.0\.\d+\+\d+/, 'version: 1.0.259+259');
fs.writeFileSync(pubspecPath, pubspec, 'utf8');
console.log('pubspec.yaml bumped to 1.0.259+259');
