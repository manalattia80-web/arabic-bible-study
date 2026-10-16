[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$jsonStr = Get-Content -Raw -Encoding utf8 "scripts/data/hebrew_bible_with_nikkud.json"
$wlc = $jsonStr | ConvertFrom-Json

$sqlFile = "scripts/restore_cross_chapter.sql"
$writer = New-Object System.IO.StreamWriter($sqlFile, $false, [System.Text.Encoding]::UTF8)
$writer.WriteLine("BEGIN TRANSACTION;")

function CleanWlc($words) {
  return (($words | Where-Object { $_ -ne 'ס' -and $_ -ne 'פ' }) -join " ").Replace("'", "''")
}

# 1. Gen 31:55 -> WLC Gen 32:1
$t = CleanWlc $wlc.Gen[31][0]
$writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 1 AND chapter_num = 31 AND verse_num = 55;")

# 2. Exod 8:1-4 -> WLC Exod 7:26-29, and Exod 8:5-32 -> WLC Exod 8:1-28
for ($v = 1; $v -le 4; $v++) {
  $t = CleanWlc $wlc.Exod[6][25 + $v - 1]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 2 AND chapter_num = 8 AND verse_num = $v;")
}
for ($v = 5; $v -le 32; $v++) {
  $t = CleanWlc $wlc.Exod[7][$v - 5]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 2 AND chapter_num = 8 AND verse_num = $v;")
}

# Exod 21:37 in MT is 22:1 in English
# Exod 22:1-30 in English is MT 22:2-31 (or 21:37 + 22:1..29)
for ($v = 1; $v -le 31; $v++) {
  if ($v -eq 1) {
    $t = CleanWlc $wlc.Exod[20][36] # 21:37 in MT
  } else {
    $t = CleanWlc $wlc.Exod[21][$v - 2]
  }
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 2 AND chapter_num = 22 AND verse_num = $v;")
}

# 3. Lev 6:1-7 -> WLC Lev 5:20-26, and Lev 6:8-30 -> WLC Lev 6:1-23
for ($v = 1; $v -le 7; $v++) {
  $t = CleanWlc $wlc.Lev[4][19 + $v - 1]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 3 AND chapter_num = 6 AND verse_num = $v;")
}
for ($v = 8; $v -le 30; $v++) {
  $t = CleanWlc $wlc.Lev[5][$v - 8]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 3 AND chapter_num = 6 AND verse_num = $v;")
}

# 4. Num 16:36-50 -> WLC Num 17:1-15, and Num 17:1-13 -> WLC Num 17:16-28
for ($v = 36; $v -le 50; $v++) {
  $t = CleanWlc $wlc.Num[16][$v - 36]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 4 AND chapter_num = 16 AND verse_num = $v;")
}
for ($v = 1; $v -le 13; $v++) {
  $t = CleanWlc $wlc.Num[16][15 + $v - 1]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 4 AND chapter_num = 17 AND verse_num = $v;")
}

# Num 29:40 in English is MT 30:1, and Num 30:1-16 is MT 30:2-17
$t = CleanWlc $wlc.Num[29][0]
$writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 4 AND chapter_num = 29 AND verse_num = 40;")
for ($v = 1; $v -le 16; $v++) {
  $t = CleanWlc $wlc.Num[29][$v]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 4 AND chapter_num = 30 AND verse_num = $v;")
}

# 5. Deut 12:32 in English is MT 13:1, and Deut 13:1-18 is MT 13:2-19
$t = CleanWlc $wlc.Deut[12][0]
$writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 5 AND chapter_num = 12 AND verse_num = 32;")
for ($v = 1; $v -le 18; $v++) {
  $t = CleanWlc $wlc.Deut[12][$v]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 5 AND chapter_num = 13 AND verse_num = $v;")
}

# Deut 22:30 in English is MT 23:1, and Deut 23:1-25 is MT 23:2-26
$t = CleanWlc $wlc.Deut[22][0]
$writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 5 AND chapter_num = 22 AND verse_num = 30;")
for ($v = 1; $v -le 25; $v++) {
  $t = CleanWlc $wlc.Deut[22][$v]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 5 AND chapter_num = 23 AND verse_num = $v;")
}

# Deut 28:69 in MT is Deut 29:1 in English
for ($v = 1; $v -le 29; $v++) {
  if ($v -eq 1) {
    $t = CleanWlc $wlc.Deut[27][68] # 28:69 in MT
  } else {
    $t = CleanWlc $wlc.Deut[28][$v - 2]
  }
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 5 AND chapter_num = 29 AND verse_num = $v;")
}

# 6. 1 Sam 20:42 vs 21:1.. 1 Sam 23:29 in English is MT 24:1, and 24:1-22 in English is MT 24:2-23
$t = CleanWlc $wlc['1Sam'][23][0]
$writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 9 AND chapter_num = 23 AND verse_num = 29;")
for ($v = 1; $v -le 22; $v++) {
  $t = CleanWlc $wlc['1Sam'][23][$v]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 9 AND chapter_num = 24 AND verse_num = $v;")
}

# 7. 2 Sam 18:33 in English is MT 19:1, and 19:1-43 in English is MT 19:2-44
$t = CleanWlc $wlc['2Sam'][18][0]
$writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 10 AND chapter_num = 18 AND verse_num = 33;")
for ($v = 1; $v -le 43; $v++) {
  $t = CleanWlc $wlc['2Sam'][18][$v]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 10 AND chapter_num = 19 AND verse_num = $v;")
}

# 8. 1 Kgs 4:21-34 in English is MT 5:1-14, and 5:1-18 in English is MT 5:15-32
for ($v = 21; $v -le 34; $v++) {
  $t = CleanWlc $wlc['1Kgs'][4][$v - 21]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 11 AND chapter_num = 4 AND verse_num = $v;")
}
for ($v = 1; $v -le 18; $v++) {
  $t = CleanWlc $wlc['1Kgs'][4][14 + $v - 1]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 11 AND chapter_num = 5 AND verse_num = $v;")
}

# 9. 2 Kgs 11:21 in English is MT 12:1, and 12:1-21 in English is MT 12:2-22
$t = CleanWlc $wlc['2Kgs'][11][0]
$writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 12 AND chapter_num = 11 AND verse_num = 21;")
for ($v = 1; $v -le 21; $v++) {
  $t = CleanWlc $wlc['2Kgs'][11][$v]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 12 AND chapter_num = 12 AND verse_num = $v;")
}

# 10. 1 Chr 5:27-41 in MT is 6:1-15 in English, and 6:1-66 in MT is 6:16-81 in English
for ($v = 1; $v -le 81; $v++) {
  if ($v -le 15) {
    $t = CleanWlc $wlc['1Chr'][4][26 + $v - 1]
  } else {
    $t = CleanWlc $wlc['1Chr'][5][$v - 16]
  }
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 13 AND chapter_num = 6 AND verse_num = $v;")
}

# 11. 2 Chr 1:18 in MT is 2:1 in English, and 2:1-17 in MT is 2:2-18 in English
for ($v = 1; $v -le 18; $v++) {
  if ($v -eq 1) {
    $t = CleanWlc $wlc['2Chr'][0][17]
  } else {
    $t = CleanWlc $wlc['2Chr'][1][$v - 2]
  }
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 14 AND chapter_num = 2 AND verse_num = $v;")
}

# 2 Chr 13:23 in MT is 14:1 in English, and 14:1-14 in MT is 14:2-15 in English
for ($v = 1; $v -le 15; $v++) {
  if ($v -eq 1) {
    $t = CleanWlc $wlc['2Chr'][12][22]
  } else {
    $t = CleanWlc $wlc['2Chr'][13][$v - 2]
  }
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 14 AND chapter_num = 14 AND verse_num = $v;")
}

# 12. Neh 3:33-38 in MT is 4:1-6 in English, and 4:1-17 in MT is 4:7-23 in English
for ($v = 1; $v -le 23; $v++) {
  if ($v -le 6) {
    $t = CleanWlc $wlc.Neh[2][32 + $v - 1]
  } else {
    $t = CleanWlc $wlc.Neh[3][$v - 7]
  }
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 16 AND chapter_num = 4 AND verse_num = $v;")
}

# Neh 9:38 in English is MT 10:1, and 10:1-39 in English is MT 10:2-40
$t = CleanWlc $wlc.Neh[9][0]
$writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 16 AND chapter_num = 9 AND verse_num = 38;")
for ($v = 1; $v -le 39; $v++) {
  $t = CleanWlc $wlc.Neh[9][$v]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 16 AND chapter_num = 10 AND verse_num = $v;")
}

# 13. Job 40:25-32 in MT is 41:1-8 in English, and 41:1-26 in MT is 41:9-34 in English
for ($v = 1; $v -le 34; $v++) {
  if ($v -le 8) {
    $t = CleanWlc $wlc.Job[39][24 + $v - 1]
  } else {
    $t = CleanWlc $wlc.Job[40][$v - 9]
  }
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 18 AND chapter_num = 41 AND verse_num = $v;")
}

# 14. Eccl 4:17 in MT is 5:1 in English, and 5:1-19 in MT is 5:2-20 in English
for ($v = 1; $v -le 20; $v++) {
  if ($v -eq 1) {
    $t = CleanWlc $wlc.Eccl[3][16]
  } else {
    $t = CleanWlc $wlc.Eccl[4][$v - 2]
  }
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 21 AND chapter_num = 5 AND verse_num = $v;")
}

# 15. Song 6:13 in English is MT 7:1, and 7:1-13 in English is MT 7:2-14
$t = CleanWlc $wlc.Song[6][0]
$writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 22 AND chapter_num = 6 AND verse_num = 13;")
for ($v = 1; $v -le 13; $v++) {
  $t = CleanWlc $wlc.Song[6][$v]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 22 AND chapter_num = 7 AND verse_num = $v;")
}

# 16. Isa 8:23 in MT is 9:1 in English, and 9:1-20 in MT is 9:2-21 in English
for ($v = 1; $v -le 21; $v++) {
  if ($v -eq 1) {
    $t = CleanWlc $wlc.Isa[7][22]
  } else {
    $t = CleanWlc $wlc.Isa[8][$v - 2]
  }
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 23 AND chapter_num = 9 AND verse_num = $v;")
}

# Isa 64:1 in English is MT 63:19b, and 64:2-12 is MT 64:1-11
for ($v = 1; $v -le 12; $v++) {
  if ($v -eq 1) {
    $t = CleanWlc $wlc.Isa[63][0] # 64:1 in MT
  } else {
    $t = CleanWlc $wlc.Isa[63][$v - 1]
  }
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 23 AND chapter_num = 64 AND verse_num = $v;")
}

# 17. Jer 8:23 in MT is 9:1 in English, and 9:1-25 in MT is 9:2-26 in English
for ($v = 1; $v -le 26; $v++) {
  if ($v -eq 1) {
    $t = CleanWlc $wlc.Jer[7][22]
  } else {
    $t = CleanWlc $wlc.Jer[8][$v - 2]
  }
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 24 AND chapter_num = 9 AND verse_num = $v;")
}

# 18. Ezek 20:45-49 in English is MT 21:1-5, and 21:1-32 in English is MT 21:6-37
for ($v = 45; $v -le 49; $v++) {
  $t = CleanWlc $wlc.Ezek[20][$v - 45]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 26 AND chapter_num = 20 AND verse_num = $v;")
}
for ($v = 1; $v -le 32; $v++) {
  $t = CleanWlc $wlc.Ezek[20][5 + $v - 1]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 26 AND chapter_num = 21 AND verse_num = $v;")
}

# 19. Dan 3:31-33 in MT is 4:1-3 in English, and 4:1-34 in MT is 4:4-37 in English
for ($v = 1; $v -le 37; $v++) {
  if ($v -le 3) {
    $t = CleanWlc $wlc.Dan[2][30 + $v - 1]
  } else {
    $t = CleanWlc $wlc.Dan[3][$v - 4]
  }
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'aramaic' WHERE book_id = 27 AND chapter_num = 4 AND verse_num = $v;")
}

# Dan 5:31 in English is MT 6:1, and 6:1-28 in English is MT 6:2-29
$t = CleanWlc $wlc.Dan[5][0]
$writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'aramaic' WHERE book_id = 27 AND chapter_num = 5 AND verse_num = 31;")
for ($v = 1; $v -le 28; $v++) {
  $t = CleanWlc $wlc.Dan[5][$v]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'aramaic' WHERE book_id = 27 AND chapter_num = 6 AND verse_num = $v;")
}

# 20. Hos 1:10-11 in MT is 2:1-2, Hos 11:12 in MT is 12:1, Hos 13:16 in MT is 14:1
for ($v = 1; $v -le 23; $v++) {
  if ($v -le 2) {
    $t = CleanWlc $wlc.Hos[0][9 + $v - 1]
  } else {
    $t = CleanWlc $wlc.Hos[1][$v - 3]
  }
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 28 AND chapter_num = 2 AND verse_num = $v;")
}

# 21. Joel 2:28-32 in English is MT 3:1-5, and Joel 3:1-21 in English is MT 4:1-21
for ($v = 28; $v -le 32; $v++) {
  $t = CleanWlc $wlc.Joel[2][$v - 28]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 29 AND chapter_num = 2 AND verse_num = $v;")
}
for ($v = 1; $v -le 21; $v++) {
  $t = CleanWlc $wlc.Joel[3][$v - 1]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 29 AND chapter_num = 3 AND verse_num = $v;")
}

# 22. Jonah 1:17 in English is MT 2:1, and 2:1-10 in English is MT 2:2-11
$t = CleanWlc $wlc.Jonah[1][0]
$writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 32 AND chapter_num = 1 AND verse_num = 17;")
for ($v = 1; $v -le 10; $v++) {
  $t = CleanWlc $wlc.Jonah[1][$v]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 32 AND chapter_num = 2 AND verse_num = $v;")
}

# 23. Mic 4:14 in MT is 5:1 in English, and 5:1-14 in MT is 5:2-15 in English
for ($v = 1; $v -le 15; $v++) {
  if ($v -eq 1) {
    $t = CleanWlc $wlc.Mic[3][13]
  } else {
    $t = CleanWlc $wlc.Mic[4][$v - 2]
  }
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 33 AND chapter_num = 5 AND verse_num = $v;")
}

# 24. Nah 1:15 in English is MT 2:1, and 2:1-13 in English is MT 2:2-14
$t = CleanWlc $wlc.Nah[1][0]
$writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 34 AND chapter_num = 1 AND verse_num = 15;")
for ($v = 1; $v -le 13; $v++) {
  $t = CleanWlc $wlc.Nah[1][$v]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 34 AND chapter_num = 2 AND verse_num = $v;")
}

# 25. Zech 1:18-21 in English is MT 2:1-4, and 2:1-13 in English is MT 2:5-17
for ($v = 18; $v -le 21; $v++) {
  $t = CleanWlc $wlc.Zech[1][$v - 18]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 38 AND chapter_num = 1 AND verse_num = $v;")
}
for ($v = 1; $v -le 13; $v++) {
  $t = CleanWlc $wlc.Zech[1][4 + $v - 1]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 38 AND chapter_num = 2 AND verse_num = $v;")
}

# 26. Mal 3:19-24 in MT is 4:1-6 in English
for ($v = 1; $v -le 6; $v++) {
  $t = CleanWlc $wlc.Mal[2][18 + $v - 1]
  $writer.WriteLine("UPDATE verses SET text_original = '$t', text_original_lang = 'hebrew' WHERE book_id = 39 AND chapter_num = 4 AND verse_num = $v;")
}

$writer.WriteLine("COMMIT;")
$writer.Close()
Write-Output "Generated cross-chapter SQL successfully!"