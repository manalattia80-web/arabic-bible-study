[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$jsonStr = Get-Content -Raw -Encoding utf8 "scripts/data/hebrew_bible_with_nikkud.json"
$wlc = $jsonStr | ConvertFrom-Json

$bookMap = [ordered]@{
  1="Gen"; 2="Exod"; 3="Lev"; 4="Num"; 5="Deut";
  6="Josh"; 7="Judg"; 8="Ruth"; 9="1Sam"; 10="2Sam";
  11="1Kgs"; 12="2Kgs"; 13="1Chr"; 14="2Chr"; 15="Ezra";
  16="Neh"; 17="Esth"; 18="Job"; 19="Ps"; 20="Prov";
  21="Eccl"; 22="Song"; 23="Isa"; 24="Jer"; 25="Lam";
  26="Ezek"; 27="Dan"; 28="Hos"; 29="Joel"; 30="Amos";
  31="Obad"; 32="Jonah"; 33="Mic"; 34="Nah"; 35="Hab";
  36="Zeph"; 37="Hag"; 38="Zech"; 39="Mal"
}

# 62 Psalms shift offset
$psalm2Shift = @(51, 52, 54, 60)
$psalm1Shift = @(
  3, 4, 5, 6, 7, 8, 9, 12, 18, 19, 20, 21, 22, 30, 31, 34, 36, 38, 39, 40,
  41, 42, 44, 45, 46, 47, 48, 49, 53, 55, 56, 57, 58, 59, 61, 62, 63, 64,
  65, 67, 68, 69, 70, 75, 76, 77, 80, 81, 83, 84, 85, 88, 89, 92, 102, 108, 140, 142
)

$sqlFile = "scripts/restore_wlc.sql"
$writer = New-Object System.IO.StreamWriter($sqlFile, $false, [System.Text.Encoding]::UTF8)
$writer.WriteLine("BEGIN TRANSACTION;")

$updatedCount = 0

# Process all 39 books
foreach ($entry in $bookMap.GetEnumerator()) {
  $bId = $entry.Key
  $key = $entry.Value
  $wlcBook = $wlc.$key
  
  if ($bId -eq 19) {
    # Psalms handling
    for ($ch = 1; $ch -le 150; $ch++) {
      $wlcPs = $wlcBook[$ch - 1]
      $dbRows = .\sqlite_dist\sqlite3.exe mobile/assets/bible_study.db "SELECT verse_num FROM verses WHERE book_id = 19 AND chapter_num = $ch ORDER BY verse_num ASC;"
      $dbVerses = $dbRows -split "`r?`n" | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_ }
      
      $is2Shift = $psalm2Shift -contains $ch
      $is1Shift = $psalm1Shift -contains $ch
      
      foreach ($v in $dbVerses) {
        $wlcIndex = -1
        $prefixTitle = ""
        
        if ($is2Shift) {
          if ($v -eq 1) {
            $t1 = ($wlcPs[0] | Where-Object { $_ -ne 'ס' -and $_ -ne 'פ' }) -join " "
            $t2 = ($wlcPs[1] | Where-Object { $_ -ne 'ס' -and $_ -ne 'פ' }) -join " "
            $prefixTitle = "[$t1 $t2] "
          }
          $wlcIndex = $v + 1 # v1 -> index 2
        } elseif ($is1Shift) {
          if ($v -eq 1) {
            $t1 = ($wlcPs[0] | Where-Object { $_ -ne 'ס' -and $_ -ne 'פ' }) -join " "
            $prefixTitle = "[$t1] "
          }
          $wlcIndex = $v # v1 -> index 1
        } else {
          $wlcIndex = $v - 1 # standard 1-to-1
        }
        
        if ($wlcIndex -ge 0 -and $wlcIndex -lt $wlcPs.Count) {
          $words = $wlcPs[$wlcIndex] | Where-Object { $_ -ne 'ס' -and $_ -ne 'פ' }
          $hebrewText = $prefixTitle + ($words -join " ")
          $hebrewEscaped = $hebrewText.Replace("'", "''")
          $writer.WriteLine("UPDATE verses SET text_original = '$hebrewEscaped', text_original_lang = 'hebrew' WHERE book_id = 19 AND chapter_num = $ch AND verse_num = $v;")
          $updatedCount++
        }
      }
    }
  } else {
    # Non-Psalms books
    $numChapters = $wlcBook.Count
    for ($ch = 1; $ch -le $numChapters; $ch++) {
      $wlcCh = $wlcBook[$ch - 1]
      $dbRows = .\sqlite_dist\sqlite3.exe mobile/assets/bible_study.db "SELECT verse_num FROM verses WHERE book_id = $bId AND chapter_num = $ch ORDER BY verse_num ASC;"
      $dbVerses = $dbRows -split "`r?`n" | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_ }
      
      foreach ($v in $dbVerses) {
        $wlcIndex = $v - 1
        if ($wlcIndex -ge 0 -and $wlcIndex -lt $wlcCh.Count) {
          $words = $wlcCh[$wlcIndex] | Where-Object { $_ -ne 'ס' -and $_ -ne 'פ' }
          $hebrewText = $words -join " "
          $hebrewEscaped = $hebrewText.Replace("'", "''")
          # Only update if text is damaged (no Sof Pasuq)
          $writer.WriteLine("UPDATE verses SET text_original = '$hebrewEscaped', text_original_lang = 'hebrew' WHERE book_id = $bId AND chapter_num = $ch AND verse_num = $v AND (text_original NOT LIKE '%׃%' OR text_original IS NULL OR text_original = '' OR text_original LIKE '%סָפַר%');")
          $updatedCount++
        }
      }
    }
  }
}

$writer.WriteLine("COMMIT;")
$writer.Close()
Write-Output "Generated SQL file for $updatedCount verses."