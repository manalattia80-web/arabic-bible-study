// lib/features/word_study/widgets/strongs_modal.dart
// ─────────────────────────────────────────────────────────────────────────────
// Bottom sheet displaying the full Strong's lexicon entry.
// Shows: original word, transliteration, English + Arabic definitions,
//        root word, morphology, KJV usage, and audio play button.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/word_study_provider.dart';
import '../../../core/services/morphology_service.dart';
import '../../../models/word_mapping.dart';
import '../../../models/strongs_entry.dart';
import 'audio_button.dart';
import '../../../core/services/audio_playback_service.dart';

class StrongsModal extends StatelessWidget {
  final String strongsId;
  final WordMapping? mapping;
  const StrongsModal({super.key, required this.strongsId, this.mapping});

  static String? deduceStrongsId(WordMapping mapping) {
    final sId = mapping.strongsId?.trim();
    if (sId != null && sId.isNotEmpty && sId != '---' && sId != '-') {
      return sId;
    }
    // Never invent Strong's IDs for unlinked Arabic particles/affixes;
    // lexical similarity does not establish token alignment within a verse.
    return null;
  }

  static Future<void> show(BuildContext context, String strongsId, {WordMapping? mapping}) {
    final provider = context.read<WordStudyProvider>();
    String targetId = strongsId.trim();
    if ((targetId.isEmpty || targetId == '---' || targetId == '-') && mapping != null) {
      final deduced = deduceStrongsId(mapping);
      if (deduced != null) {
        targetId = deduced;
      }
    }
    provider.loadStrongsEntry(targetId, mapping: mapping);
    return showModalBottomSheet(
      context:        context,
      isScrollControlled: true,
      useSafeArea:    true,
      builder: (_) => ChangeNotifierProvider.value(
        value: provider,
        child: StrongsModal(strongsId: targetId, mapping: mapping),
      ),
    );
  }

  StrongsEntry _buildFallbackEntry(WordMapping m) {
    final isHebrew = m.isHebrew;
    final ar = m.arWord.replaceAll(RegExp(r'[\u064B-\u065F\u0670]'), '').trim();

    String origWord = (m.origWord.isNotEmpty && m.origWord != '---' && m.origWord != '-')
        ? m.origWord
        : '';
    String transliteration = m.transliterationLat ?? '';
    String definitionAr = '';
    String notesAr = '';
    String sId = m.strongsId?.isNotEmpty == true && m.strongsId != '---'
        ? m.strongsId!
        : (isHebrew ? 'عبري' : 'يوناني');

    final bool hasGrammarNotes = m.grammarNotes != null && m.grammarNotes!.trim().isNotEmpty;
    final bool isSupplied = m.origWord.contains('---') || m.origWord.trim() == '-' || m.origWord.trim() == '—';
    final bool hasArabicDesc = RegExp(r'[\u0600-\u06FF]').hasMatch(m.origWord) && !isSupplied;

    if (hasGrammarNotes) {
      origWord = (m.origWord.isNotEmpty && m.origWord != '---' && m.origWord != '-') ? m.origWord : '—';
      transliteration = m.relationType != null && m.relationType!.isNotEmpty
          ? 'دلالة نحوية (${m.relationType})'
          : 'دلالة نحوية / تركيبية';
      definitionAr = m.grammarNotes!;
      notesAr = 'تُعبر هذه الكلمة عن دلالة نحوية أو جزء من تركيب لغوي عربي يقابل اللفظ الأصلي في لغة العهد، ولا يُسند إليها رقم سترونج مستقل منعاً للخلط المعجمي.';
      sId = m.strongsId?.isNotEmpty == true && m.strongsId != '---' ? m.strongsId! : 'نحوي';
    } else if (hasArabicDesc) {
      origWord = '—';
      transliteration = 'دلالة نحوية / تركيبية';
      definitionAr = m.origWord;
      notesAr = 'تُعبر هذه الكلمة عن دلالة نحوية أو جزء من تركيب لغوي عربي يقابل اللفظ الأصلي في لغة العهد، ولا يُسند إليها رقم سترونج مستقل منعاً للخلط المعجمي.';
      sId = 'نحوي';
    } else if (isSupplied) {
      origWord = '—';
      transliteration = 'مُضافة في الترجمة';
      definitionAr = 'كلمة أو أداة مضافة في الترجمة العربية لاقتضاء صياغة المعنى واستقامة التركيب، ولا يقابلها لفظ مستقل بذاته في النص الأصلي.';
      notesAr = 'تقتضي قواعد اللغة العربية في مواضع عدة إظهار روابط أو ضمائر أو أفعال كينونة مقدرة في الجملة الاسمية في اللغتين العبرية واليونانية ليستقيم البناء النحوي العربي.';
      sId = 'مُضافة';
    } else if (ar == 'لم') {
      origWord = origWord.isNotEmpty ? origWord : '—';
      transliteration = 'أداة نفي وجزم';
      definitionAr = 'أداة نفي وجزم في الصياغة العربية، ترد لنفي الفعل الماضي أو ضمن تركيب نفي عربي.';
      notesAr = 'في التراكيب المندمجة، قد تقابل العبارة العربية كلمة نفي أصلية واحدة، ولا يُسند إلى الأداة رقم سترونج مستقل إلا عند ثبوت المقابل اللفظي المباشر في الآية.';
      sId = 'نحوي';
    } else if (ar == 'في') {
      origWord = origWord.isNotEmpty ? origWord : (isHebrew ? 'בְּ' : '—');
      transliteration = transliteration.isNotEmpty ? transliteration : (isHebrew ? 'bᵉ (باء الظرفية)' : 'حرف جر');
      definitionAr = isHebrew
          ? 'حرف جر عبري متصل (בְּ) يفيد الظرفية المكانية أو الزمانية أو السببية، يلحق صدراً بالكلمات في النص العبري.'
          : 'حرف جر في الصياغة العربية لأداء معنى الظرفية أو التعدية بحسب مقتضى التركيب.';
      notesAr = isHebrew
          ? 'تتصل باء الجر العبرية مباشرة بالاسم أو الضمير المتصل كبادئة، ولا تحمل رقم سترونج معجميًا مستقلاً.'
          : 'لا يُسند إليها رقم سترونج مستقل في هذا الموضع لعدم ورود مقابل معجمي منفصل لها في النص اليوناني للآية.';
      sId = 'نحوي';
    } else if (ar == 'و' || ar == 'ثم' || ar == 'واما' || ar == 'ف') {
      origWord = origWord.isNotEmpty ? origWord : (isHebrew ? 'וְ' : '—');
      transliteration = transliteration.isNotEmpty ? transliteration : (isHebrew ? 'wᵉ (واو العطف)' : 'أداة عطف / ربط');
      definitionAr = isHebrew
          ? 'واو العطف والاستئناف في اللغة العبرية (וְ)، تُلحق صدراً بالكلمة لربط الجمل وتتابع الأحداث.'
          : 'أداة عطف واستئناف في الصياغة العربية لربط الجمل وتتابع السياق.';
      notesAr = 'تُستخدم للربط النحوي بين الكلمات والجمل دون مدخل سترونج مستقل.';
      sId = 'نحوي';
    } else if (ar == 'له' || ar == 'لهم' || ar == 'لي' || ar == 'لك' || ar == 'لنا' || ar == 'بها' || ar == 'به' || ar == 'بهم') {
      origWord = origWord.isNotEmpty ? origWord : '—';
      transliteration = transliteration.isNotEmpty ? transliteration : 'جار ومجرور (حرف جر + ضمير)';
      definitionAr = 'شبه جملة تتكون من حرف جر ملحق به ضمير متصل مبني يعود على المذكور في السياق.';
      notesAr = 'تُعبر اللغات الأصلية عن هذه الدلالة إما ببادئة حرف جر متصلة بضمير أو بحالة إعرابية (كالقابل في اليونانية)، دون رقم سترونج مستقل للحرف المتصل.';
      sId = 'نحوي';
    } else if (ar == 'قد') {
      origWord = origWord.isNotEmpty ? origWord : '—';
      transliteration = 'حرف تحقيق';
      definitionAr = 'حرف تحقيق في الصياغة العربية للدلالة على تمام وقوع الفعل وثبوته.';
      notesAr = 'يؤدي في الترجمة دلالة صيغة الفعل التام في اللغة الأصلية ولا يقابله لفظ معجمي مستقل.';
      sId = 'نحوي';
    } else if (ar == 'ان' || ar == 'إن' || ar == 'أن') {
      origWord = origWord.isNotEmpty ? origWord : '—';
      transliteration = 'أداة ربط / مصدرية';
      definitionAr = 'أداة ربط أو نصب ومصدرية في التركيب العربي لسبك الجملة أو ربط مقول القول.';
      notesAr = 'تقتضيها الصياغة العربية في هذا الموضع (مثل سبك المصدر أو جواب الظرف)، ولا يُسند إليها رقم سترونج دون وجود أداة مقابلة صريحة في موضعها من النص الأصلي.';
      sId = 'نحوي';
    } else if (ar == 'لا' || ar == 'ما' || ar == 'لن') {
      origWord = origWord.isNotEmpty ? origWord : '—';
      transliteration = 'أداة نفي';
      definitionAr = 'أداة نفي في الصياغة العربية.';
      notesAr = 'يُرجع في تحليلها إلى تركيب الجملة في الآية دون افتراض رقم سترونج غير موثّق.';
      sId = 'نحوي';
    } else {
      origWord = origWord.isNotEmpty ? origWord : m.arWord;
      transliteration = transliteration.isNotEmpty ? transliteration : m.arWord;
      definitionAr = 'مفردة لغوية واردة في نص الآية (الترجمة العربية: "${m.arWord}").';
      notesAr = 'يُعرض أدناه التحليل النحوي والصرفي المتاح لهذه المفردة بحسب لغتها وسياقها في الآية.';
      sId = 'نحوي';
    }

    return StrongsEntry(
      strongsId:             sId,
      language:              m.origWordLang,
      originalWord:          origWord,
      transliteration:       transliteration,
      definitionEn:          'Biblical text word: ${m.arWord}',
      definitionAr:          definitionAr,
      notesAr:               notesAr,
      lexicalDefAr:          definitionAr,
      contextualUsageAr:     notesAr,
      editorialCommentaryAr: null,
      arIsVerified:          false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WordStudyProvider>();
    final entry    = provider.selectedStrongs ?? (mapping != null ? _buildFallbackEntry(mapping!) : null);

    return DraggableScrollableSheet(
      initialChildSize: 0.65,
      maxChildSize:     0.95,
      minChildSize:     0.4,
      expand:           false,
      builder: (ctx, scrollCtrl) => Container(
        decoration: BoxDecoration(
          color: AppColors.bgCard,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: CustomScrollView(
          controller: scrollCtrl,
          slivers: [
            // Drag handle
            SliverToBoxAdapter(
              child: Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 12),
                  width: 36, height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.borderLight,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ),

            // Loading state
            if (provider.loadingStrongs)
              SliverFillRemaining(
                child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)),
              )
            else if (entry == null)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.search_off_rounded, size: 48, color: AppColors.textMuted),
                        const SizedBox(height: 12),
                        Text(
                          'لم يتم العثور على دراسة لهذه الكلمة',
                          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else ...[
              // ── Header ─────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Big original word
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'المدخل المعجمي / الجذر',
                              style: TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Directionality(
                              textDirection: entry.isHebrew ? TextDirection.rtl : TextDirection.ltr,
                              child: Text(
                                entry.originalWord,
                                style: entry.isHebrew
                                    ? AppTheme.hebrewText(size: 36)
                                    : AppTheme.greekText(size: 32),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Strong's ID badge
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color:        entry.isHebrew
                                  ? AppColors.hebrewText.withOpacity(0.12)
                                  : AppColors.greekText.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(100),
                              border: Border.all(
                                color: entry.isHebrew
                                    ? AppColors.hebrewText.withOpacity(0.4)
                                    : AppColors.greekText.withOpacity(0.4),
                              ),
                            ),
                            child: Text(
                              entry.strongsId,
                              style: TextStyle(
                                color: entry.isHebrew ? AppColors.hebrewText : AppColors.greekText,
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          _langBadge(entry.language),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // Transliteration + Pronunciation + Audio (on a dedicated separate line)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Line 1: Transliteration and Pronunciation
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          if (entry.transliteration.isNotEmpty)
                            Text(
                              entry.transliteration,
                              style: TextStyle(
                                color:      AppColors.textSecondary,
                                fontSize:   16,
                                fontStyle:  FontStyle.italic,
                              ),
                            ),
                          if (entry.pronunciation != null && entry.pronunciation!.trim().isNotEmpty && entry.pronunciation!.trim() != entry.transliteration.trim()) ...[
                            Text('•', style: TextStyle(color: AppColors.textMuted)),
                            Text(
                              entry.pronunciation!,
                              style: TextStyle(color: AppColors.textMuted, fontSize: 14),
                            ),
                          ],
                          if (entry.pronunciationAr != null && entry.pronunciationAr!.trim().isNotEmpty) ...[
                            Text('•', style: TextStyle(color: AppColors.textMuted)),
                            Directionality(
                              textDirection: TextDirection.rtl,
                              child: Text(
                                _cleanPronunciationAr(entry.pronunciationAr!, entry.transliteration),
                                style: AppTheme.arabicVerse(size: 19, color: AppColors.arabicText),
                              ),
                            ),
                          ],
                        ],
                      ),
                      // Line 2: Audio Button and Verification Badge on a separate line
                      if (entry.originalWord.isNotEmpty &&
                          entry.originalWord != '—' &&
                          !RegExp(r'[\u0600-\u06FF]').hasMatch(entry.originalWord)) ...[
                        const SizedBox(height: 10),
                        Builder(
                          builder: (context) {
                            final validStrongs = RegExp(r'^[HG]\d+$', caseSensitive: false).hasMatch(entry.strongsId)
                                ? entry.strongsId
                                : null;
                            final isAuthenticAram = AudioPlaybackService.instance.isAuthenticAramaic(validStrongs);
                            return Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                AudioButton(
                                  strongsId: validStrongs,
                                  word: entry.originalWord,
                                  lang: entry.isAramaic ? 'aramaic' : entry.language,
                                  url: entry.audioUrl,
                                  tooltip: entry.isAramaic
                                      ? (isAuthenticAram
                                          ? 'استماع: تسجيل بشري — قيد المراجعة (${validStrongs ?? entry.originalWord})'
                                          : 'النطق الآرامي غير متاح حاليًا')
                                      : (validStrongs != null
                                          ? 'استماع: نطق آلي تقريبي للمدخل المعجمي ($validStrongs)'
                                          : 'استماع: نطق آلي تقريبي للصيغة الأصلية'),
                                ),
                                const SizedBox(width: 8),
                                _buildAudioBadge(entry),
                              ],
                            );
                          },
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              // Root word
              if (entry.rootWord != null)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 6, 20, 0),
                    child: Row(
                      children: [
                        Text('Root: ', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                        Directionality(
                          textDirection: entry.isHebrew ? TextDirection.rtl : TextDirection.ltr,
                          child: Text(
                            entry.rootWord!,
                            style: entry.isHebrew
                                ? AppTheme.hebrewText(size: 16)
                                : AppTheme.greekText(size: 14),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // ── 1. التحليل النحوي والصرفي الكامل (Morphology & Syntax Analysis) ──
              Builder(
                builder: (context) {
                  final effectiveOrig = (mapping?.origWord != null && mapping!.origWord.trim().isNotEmpty && mapping!.origWord != '-' && mapping!.origWord != '—' && !mapping!.origWord.contains('---'))
                      ? mapping!.origWord
                      : entry.originalWord;
                  final effectiveStrongs = (mapping?.strongsId != null && mapping!.strongsId!.trim().isNotEmpty && mapping!.strongsId != '---' && mapping!.strongsId != '-')
                      ? mapping!.strongsId
                      : entry.strongsId;

                  final morphAnalysis = MorphologyService.parse(
                    code: mapping?.origMorphology,
                    language: entry.language,
                    fallbackDefinition: entry.definitionEn,
                    arWord: mapping?.arWord,
                    origWord: effectiveOrig,
                    strongsId: effectiveStrongs,
                  );

                  return SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
                      child: Directionality(
                        textDirection: TextDirection.rtl,
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppColors.bgSurface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withOpacity(0.08),
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                                ),
                                child: Row(
                                  textDirection: TextDirection.rtl,
                                  children: [
                                    Icon(Icons.psychology_outlined, size: 18, color: AppColors.primary),
                                    const SizedBox(width: 8),
                                    const Expanded(
                                      child: Text(
                                        'التحليل النحوي والصرفي',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        morphAnalysis.partOfSpeech,
                                        style: TextStyle(
                                          color: AppColors.primary,
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              ..._buildGrammarTable(morphAnalysis),
                              const SizedBox(height: 4),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),

              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 14),
                  child: Divider(color: AppColors.border),
                ),
              ),

              // ── 3-Layer Word Card Architecture ─────────────────
              // Layer 1: المعنى المعجمي الموثّق
              // Layer 2: معنى الكلمة في الآية والسياق
              // Layer 3: تعليق لاهوتي منفصل وموسوم بأنه «شرح تحريري»
              Builder(
                builder: (context) {
                  final lexicalText = (entry.lexicalDefAr != null && entry.lexicalDefAr!.trim().isNotEmpty)
                      ? entry.lexicalDefAr!.trim()
                      : (entry.definitionAr?.trim() ?? '');
                  final contextualText = (entry.contextualUsageAr != null && entry.contextualUsageAr!.trim().isNotEmpty)
                      ? entry.contextualUsageAr!.trim()
                      : (entry.notesAr?.trim() ?? '');
                  final editorialText = entry.editorialCommentaryAr?.trim() ?? '';
                  final hasEnLexicon = entry.definitionEn.isNotEmpty &&
                      !entry.definitionEn.startsWith('Biblical text word:');
                  final hasKjv = entry.kjvUsage != null && entry.kjvUsage!.trim().isNotEmpty;
                  final verseNote = mapping?.grammarNotes?.trim() ?? '';
                  final showVerseBox = mapping != null &&
                      (verseNote.isNotEmpty || RegExp(r'^[HG]\d+$', caseSensitive: false).hasMatch(entry.strongsId));
                  final isDuplicateFallbackNote = verseNote.isNotEmpty && verseNote == lexicalText;

                  return SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // ── 1. المعنى المعجمي الموثّق ──────────────────────
                          if (lexicalText.isNotEmpty || hasEnLexicon)
                            Directionality(
                              textDirection: TextDirection.rtl,
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: AppColors.bgSurface,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(Icons.menu_book_rounded, size: 16, color: AppColors.primary),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            hasEnLexicon ? 'المعنى المعجمي الموثّق' : 'التعريف اللغوي والنحوي',
                                            style: TextStyle(
                                              color: AppColors.primary,
                                              fontSize: 13.5,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                        if (entry.arIsVerified)
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: AppColors.success.withOpacity(0.12),
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: AppColors.success.withOpacity(0.35)),
                                            ),
                                            child: const Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(Icons.verified, color: AppColors.success, size: 12),
                                                SizedBox(width: 4),
                                                Text(
                                                  'مُراجع معجميًا',
                                                  style: TextStyle(
                                                    color: AppColors.success,
                                                    fontSize: 10.5,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                      ],
                                    ),
                                    if (lexicalText.isNotEmpty) ...[
                                      const SizedBox(height: 8),
                                      Text(
                                        lexicalText,
                                        style: AppTheme.arabicVerse(size: 20, color: AppColors.arabicText),
                                        textAlign: TextAlign.right,
                                      ),
                                    ],
                                    if (hasEnLexicon) ...[
                                      const SizedBox(height: 10),
                                      Divider(color: AppColors.borderLight.withOpacity(0.6), height: 14),
                                      Directionality(
                                        textDirection: TextDirection.ltr,
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Strong\'s Lexicon (${entry.strongsId})',
                                              style: TextStyle(
                                                color: AppColors.textMuted,
                                                fontSize: 11,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              entry.definitionEn,
                                              style: TextStyle(
                                                color: AppColors.textSecondary,
                                                fontSize: 13.5,
                                                height: 1.55,
                                              ),
                                            ),
                                            if (hasKjv) ...[
                                              const SizedBox(height: 6),
                                              Text(
                                                'KJV Usage: ${entry.kjvUsage!}',
                                                style: TextStyle(
                                                  color: AppColors.textMuted,
                                                  fontSize: 12,
                                                  fontStyle: FontStyle.italic,
                                                  height: 1.5,
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ),

                          // ── 2. معنى الكلمة في الآية والسياق الكتابي ─────────
                          if (showVerseBox || contextualText.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Directionality(
                              textDirection: TextDirection.rtl,
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: AppColors.bgSurface,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(Icons.translate_rounded, size: 16, color: AppColors.info),
                                        const SizedBox(width: 6),
                                        const Expanded(
                                          child: Text(
                                            'معنى الكلمة في الآية والسياق الكتابي',
                                            style: TextStyle(
                                              color: AppColors.info,
                                              fontSize: 13.5,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (showVerseBox) ...[
                                      const SizedBox(height: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                        decoration: BoxDecoration(
                                          color: AppColors.info.withOpacity(0.08),
                                          borderRadius: BorderRadius.circular(10),
                                          border: Border.all(color: AppColors.info.withOpacity(0.25)),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.stretch,
                                          children: [
                                            Wrap(
                                              spacing: 6,
                                              runSpacing: 4,
                                              crossAxisAlignment: WrapCrossAlignment.center,
                                              children: [
                                                const Text(
                                                  'في هذه الآية:',
                                                  style: TextStyle(
                                                    color: AppColors.info,
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                                Text(
                                                  '«${mapping!.arWord}»',
                                                  style: TextStyle(
                                                    color: AppColors.textPrimary,
                                                    fontSize: 15,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                                if (mapping!.origWord.trim().isNotEmpty &&
                                                    mapping!.origWord != '---' &&
                                                    mapping!.origWord != '-' &&
                                                    mapping!.origWord != '—')
                                                  Text(
                                                    '(${mapping!.origWord})',
                                                    style: TextStyle(
                                                      color: AppColors.textSecondary,
                                                      fontSize: 13.5,
                                                    ),
                                                  ),
                                                if (mapping!.origWordPosition > 0)
                                                  Text(
                                                    '• موضع الأصل: ${mapping!.origWordPosition}',
                                                    style: TextStyle(
                                                      color: AppColors.textMuted,
                                                      fontSize: 11.5,
                                                    ),
                                                  ),
                                              ],
                                            ),
                                            if (verseNote.isNotEmpty && !isDuplicateFallbackNote) ...[
                                              const SizedBox(height: 6),
                                              Text(
                                                verseNote,
                                                style: TextStyle(
                                                  color: AppColors.textPrimary,
                                                  fontSize: 14.5,
                                                  height: 1.55,
                                                ),
                                                textAlign: TextAlign.right,
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                    ],
                                    if (contextualText.isNotEmpty) ...[
                                      const SizedBox(height: 8),
                                      Text(
                                        contextualText,
                                        style: TextStyle(
                                          color: AppColors.textSecondary,
                                          fontSize: 16,
                                          height: 1.65,
                                        ),
                                        textAlign: TextAlign.right,
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                          ],

                          // ── 3. تعليق لاهوتي منفصل وموسوم بأنه «شرح تحريري» ──
                          if (editorialText.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Directionality(
                              textDirection: TextDirection.rtl,
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF59E0B).withOpacity(0.06),
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: const Color(0xFFF59E0B).withOpacity(0.35),
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.edit_note_rounded,
                                          size: 18,
                                          color: Color(0xFFF59E0B),
                                        ),
                                        const SizedBox(width: 6),
                                        const Expanded(
                                          child: Text(
                                            'تعليق لاهوتي وتفسيري',
                                            style: TextStyle(
                                              color: Color(0xFFF59E0B),
                                              fontSize: 13.5,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF59E0B).withOpacity(0.16),
                                            borderRadius: BorderRadius.circular(100),
                                            border: Border.all(
                                              color: const Color(0xFFF59E0B).withOpacity(0.45),
                                            ),
                                          ),
                                          child: const Text(
                                            'شرح تحريري',
                                            style: TextStyle(
                                              color: Color(0xFFF59E0B),
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'تعليق تحريري مستقل يعبّر عن القراءة التفسيرية للتطبيق، وليس جزءًا من تعريف قاموس سترونج المعجمي.',
                                      style: TextStyle(
                                        color: AppColors.textMuted,
                                        fontSize: 11,
                                        fontStyle: FontStyle.italic,
                                        height: 1.4,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      editorialText,
                                      style: TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 15.5,
                                        height: 1.65,
                                      ),
                                      textAlign: TextAlign.right,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
              // Occurrences
              if (provider.loadingOccurrences)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 24),
                    child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                  ),
                )
              else if (provider.occurrences.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                    child: _Section(
                      label: 'أماكن أخرى ظهرت فيها الكلمة',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: provider.occurrences.take(15).map((occ) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.bgCardHov,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Directionality(
                                    textDirection: TextDirection.rtl,
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          occ.bookNameAr,
                                          style: TextStyle(
                                            color: AppColors.primary,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                          ),
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          '${occ.chapterNum}',
                                          style: TextStyle(
                                            color: AppColors.primary,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                          ),
                                        ),
                                        Text(
                                          ':',
                                          style: TextStyle(
                                            color: AppColors.primary,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                          ),
                                        ),
                                        Text(
                                          '${occ.verseNum}',
                                          style: TextStyle(
                                            color: AppColors.primary,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Directionality(
                                    textDirection: TextDirection.rtl,
                                    child: RichText(
                                      textAlign: TextAlign.right,
                                      text: TextSpan(
                                        style: AppTheme.arabicVerse(size: 20, color: AppColors.textSecondary),
                                        children: _highlightWord(occ.textAvdAr, occ.arWord),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ),

              const SliverToBoxAdapter(child: SizedBox(height: 40)),
            ],
          ],
        ),
      ),
    );
  }

  String _cleanPronunciationAr(String pronAr, String transliteration) {
    if (pronAr.trim().isEmpty) return '';
    if (transliteration.trim().isNotEmpty) {
      // Strip redundant Latin/Greek text inside parentheses, e.g. "إيريتس (Erets)" -> "إيريتس"
      final stripped = pronAr.replaceAll(RegExp(r'\s*\([A-Za-z0-9\s/,._\u0370-\u03FF\u1F00-\u1FFF-]+\)'), '').trim();
      if (stripped.isNotEmpty) return stripped;
    }
    return pronAr.trim();
  }

  Widget _buildAudioBadge(StrongsEntry entry) {
    final bool isAuthenticAramaic = AudioPlaybackService.instance.isAuthenticAramaic(entry.strongsId);
    final bool isAramaic = entry.isAramaic;

    Color bg;
    Color textColor;
    String label;
    IconData icon;

    if (isAramaic) {
      if (isAuthenticAramaic) {
        bg = const Color(0xFF1E3A2B);
        textColor = const Color(0xFF4ADE80);
        label = 'تسجيل بشري — قيد المراجعة';
        icon = Icons.record_voice_over_rounded;
      } else {
        bg = const Color(0xFF2D2D2D);
        textColor = const Color(0xFF9E9E9E);
        label = 'النطق الآرامي غير متاح حاليًا';
        icon = Icons.volume_off_rounded;
      }
    } else {
      bg = const Color(0xFF1E293B);
      textColor = const Color(0xFF94A3B8);
      label = 'نطق آلي تقريبي للمدخل المعجمي';
      icon = Icons.smart_toy_outlined;
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

  List<TextSpan> _highlightWord(String fullText, String wordToHighlight) {
    if (wordToHighlight.isEmpty) return [TextSpan(text: fullText)];

    String normalize(String text) {
      String t = text.replaceAll(RegExp(r'[\u064B-\u065F\u0670\p{P}]', unicode: true), '');
      // Normalize Alefs, Taa Marbuta, and Alif Maqsura for robust matching
      t = t.replaceAll(RegExp(r'[أإآ]'), 'ا');
      t = t.replaceAll('ة', 'ه');
      t = t.replaceAll('ى', 'ي');
      return t;
    }

    final String target = normalize(wordToHighlight).trim();
    if (target.isEmpty) return [TextSpan(text: fullText)];

    bool isMatch(String word) {
      String norm = normalize(word);
      if (norm == target) return true;
      
      const prefixes = ['وال', 'فال', 'بال', 'كال', 'لل', 'ال', 'و', 'ف', 'ب', 'ك', 'ل'];
      for (final p in prefixes) {
        if (norm.startsWith(p) && norm.substring(p.length) == target) return true;
      }
      
      const suffixes = ['هم', 'كم', 'ها', 'ه', 'ني', 'نا', 'ي'];
      for (final s in suffixes) {
        if (norm.endsWith(s) && norm.substring(0, norm.length - s.length) == target) return true;
      }
      return false;
    }

    final spans = <TextSpan>[];
    final words = fullText.split(' ');
    
    for (int i = 0; i < words.length; i++) {
      if (isMatch(words[i])) {
        spans.add(TextSpan(
          text: words[i],
          style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
        ));
      } else {
        spans.add(TextSpan(text: words[i]));
      }

      if (i < words.length - 1) {
        spans.add(const TextSpan(text: ' '));
      }
    }
    
    return spans;
  }

  Widget _langBadge(String lang) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
    decoration: BoxDecoration(
      color:        AppColors.bgSurface,
      borderRadius: BorderRadius.circular(100),
      border:       Border.all(color: AppColors.border),
    ),
    child: Text(
      lang[0].toUpperCase() + lang.substring(1),
      style: TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w600),
    ),
  );

  List<Widget> _buildGrammarTable(MorphologyAnalysis m) {
    final rows = <({String label, String value, bool isMonospace})>[];

    rows.add((label: 'نوع الكلمة (القسم اللغوي)', value: m.partOfSpeech, isMonospace: false));

    if (m.stem != null && m.stem!.isNotEmpty) {
      rows.add((label: 'الوزن الصرفي العبري', value: m.stem!, isMonospace: false));
    }
    if (m.tense != null && m.tense!.isNotEmpty) {
      rows.add((label: 'نوع الفعل والزمن', value: m.tense!, isMonospace: false));
    }
    if (m.voice != null && m.voice!.isNotEmpty) {
      rows.add((label: 'البناء للمعلوم / المجهول', value: m.voice!, isMonospace: false));
    }
    if (m.mood != null && m.mood!.isNotEmpty) {
      rows.add((label: 'الصيغة التعبيرية', value: m.mood!, isMonospace: false));
    }
    if (m.grammaticalCase != null && m.grammaticalCase!.isNotEmpty) {
      rows.add((label: 'الحالة الإعرابية', value: m.grammaticalCase!, isMonospace: false));
    }
    if (m.gender != null && m.gender!.isNotEmpty) {
      rows.add((label: 'الجنس (مذكر / مؤنث / محايد)', value: m.gender!, isMonospace: false));
    }
    if (m.number != null && m.number!.isNotEmpty) {
      rows.add((label: 'العدد (مفرد / مثنى / جمع)', value: m.number!, isMonospace: false));
    }
    if (m.person != null && m.person!.isNotEmpty) {
      rows.add((label: 'ضمير الفاعل / الشخص', value: m.person!, isMonospace: false));
    }
    if (m.prefixes.isNotEmpty) {
      rows.add((label: 'الحروف والزوائد المتصلة', value: m.prefixes.join(' · '), isMonospace: false));
    }
    if (m.rawCode.isNotEmpty) {
      rows.add((label: 'الرمز القياسي', value: m.rawCode, isMonospace: true));
    }

    return [
      for (int i = 0; i < rows.length; i++)
        _GrammarRow(
          label: rows[i].label,
          value: rows[i].value,
          isFirst: i == 0,
          isEven: i % 2 == 1,
          isMonospace: rows[i].isMonospace,
        ),
    ];
  }
}

// ── Section label + content ────────────────────────────────────────────────
class _Section extends StatelessWidget {
  final String label;
  final Widget child;
  const _Section({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color:      AppColors.primary,
            fontSize:   10,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}

class _GrammarRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isEven;
  final bool isFirst;
  final bool isMonospace;

  const _GrammarRow({
    required this.label,
    required this.value,
    this.isEven = false,
    this.isFirst = false,
    this.isMonospace = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isEven ? AppColors.primary.withOpacity(0.04) : Colors.transparent,
        border: Border(
          top: BorderSide(
            color: isFirst ? Colors.transparent : AppColors.borderLight.withOpacity(0.7),
            width: 0.8,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            flex: 5,
            child: Text(
              label,
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 5,
            child: Text(
              value,
              textAlign: TextAlign.left,
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
                fontFamily: isMonospace ? 'monospace' : null,
              ),
            ),
          ),
        ],
      ),
    );
  }

  
}
