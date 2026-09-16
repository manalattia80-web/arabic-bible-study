
    function normalize(text) {
      let t = text.replace(/[\u064B-\u065F\u0670\p{P}]/gu, '');
      t = t.replace(/[???]/g, '?');
      t = t.replace(/?/g, '?');
      t = t.replace(/?/g, '?');
      return t;
    }
    let wordToHighlight = '????';
    let fullText = '?? ????? ??? ???? ??????? ??????.';
    const target = normalize(wordToHighlight).trim();
    function isMatch(word) {
      let norm = normalize(word);
      if (norm === target) return true;
      const prefixes = ['???', '???', '???', '???', '??', '??', '?', '?', '?', '?', '?'];
      for (const p of prefixes) {
        if (norm.startsWith(p) && norm.substring(p.length) === target) return true;
      }
      const suffixes = ['??', '??', '??', '?', '??', '??', '?'];
      for (const s of suffixes) {
        if (norm.endsWith(s) && norm.substring(0, norm.length - s.length) === target) return true;
      }
      return false;
    }
    const words = fullText.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (isMatch(words[i])) {
        console.log('MATCH: ' + words[i]);
      } else {
        console.log('NO MATCH: ' + words[i]);
      }
    }

