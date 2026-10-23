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
    final isHebrew = mapping.isHebrew;
    final ar = mapping.arWord.replaceAll(RegExp(r'[\u064B-\u065F\u0670]'), '').trim();

    if (ar == 'من') return isHebrew ? 'H4480' : 'G1537';
    if (ar == 'الى' || ar == 'إلى') return isHebrew ? 'H413' : 'G1519';
    if (ar == 'على') return isHebrew ? 'H5921' : 'G1909';
    if (ar == 'في' && !isHebrew) return 'G1722';
    if (ar == 'و' && !isHebrew) return 'G2532';
    if (ar == 'ان' || ar == 'إن' || ar == 'أن') return isHebrew ? 'H3588' : 'G3754';
    if (ar == 'لا' || ar == 'ما') return isHebrew ? 'H3808' : 'G3756';

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
      origWord = origWord.isNotEmpty ? origWord : (isHebrew ? 'לֹא / טֶרֶם' : 'οὐ / οὐδείς');
      transliteration = 'Negative particle (نفي وجزم)';
      definitionAr = 'أداة نفي وجزم عربية، ترد لنفي الفعل الماضي أو كجزء من تركيب نفي عربي يقابل كلمة أصلية واحدة مثل (οὐδείς = لم يره أحد).';
      notesAr = 'في التراكيب المندمجة، تُترجم العبارة العربية المكونة من (لم + اسم) كلمة نفي أصلية واحدة، ولا يقابل أداة النفي مدخل معجمي مستقل.';
      sId = isHebrew ? 'NEG-HEB' : 'NEG-GRK';
    } else if (ar == 'في') {
      origWord = origWord.isNotEmpty ? origWord : (isHebrew ? 'בְּ' : 'ἐν');
      transliteration = transliteration.isNotEmpty ? transliteration : (isHebrew ? 'bᵉ (باء الظرفية)' : 'en');
      definitionAr = isHebrew
          ? 'حرف جر عبري أصيل يفيد الظرفية والمكانية، يلحق صدراً بالكلمات في النص العبري.'
          : 'حرف جر يوناني أساسي يفيد الاستقرار والثبات في المكان أو الزمان.';
      notesAr = isHebrew
          ? 'تتصل باء الجر العبرية مباشرة بالاسم المجرور كبادئة متصلة، وتترجم في العربية بـ (فِي).'
          : 'يأتي بعده الاسم مجروراً بحالة القابل (Dative) للدلالة على الظرفية المكانية أو الزمانية أو المجازية.';
      sId = isHebrew ? 'PREP-HEB' : 'G1722';
    } else if (ar == 'و' || ar == 'ثم' || ar == 'واما' || ar == 'ف') {
      origWord = origWord.isNotEmpty ? origWord : (isHebrew ? 'וְ' : 'καί');
      transliteration = transliteration.isNotEmpty ? transliteration : (isHebrew ? 'wᵉ (واو العطف)' : 'kai');
      definitionAr = isHebrew
          ? 'واو العطف والاستئناف في اللغة العبرية، تُلحق صدراً بالكلمة لربط الجمل وتتابع الأحداث.'
          : 'أداة ربط يونانية أساسية تفيد العطف والمعية والمصاحبة بين المفردات والجمل.';
      notesAr = 'تُستخدم للربط بين الكلمات والجمل وتتابع السرد التاريخي واللغوي في النص الكتابي.';
      sId = isHebrew ? 'CONJ-HEB' : 'G2532';
    } else if (ar == 'له' || ar == 'لهم' || ar == 'لي' || ar == 'لك' || ar == 'لنا' || ar == 'بها' || ar == 'به' || ar == 'بهم') {
      origWord = origWord.isNotEmpty ? origWord : (isHebrew ? 'לְ / בְּ + ضمير' : 'حرف + ضمير');
      transliteration = transliteration.isNotEmpty ? transliteration : 'Preposition + Suffix';
      definitionAr = 'شبه جملة تتكون من حرف جر ملحق به ضمير متصل مبني يعود على المذكور في السياق.';
      notesAr = 'تُعبر التراكيب الأصلية في العبرية واليونانية عن المفعول به غير المباشر أو الملكية بإلحاق الضمير الشخصي بحرف الجر.';
      sId = isHebrew ? 'PRON-HEB' : 'PRON-GRK';
    } else if (ar == 'قد') {
      origWord = origWord.isNotEmpty ? origWord : (isHebrew ? 'صيغة التمام (Perfect)' : 'ماضٍ تام (Aorist)');
      transliteration = 'Particle of completion';
      definitionAr = 'حرف تحقيق وتوكيد باللغة العربية، أضافه المترجم للدلالة على تمام وقوع الفعل وثبوته.';
      notesAr = 'يقابل في الأصل العبري صيغة الماضي التام (Qal Perfect) الدالة على وقوع الفعل واكتماله نحويًا.';
      sId = 'PARTICLE';
    } else if (ar == 'ان' || ar == 'إن' || ar == 'أن') {
      origWord = origWord.isNotEmpty ? origWord : (isHebrew ? 'כִּי' : 'ὅτι');
      transliteration = transliteration.isNotEmpty ? transliteration : (isHebrew ? 'ki' : 'hoti');
      definitionAr = 'أداة ربط وتوكيد وتعليل، تفيد بيان السبب أو الربط التقريري بين الجمل.';
      notesAr = 'تفتتح الجمل الخبرية والتعليلية لبيان سبب أو مضمون القول.';
      sId = isHebrew ? 'H3588' : 'G3754';
    } else if (ar == 'لا' || ar == 'ما' || ar == 'لن') {
      origWord = origWord.isNotEmpty ? origWord : (isHebrew ? 'לֹא' : 'οὐ');
      transliteration = transliteration.isNotEmpty ? transliteration : (isHebrew ? 'lo' : 'ou');
      definitionAr = 'أداة نفي جازمة لنفي الفعل أو التقرير في النص الأصلي.';
      notesAr = 'تفيد نفي الفعل أو الحدث في سياق الجملة الإسنادية.';
      sId = isHebrew ? 'H3808' : 'G3756';
    } else {
      origWord = origWord.isNotEmpty ? origWord : m.arWord;
      transliteration = transliteration.isNotEmpty ? transliteration : m.arWord;
      definitionAr = 'مفردة لغوية واردة في نص الآية (الترجمة العربية: "${m.arWord}").';
      notesAr = 'يُعرض أدناه التحليل النحوي والصرفي المتاح لهذه المفردة بحسب لغتها وسياقها في الآية.';
    }

    return StrongsEntry(
      strongsId:       sId,
      language:        m.origWordLang,
      originalWord:    origWord,
      transliteration: transliteration,
      definitionEn:    'Biblical text word: ${m.arWord}',
      definitionAr:    definitionAr,
      notesAr:         notesAr,
      arIsVerified:    true,
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
                      if (entry.originalWord.isNotEmpty && entry.originalWord != '—') ...[
                        const SizedBox(height: 10),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            AudioButton(
                              strongsId: entry.strongsId,
                              word: entry.originalWord,
                              lang: entry.isAramaic ? 'aramaic' : entry.language,
                              url: entry.audioUrl,
                              tooltip: entry.isAramaic
                                  ? 'النطق الآرامي غير متاح حاليًا'
                                  : 'استماع: نطق آلي تقريبي للمدخل المعجمي (${entry.strongsId})',
                            ),
                            const SizedBox(width: 8),
                            _buildAudioBadge(entry),
                          ],
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

              // ── Arabic Definition (if available) ───────────────
              if (entry.hasArabicDef) ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                    child: _Section(
                      label: 'الشرح والتحليل اللغوي',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (entry.definitionAr != null) ...[
                            Directionality(
                              textDirection: TextDirection.rtl,
                              child: Row(
                                children: [
                                  Icon(Icons.auto_stories, size: 15, color: AppColors.primary),
                                  const SizedBox(width: 6),
                                  Text(
                                    entry.isHebrew ? 'معنى الجذر العبري والبعد اللاهوتي' : 'معنى الجذر اليوناني والبعد اللاهوتي',
                                    style: TextStyle(
                                      color:      AppColors.primary,
                                      fontSize:   13,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 6),
                            Directionality(
                              textDirection: TextDirection.rtl,
                              child: Text(
                                entry.definitionAr!,
                                style: AppTheme.arabicVerse(size: 22, color: AppColors.arabicText),
                                textAlign: TextAlign.right,
                              ),
                            ),
                          ],
                          if (entry.notesAr != null) ...[
                            const SizedBox(height: 14),
                            Directionality(
                              textDirection: TextDirection.rtl,
                              child: Row(
                                children: [
                                  Icon(Icons.translate, size: 15, color: AppColors.textSecondary),
                                  const SizedBox(width: 6),
                                  Text(
                                    'ملاحظات الاستخدام والترجمات الكتابية',
                                    style: TextStyle(
                                      color:      AppColors.textSecondary,
                                      fontSize:   13,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 6),
                            Directionality(
                              textDirection: TextDirection.rtl,
                              child: Text(
                                entry.notesAr!,
                                style: TextStyle(color: AppColors.textSecondary, fontSize: 17, height: 1.6),
                                textAlign: TextAlign.right,
                              ),
                            ),
                          ],
                          if (entry.arIsVerified || entry.hasArabicDef)
                            const Align(
                              alignment: Alignment.centerRight,
                              child: Padding(
                                padding: EdgeInsets.only(top: 10),
                                child: Directionality(
                                  textDirection: TextDirection.rtl,
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.verified, color: AppColors.success, size: 14),
                                      SizedBox(width: 4),
                                      Text(
                                        'مُدقق لغوياً ومُعتمد',
                                        style: TextStyle(color: AppColors.success, fontSize: 11, fontWeight: FontWeight.w600),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
                    child: Divider(color: AppColors.border),
                  ),
                ),
              ],

              // ── English Definition ─────────────────────────────
              if (entry.definitionEn.isNotEmpty && !entry.definitionEn.startsWith('Biblical text word:'))
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                    child: _Section(
                      label: 'English Definition',
                      child: Text(
                        entry.definitionEn,
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.65),
                      ),
                    ),
                  ),
                ),

              // KJV Usage
              if (entry.kjvUsage != null && entry.kjvUsage!.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                    child: _Section(
                      label: 'KJV Usage',
                      child: Text(
                        entry.kjvUsage!,
                        style: TextStyle(
                          color:      AppColors.textMuted,
                          fontSize:   12,
                          fontStyle:  FontStyle.italic,
                          height:     1.6,
                        ),
                      ),
                    ),
                  ),
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
        label = 'تسجيل آرامي بشري معتمد';
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
