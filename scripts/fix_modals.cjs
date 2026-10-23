const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// 1. Fix morphology_modal.dart
const morphPath = path.join(root, 'mobile/lib/features/word_study/widgets/morphology_modal.dart');
let morph = fs.readFileSync(morphPath, 'utf8');

if (!morph.includes('audio_playback_service.dart')) {
  morph = morph.replace(
    "import 'audio_button.dart';",
    "import 'audio_button.dart';\nimport '../../../core/services/audio_playback_service.dart';"
  );
}

// Extract _buildAudioBadge
const morphBadgeRegex = /Widget _buildAudioBadge\(WordMapping mapping\) \{[\s\S]*?\n  \}/;
const matchMorph = morph.match(morphBadgeRegex);
if (matchMorph) {
  const badgeCode = matchMorph[0];
  morph = morph.replace(morphBadgeRegex, '');
  // Insert before the closing brace of MorphologyModal, which is right before class _GrammarRow
  morph = morph.replace('class _GrammarRow extends StatelessWidget', badgeCode + '\n}\n\nclass _GrammarRow extends StatelessWidget');
}
fs.writeFileSync(morphPath, morph, 'utf8');
console.log('Fixed morphology_modal.dart');

// 2. Fix strongs_modal.dart
const strPath = path.join(root, 'mobile/lib/features/word_study/widgets/strongs_modal.dart');
let str = fs.readFileSync(strPath, 'utf8');

if (!str.includes('audio_playback_service.dart')) {
  str = str.replace(
    "import 'audio_button.dart';",
    "import 'audio_button.dart';\nimport '../../../core/services/audio_playback_service.dart';"
  );
}

// Fix audio button row in strongs_modal
const lines = str.split(/\r?\n/);
let rowStart = -1;
let rowEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('_buildAudioBadge(')) {
    rowStart = i;
  }
  if (rowStart !== -1 && lines[i].includes('),,')) {
    rowEnd = i;
    break;
  }
}

if (rowStart !== -1 && rowEnd !== -1) {
  const fixedBlock = [
    '                            _buildAudioBadge(entry),',
    '                            const SizedBox(width: 8),',
    '                            AudioButton(',
    '                              strongsId: entry.strongsId,',
    '                              word: entry.originalWord,',
    '                              lang: entry.isAramaic ? \'aramaic\' : entry.language,',
    '                              url: entry.audioUrl,',
    '                              tooltip: entry.isAramaic',
    '                                  ? \'النطق الآرامي معلّق قيد المراجعة\'',
    '                                  : \'استماع للمدخل المعجمي (\x24{entry.strongsId})\',',
    '                            ),'
  ];
  lines.splice(rowStart, rowEnd - rowStart + 1, ...fixedBlock);
  str = lines.join('\n');
}

// Move _buildAudioBadge inside class StrongsModal
const strBadgeRegex = /Widget _buildAudioBadge\(StrongsEntry entry\) \{[\s\S]*?\n  \}/;
const matchStr = str.match(strBadgeRegex);
if (matchStr) {
  const badgeCode = matchStr[0];
  str = str.replace(strBadgeRegex, '');
  str = str.replace('List<TextSpan> _highlightWord', badgeCode + '\n\n  List<TextSpan> _highlightWord');
}

fs.writeFileSync(strPath, str, 'utf8');
console.log('Fixed strongs_modal.dart');
