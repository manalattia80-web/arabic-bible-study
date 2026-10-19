// scripts/audit_engine/aramaic_detector.cjs
// Exact Biblical Aramaic boundary detector

function isBiblicalAramaic(bookId, chapterNum, verseNum) {
  // 1. Daniel 2:4b - 7:28
  if (bookId === 27) {
    if (chapterNum === 2 && verseNum >= 4) return true;
    if (chapterNum >= 3 && chapterNum <= 7) return true;
  }
  
  // 2. Ezra 4:8 - 6:18 and 7:12 - 7:26
  if (bookId === 15) {
    if (chapterNum === 4 && verseNum >= 8) return true;
    if (chapterNum === 5) return true;
    if (chapterNum === 6 && verseNum <= 18) return true;
    if (chapterNum === 7 && verseNum >= 12 && verseNum <= 26) return true;
  }
  
  // 3. Jeremiah 10:11
  if (bookId === 24 && chapterNum === 10 && verseNum === 11) {
    return true;
  }
  
  return false;
}

module.exports = {
  isBiblicalAramaic
};
