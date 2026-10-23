const fs = require('fs');

const strongsModalPath = 'C:\\Users\\manal\\.gemini\\antigravity\\scratch\\arabic-bible-study\\mobile\\lib\\features\\word_study\\widgets\\strongs_modal.dart';
let strongsContent = fs.readFileSync(strongsModalPath, 'utf8');

// 1. In strongs_modal.dart: replace AudioButton call
const oldStrongsAudio = `                      if (entry.originalWord.isNotEmpty && entry.originalWord != '—')
                        AudioButton(
                          strongsId: entry.strongsId,
                          word: entry.originalWord,
                          lang: entry.isAramaic ? 'aramaic' : entry.language,
                          url: entry.audioUrl,
                          tooltip: entry.isAramaic
                              ? 'النطق الآرامي معلّق قيد المراجعة'
                              : 'استماع للمدخل المعجمي (\${entry.strongsId})',
                        ),`;

const newStrongsAudio = `                      if (entry.originalWord.isNotEmpty && entry.originalWord != '—') ...[
                        _buildAudioBadge(entry),
                        const SizedBox(width: 4),
                        AudioButton(
                          strongsId: entry.strongsId,
                          word: entry.originalWord,
                          lang: entry.isAramaic ? 'aramaic' : entry.language,
                          url: entry.audioUrl,
                          tooltip: entry.isAramaic
                              ? 'النطق الآرامي معلّق قيد المراجعة'
                              : 'استماع للمدخل المعجمي (\${entry.strongsId})',
                        ),
                      ],`;

if (strongsContent.includes(oldStrongsAudio)) {
  strongsContent = strongsContent.replace(oldStrongsAudio, newStrongsAudio);
  console.log('Successfully replaced AudioButton in strongs_modal.dart');
} else {
  console.log('Target oldStrongsAudio not found!');
}

// Add _buildAudioBadge to strongs_modal.dart
const strongsBadgeMethod = `
  Widget _buildAudioBadge(StrongsEntry entry) {
    final bool isCataloged = AudioPlaybackService.instance.isStrongsCataloged(entry.strongsId);
    final bool isAramaic = entry.isAramaic;

    Color bg;
    Color textColor;
    String label;
    IconData icon;

    if (isCataloged) {
      bg = const Color(0xFF1E3A2B);
      textColor = const Color(0xFF4ADE80);
      label = isAramaic ? 'نطق آرامي موثق' : (entry.isHebrew ? 'نطق موثق (مسوري)' : 'نطق موثق (إيرازمي)');
      icon = Icons.verified_rounded;
    } else if (isAramaic) {
      bg = const Color(0xFF2D2D2D);
      textColor = const Color(0xFF9E9E9E);
      label = 'آرامي معلّق';
      icon = Icons.volume_off_rounded;
    } else {
      bg = const Color(0xFF3B2F1E);
      textColor = const Color(0xFFFBBF24);
      label = 'نطق تقريبي';
      icon = Icons.auto_awesome_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: textColor.withOpacity(0.35), width: 0.8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: textColor),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}
`;

const lastClosingBrace = strongsContent.lastIndexOf('}');
if (lastClosingBrace !== -1) {
  strongsContent = strongsContent.slice(0, lastClosingBrace) + strongsBadgeMethod;
  fs.writeFileSync(strongsModalPath, strongsContent, 'utf8');
  console.log('Successfully added _buildAudioBadge to strongs_modal.dart');
}

// 2. In morphology_modal.dart
const morphModalPath = 'C:\\Users\\manal\\.gemini\\antigravity\\scratch\\arabic-bible-study\\mobile\\lib\\features\\word_study\\widgets\\morphology_modal.dart';
let morphContent = fs.readFileSync(morphModalPath, 'utf8');

const oldMorphAudio = `                            if (mapping.hasAudio)
                              AudioButton(
                                strongsId: mapping.strongsId,
                                word: mapping.origWord,
                                lang: mapping.origWordLang,
                                url: mapping.audioUrl,
                                tooltip: mapping.isAramaic
                                    ? 'النطق الآرامي معلّق قيد المراجعة'
                                    : (mapping.hasStrongs
                                        ? 'استماع للنطق المعجمي (\${mapping.strongsId})'
                                        : 'استماع لصيغة الكلمة في الآية'),
                              ),`;

const newMorphAudio = `                            if (mapping.hasAudio) ...[
                              _buildAudioBadge(mapping),
                              const SizedBox(width: 4),
                              AudioButton(
                                strongsId: mapping.strongsId,
                                word: mapping.origWord,
                                lang: mapping.origWordLang,
                                url: mapping.audioUrl,
                                tooltip: mapping.isAramaic
                                    ? 'النطق الآرامي معلّق قيد المراجعة'
                                    : (mapping.hasStrongs
                                        ? 'استماع للنطق المعجمي (\${mapping.strongsId})'
                                        : 'استماع لصيغة الكلمة في الآية'),
                              ),
                            ],`;

if (morphContent.includes(oldMorphAudio)) {
  morphContent = morphContent.replace(oldMorphAudio, newMorphAudio);
  console.log('Successfully replaced AudioButton in morphology_modal.dart');
} else {
  console.log('Target oldMorphAudio not found!');
}

const morphBadgeMethod = `
  Widget _buildAudioBadge(WordMapping mapping) {
    final bool isCataloged = AudioPlaybackService.instance.isStrongsCataloged(mapping.strongsId);
    final bool isAramaic = mapping.isAramaic;

    Color bg;
    Color textColor;
    String label;
    IconData icon;

    if (isCataloged) {
      bg = const Color(0xFF1E3A2B);
      textColor = const Color(0xFF4ADE80);
      label = isAramaic ? 'نطق آرامي موثق' : (mapping.isHebrew ? 'نطق موثق (مسوري)' : 'نطق موثق (إيرازمي)');
      icon = Icons.verified_rounded;
    } else if (isAramaic) {
      bg = const Color(0xFF2D2D2D);
      textColor = const Color(0xFF9E9E9E);
      label = 'آرامي معلّق';
      icon = Icons.volume_off_rounded;
    } else {
      bg = const Color(0xFF3B2F1E);
      textColor = const Color(0xFFFBBF24);
      label = 'نطق تقريبي';
      icon = Icons.auto_awesome_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: textColor.withOpacity(0.35), width: 0.8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: textColor),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}
`;

const lastClosingBraceMorph = morphContent.lastIndexOf('}');
if (lastClosingBraceMorph !== -1) {
  morphContent = morphContent.slice(0, lastClosingBraceMorph) + morphBadgeMethod;
  fs.writeFileSync(morphModalPath, morphContent, 'utf8');
  console.log('Successfully added _buildAudioBadge to morphology_modal.dart');
}
