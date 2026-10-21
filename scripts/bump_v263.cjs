const fs = require('fs');

// 1. Update database_service.dart
const dbServicePath = 'mobile/lib/core/services/database_service.dart';
let dbService = fs.readFileSync(dbServicePath, 'utf8');
dbService = dbService.replace(/bible_study_v24\.db/g, 'bible_study_v25.db');
dbService = dbService.replace(/const targetDbVersion = 24;/, 'const targetDbVersion = 25;');
dbService = dbService.replace(/const totalParts = \d+;/, 'const totalParts = 35;');
if (!dbService.includes("'bible_study_v24.db'")) {
  dbService = dbService.replace(
    "'bible_study_v23.db',",
    "'bible_study_v23.db',\n        'bible_study_v24.db',"
  );
}
fs.writeFileSync(dbServicePath, dbService, 'utf8');
console.log('database_service.dart updated to targetDbVersion 25, totalParts 35, and bible_study_v25.db');

// 2. Update pubspec.yaml
const pubspecPath = 'mobile/pubspec.yaml';
let pubspec = fs.readFileSync(pubspecPath, 'utf8');
pubspec = pubspec.replace(/version: 1\.0\.\d+\+\d+/, 'version: 1.0.263+263');
fs.writeFileSync(pubspecPath, pubspec, 'utf8');
console.log('pubspec.yaml bumped to 1.0.263+263');
