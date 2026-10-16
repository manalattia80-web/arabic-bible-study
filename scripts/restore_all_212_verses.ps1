$raw = Get-Content 'scripts/data/hebrew_bible_with_nikkud.json' -Raw
$wlc = ConvertFrom-Json $raw

function CleanWords($words) {
    $filtered = $words | Where-Object { $_ -ne 'ס' -and $_ -ne 'פ' }
    return ($filtered -join " ")
}

$sqlPath = "scripts/restore_212_verses.sql"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$writer = [System.IO.StreamWriter]::new($sqlPath, $false, $utf8NoBom)
$writer.WriteLine("BEGIN TRANSACTION;")

$count = 0

# 1. 2 Samuel (book_id = 10)
# English 18:33 is MT 19:1
$t = (CleanWords $wlc.'2Sam'[18][0]).Replace("'", "''")
$writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 10 AND chapter_num = 18 AND verse_num = 33;")
$count++

# English 19:1..43 is MT 19:2..44
for ($v = 1; $v -le 43; $v++) {
    $t = (CleanWords $wlc.'2Sam'[18][$v]).Replace("'", "''")
    $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 10 AND chapter_num = 19 AND verse_num = $v;")
    $count++
}

# 2. 1 Kings (book_id = 11)
# English 4:21..34 is MT 5:1..14
for ($v = 21; $v -le 34; $v++) {
    $t = (CleanWords $wlc.'1Kgs'[4][$v - 21]).Replace("'", "''")
    $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 11 AND chapter_num = 4 AND verse_num = $v;")
    $count++
}

# English 5:1..18 is MT 5:15..32
for ($v = 1; $v -le 18; $v++) {
    $t = (CleanWords $wlc.'1Kgs'[4][14 + $v - 1]).Replace("'", "''")
    $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 11 AND chapter_num = 5 AND verse_num = $v;")
    $count++
}

# 3. 2 Kings (book_id = 12)
# English 11:21 is MT 12:1
$t = (CleanWords $wlc.'2Kgs'[11][0]).Replace("'", "''")
$writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 12 AND chapter_num = 11 AND verse_num = 21;")
$count++

# English 12:1..21 is MT 12:2..22
for ($v = 1; $v -le 21; $v++) {
    $t = (CleanWords $wlc.'2Kgs'[11][$v]).Replace("'", "''")
    $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 12 AND chapter_num = 12 AND verse_num = $v;")
    $count++
}

# 4. 1 Chronicles (book_id = 13)
# English 6:1..15 is MT 5:27..41
for ($v = 1; $v -le 15; $v++) {
    $t = (CleanWords $wlc.'1Chr'[4][26 + $v - 1]).Replace("'", "''")
    $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 13 AND chapter_num = 6 AND verse_num = $v;")
    $count++
}

# English 6:16..81 is MT 6:1..66
for ($v = 16; $v -le 81; $v++) {
    $t = (CleanWords $wlc.'1Chr'[5][$v - 16]).Replace("'", "''")
    $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 13 AND chapter_num = 6 AND verse_num = $v;")
    $count++
}

# 5. 2 Chronicles (book_id = 14)
# English 2:1 is MT 1:18
$t = (CleanWords $wlc.'2Chr'[0][17]).Replace("'", "''")
$writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 14 AND chapter_num = 2 AND verse_num = 1;")
$count++

# English 2:2..18 is MT 2:1..17
for ($v = 2; $v -le 18; $v++) {
    $t = (CleanWords $wlc.'2Chr'[1][$v - 2]).Replace("'", "''")
    $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 14 AND chapter_num = 2 AND verse_num = $v;")
    $count++
}

# English 14:1 is MT 13:23
$t = (CleanWords $wlc.'2Chr'[12][22]).Replace("'", "''")
$writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 14 AND chapter_num = 14 AND verse_num = 1;")
$count++

# English 14:2..15 is MT 14:1..14
for ($v = 2; $v -le 15; $v++) {
    $t = (CleanWords $wlc.'2Chr'[13][$v - 2]).Replace("'", "''")
    $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 14 AND chapter_num = 14 AND verse_num = $v;")
    $count++
}

$writer.WriteLine("COMMIT;")
$writer.Close()

Write-Output "Successfully generated SQL for $count verses at $sqlPath"
