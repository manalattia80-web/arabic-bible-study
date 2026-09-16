void main() {
    String normalize(String text) {
      String t = text.replaceAll(RegExp(r'[\u064B-\u065F\u0670\p{P}]', unicode: true), '');
      t = t.replaceAll(RegExp(r'[???]'), '?');
      t = t.replaceAll('?', '?');
      t = t.replaceAll('?', '?');
      return t;
    }
    String wordToHighlight = '????';
    String fullText = '?? ????? ??? ???? ??????? ??????.';
    final target = normalize(wordToHighlight).trim();
    bool isMatch(String word) {
      String norm = normalize(word);
      if (norm == target) return true;
      const prefixes = ['???', '???', '???', '???', '??', '??', '?', '?', '?', '?', '?'];
      for (final p in prefixes) {
        if (norm.startsWith(p) && norm.substring(p.length) == target) return true;
      }
      const suffixes = ['??', '??', '??', '?', '??', '??', '?'];
      for (final s in suffixes) {
        if (norm.endsWith(s) && norm.substring(0, norm.length - s.length) == target) return true;
      }
      return false;
    }
    final words = fullText.split(' ');
    for (int i = 0; i < words.length; i++) {
      if (isMatch(words[i])) {
        print('MATCH: ' + words[i]);
      } else {
        print('NO MATCH: ' + words[i]);
      }
    }
}
