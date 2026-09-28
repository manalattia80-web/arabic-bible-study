global.WebSocket = class {};
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmd3dwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function buildArabicRegex(text) {
  if (!text) return '.*';
  let safeText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let t = safeText.replace(/[\u064B-\u065F\u0670\u0640]/g, '').trim();
  if (!t) return '.*';
  let regex = '';
  for (let c of t) {
    if ('أإآاٱ'.includes(c)) regex += '[أإآاٱ][\u064B-\u065F\u0670\u0640]*';
    else if ('ةه'.includes(c)) regex += '[ةه][\u064B-\u065F\u0670\u0640]*';
    else if ('ىي'.includes(c)) regex += '[ىي][\u064B-\u065F\u0670\u0640]*';
    else regex += c + '[\u064B-\u065F\u0670\u0640]*';
  }
  return regex;
}

async function test() {
  const query = 'يسوع';
  const regex = buildArabicRegex(query);
  console.log('Regex pattern for يسوع:', regex);

  // Test 1: filter imatch on text_avd_ar
  console.log('\n--- Test 1: filter imatch on text_avd_ar ---');
  const res1 = await supabase
    .from('verses')
    .select('id, book_id, chapter_num, verse_num, text_avd_ar')
    .filter('text_avd_ar', 'imatch', regex)
    .limit(10);
  console.log('Test 1 error:', res1.error);
  console.log('Test 1 count:', res1.data?.length);
  if (res1.data?.[0]) console.log('Sample 1:', res1.data[0].text_avd_ar);

  // Test 2: count exact total matches
  console.log('\n--- Test 2: Count total matches for ' + query + ' ---');
  const res2 = await supabase
    .from('verses')
    .select('id', { count: 'exact', head: true })
    .filter('text_avd_ar', 'imatch', regex);
  console.log('Total matches for يسوع:', res2.count);

  // Test 3: Test another word like "محبة"
  const query3 = 'محبة';
  const regex3 = buildArabicRegex(query3);
  const res3 = await supabase
    .from('verses')
    .select('id', { count: 'exact', head: true })
    .filter('text_avd_ar', 'imatch', regex3);
  console.log('Total matches for محبة:', res3.count);

  // Test 4: Test word like "الله"
  const query4 = 'الله';
  const regex4 = buildArabicRegex(query4);
  const res4 = await supabase
    .from('verses')
    .select('id', { count: 'exact', head: true })
    .filter('text_avd_ar', 'imatch', regex4);
  console.log('Total matches for الله:', res4.count);

  // Test 5: Test word like "إيمان"
  const query5 = 'إيمان';
  const regex5 = buildArabicRegex(query5);
  const res5 = await supabase
    .from('verses')
    .select('id', { count: 'exact', head: true })
    .filter('text_avd_ar', 'imatch', regex5);
  console.log('Total matches for إيمان:', res5.count);
}

test();
