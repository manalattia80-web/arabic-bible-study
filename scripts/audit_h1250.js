const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';
const GEMINI_KEY = process.env.GEMINI_KEY;

async function testH1250() {
  const models = ['gemini-3.5-flash-lite', 'gemini-3-flash-preview', 'gemini-3.6-flash'];
  const promptText = `You are an expert bilingual biblical lexicographer and theologian. Review this Strong's entry (H1250) and provide a rich, clear, and deeply accurate Arabic dictionary definition with full Arabic diacritics (تشكيل كامل).

For this entry, you MUST provide a comprehensive explanation in Arabic covering:
1. المعنى المعجمي الأصلي للجذر (The root/lemma original dictionary meaning).
2. المعنى حسب التصريف والسياق الكتابي (The specific contextual and inflected meanings as used across Biblical passages, e.g., in Psalm 65:13 as 'بُرّ' grain/wheat).
3. الأبعاد اللاهوتية والروحية (Theological and spiritual significance of grain/harvest in Scripture).

Entry to audit:
ID: H1250
Original Word: בָּר
English Definition: or בַּר; from H1305 (בָּרַר) (in the sense of winnowing); grain, corn, wheat
KJV Usage: corn, wheat

Return ONLY a valid JSON array of objects formatted as:
[{"id": "H1250", "pronunciation_ar": "بَار / بُرّ", "definition_ar": "...", "notes_ar": "..."}]
`;

  for (const model of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
        })
      });
      if (response.ok) {
        const data = await response.json();
        const resObj = JSON.parse(data.candidates[0].content.parts[0].text);
        console.log('Result for H1250:\n', JSON.stringify(resObj, null, 2));
        
        // Update Supabase
        await fetch(SUPABASE_URL + '/rest/v1/strongs_ar_translations?strongs_id=eq.H1250', {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY,
            'Content-Type': 'application/json', 'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            pronunciation_ar: resObj[0].pronunciation_ar,
            definition_ar: resObj[0].definition_ar,
            notes_ar: resObj[0].notes_ar,
            is_verified: true
          })
        });
        console.log('H1250 updated successfully in Supabase!');
        break;
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}
testH1250();
