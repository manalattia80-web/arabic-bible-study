// WCAG 2.1 Relative Luminance and Contrast Ratio calculation
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrast(rgb1, rgb2) {
  const l1 = getLuminance(...rgb1);
  const l2 = getLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const colors = {
  // Light Mode
  lightBgBase: [0xF8, 0xFA, 0xFC],
  lightBgCard: [0xF1, 0xF5, 0xF9],
  lightTextPrimary: [0x0F, 0x17, 0x2A],
  lightTextSecondary: [0x33, 0x41, 0x55],
  lightTextMuted: [0x47, 0x55, 0x69],
  lightPrimaryText: [0x78, 0x35, 0x0F],

  // Dark Mode
  darkBgBase: [0x0B, 0x11, 0x20],
  darkBgCard: [0x11, 0x1B, 0x2E],
  darkTextPrimary: [0xF8, 0xFA, 0xFC],
  darkTextSecondary: [0xCB, 0xD5, 0xE1],
  darkTextMuted: [0x94, 0xA3, 0xB8],
  darkPrimaryText: [0xFD, 0xE6, 0x8A],
};

const results = [];

// Light tests against lightBgBase and lightBgCard
const lightBgs = [['Base (0xF8FAFC)', colors.lightBgBase], ['Card (0xF1F5F9)', colors.lightBgCard]];
const lightFgKeys = [
  ['Primary Text (0x0F172A)', colors.lightTextPrimary],
  ['Secondary Text (0x334155)', colors.lightTextSecondary],
  ['Muted Text (0x475569)', colors.lightTextMuted],
  ['Manuscript Gold Text (0x78350F)', colors.lightPrimaryText],
];

for (const [bgName, bgVal] of lightBgs) {
  for (const [fgName, fgVal] of lightFgKeys) {
    const ratio = getContrast(fgVal, bgVal);
    const passAA = ratio >= 4.5;
    const passAAA = ratio >= 7.0;
    results.push({
      mode: 'Light',
      bg: bgName,
      fg: fgName,
      ratio: ratio.toFixed(2) + ':1',
      passAA,
      passAAA,
    });
  }
}

// Dark tests against darkBgBase and darkBgCard
const darkBgs = [['Base (0x0B1120)', colors.darkBgBase], ['Card (0x111B2E)', colors.darkBgCard]];
const darkFgKeys = [
  ['Primary Text (0xF8FAFC)', colors.darkTextPrimary],
  ['Secondary Text (0xCBD5E1)', colors.darkTextSecondary],
  ['Muted Text (0x94A3B8)', colors.darkTextMuted],
  ['Manuscript Gold Text (0xFDE68A)', colors.darkPrimaryText],
];

for (const [bgName, bgVal] of darkBgs) {
  for (const [fgName, fgVal] of darkFgKeys) {
    const ratio = getContrast(fgVal, bgVal);
    const passAA = ratio >= 4.5;
    const passAAA = ratio >= 7.0;
    results.push({
      mode: 'Dark',
      bg: bgName,
      fg: fgName,
      ratio: ratio.toFixed(2) + ':1',
      passAA,
      passAAA,
    });
  }
}

console.table(results);
const allPass = results.every(r => r.passAA);
console.log(`\nAll text colors meet or exceed WCAG AA 4.5:1: ${allPass}`);
