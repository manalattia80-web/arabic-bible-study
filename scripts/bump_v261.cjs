const fs = require('fs');

// 1. Update database_service.dart
const dbServicePath = 'mobile/lib/core/services/database_service.dart';
let dbService = fs.readFileSync(dbServicePath, 'utf8');
dbService = dbService.replace(/bible_study_v23\.db/g, 'bible_study_v24.db');
dbService = dbService.replace(/const targetDbVersion = 23;/, 'const targetDbVersion = 24;');
if (!dbService.includes("'bible_study_v23.db'")) {
  dbService = dbService.replace(
    "'bible_study_v22.db',",
    "'bible_study_v22.db',\r\n        'bible_study_v23.db',"
  );
}
fs.writeFileSync(dbServicePath, dbService, 'utf8');
console.log('database_service.dart updated to targetDbVersion 24 and bible_study_v24.db');

// 2. Update pubspec.yaml
const pubspecPath = 'mobile/pubspec.yaml';
let pubspec = fs.readFileSync(pubspecPath, 'utf8');
pubspec = pubspec.replace(/version: 1\.0\.\d+\+\d+/, 'version: 1.0.261+261');
fs.writeFileSync(pubspecPath, pubspec, 'utf8');
console.log('pubspec.yaml bumped to 1.0.261+261');
