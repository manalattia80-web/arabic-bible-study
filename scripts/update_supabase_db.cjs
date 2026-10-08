const { specificCorrections, transformText } = require('./theology_rules.cjs');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

async function updateSupabase() {
  console.log('=== Updating Supabase strongs_ar_translations ===');

  // First, apply specific corrections for Pentecostal theology
  console.log('Applying specific Pentecostal theological corrections...');
  for (const [strongsId, corr] of Object.entries(specificCorrections)) {
    const payload = {};
    if (corr.definition_ar) payload.definition_ar = corr.definition_ar;
    if (corr.notes_ar) payload.notes_ar = corr.notes_ar;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/strongs_ar_translations?strongs_id=eq.${strongsId}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    console.log(`Updated ${strongsId}: status ${res.status}`);
  }

  // Now query and update rows with 'تدبيري' in batches
  let totalUpdated = 0;
  const BATCH_SIZE = 500;

  while (true) {
    // Fetch a batch of records containing تدبيري
    const fetchUrl = `${SUPABASE_URL}/rest/v1/strongs_ar_translations?definition_ar=like.*تدبيري*&select=id,strongs_id,definition_ar,notes_ar&limit=${BATCH_SIZE}`;
    const res = await fetch(fetchUrl, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!res.ok) {
      console.error(`Fetch error ${res.status}:`, await res.text());
      break;
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) {
      console.log('No more rows matching definition_ar like *تدبيري*.');
      break;
    }

    console.log(`Fetched batch of ${rows.length} rows to transform...`);

    const transformedRows = rows.map(row => {
      let def = row.definition_ar || '';
      let notes = row.notes_ar || '';

      if (specificCorrections[row.strongs_id]) {
        if (specificCorrections[row.strongs_id].definition_ar) {
          def = specificCorrections[row.strongs_id].definition_ar;
        }
        if (specificCorrections[row.strongs_id].notes_ar) {
          notes = specificCorrections[row.strongs_id].notes_ar;
        }
      }

      def = transformText(def);
      notes = transformText(notes);

      return {
        id: row.id,
        strongs_id: row.strongs_id,
        definition_ar: def,
        notes_ar: notes
      };
    });

    // Bulk upsert in sub-chunks of 100
    const SUB_CHUNK = 100;
    for (let i = 0; i < transformedRows.length; i += SUB_CHUNK) {
      const chunk = transformedRows.slice(i, i + SUB_CHUNK);
      const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/strongs_ar_translations?on_conflict=id`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(chunk)
      });

      if (!upsertRes.ok) {
        console.error(`Upsert chunk error: ${upsertRes.status}`, await upsertRes.text());
      }
    }

    totalUpdated += rows.length;
    console.log(`Progress: ${totalUpdated} rows updated in Supabase.`);
  }

  // Also check notes_ar for any remaining تدبيري
  while (true) {
    const fetchUrl = `${SUPABASE_URL}/rest/v1/strongs_ar_translations?notes_ar=like.*تدبيري*&select=id,strongs_id,definition_ar,notes_ar&limit=${BATCH_SIZE}`;
    const res = await fetch(fetchUrl, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const rows = await res.json();
    if (!rows || rows.length === 0) break;

    const transformedRows = rows.map(row => ({
      id: row.id,
      strongs_id: row.strongs_id,
      definition_ar: transformText(row.definition_ar || ''),
      notes_ar: transformText(row.notes_ar || '')
    }));

    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/strongs_ar_translations?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(transformedRows)
    });

    console.log(`Updated ${rows.length} rows with notes_ar like *تدبيري*.`);
    totalUpdated += rows.length;
  }

  console.log(`=== Done! Total records updated in Supabase: ${totalUpdated} ===`);

  // Final count check
  const countRes = await fetch(`${SUPABASE_URL}/rest/v1/strongs_ar_translations?definition_ar=like.*التدبيري*&select=id`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Range-Unit': 'items',
      'Range': '0-0',
      'Prefer': 'count=exact'
    }
  });
  console.log('Remaining matches in Supabase:', countRes.headers.get('content-range'));
}

updateSupabase().catch(console.error);
