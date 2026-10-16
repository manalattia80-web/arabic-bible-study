$doc = New-Object System.Xml.XmlDocument
$doc.Load((Resolve-Path "scripts/data/1Sam_morphhb.xml"))
$nsmgr = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
$nsmgr.AddNamespace("osis", "http://www.bibletechnologies.net/2003/OSIS/namespace")

Write-Output "Loading verified OT dictionary..."
$dict = @{}
$dictRaw = .\sqlite_dist\sqlite3.exe mobile/assets/bible_study.db "SELECT ar_word, strongs_id, count(*) FROM word_mappings WHERE orig_word_lang = 'hebrew' AND is_verified = 1 AND strongs_id LIKE 'H%' GROUP BY ar_word, strongs_id;"
foreach ($line in ($dictRaw -split "`r?`n")) {
    if ($line -match '^(.*?)\|(H\d+)\|(\d+)$') {
        $key = "$($matches[1])|$($matches[2])"
        $dict[$key] = [int]$matches[3]
    }
}
Write-Output "Loaded $($dict.Count) dictionary pairs."

Write-Output "Loading Strong's original words..."
$strongsLemmas = @{}
$sRaw = .\sqlite_dist\sqlite3.exe mobile/assets/bible_study.db "SELECT strongs_id, original_word FROM strongs_entries WHERE strongs_id LIKE 'H%';"
foreach ($line in ($sRaw -split "`r?`n")) {
    if ($line -match '^(H\d+)\|(.*)$') {
        $strongsLemmas[$matches[1]] = $matches[2]
    }
}
Write-Output "Loaded $($strongsLemmas.Count) Strong's lemmas."

function NormalizeArabic([string]$text) {
    if (-not $text) { return "" }
    $t = $text -replace '[\u064B-\u065F\u0670\p{P}]', ''
    $t = $t -replace '[\u0623\u0625\u0622]', [char]0x0627
    $t = $t -replace [char]0x0629, [char]0x0647
    $t = $t -replace [char]0x0649, [char]0x064A
    return $t.Trim()
}

function Get-OsisIdForVerse([int]$ch, [int]$v) {
    if ($ch -eq 20 -and $v -eq 42) { return @("1Sam.20.42", "1Sam.21.1") }
    if ($ch -eq 21) { return @("1Sam.21.$($v + 1)") }
    if ($ch -eq 23 -and $v -eq 29) { return @("1Sam.24.1") }
    if ($ch -eq 24) { return @("1Sam.24.$($v + 1)") }
    return @("1Sam.$ch.$v")
}

$dbVersesRaw = .\sqlite_dist\sqlite3.exe mobile/assets/bible_study.db "SELECT id, chapter_num, verse_num FROM verses WHERE book_id = 9 AND chapter_num >= 17 ORDER BY chapter_num, verse_num;"

$sqlPath = "scripts/update_1sam_mappings.sql"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$writer = [System.IO.StreamWriter]::new($sqlPath, $false, $utf8NoBom)
$writer.WriteLine("BEGIN TRANSACTION;")

$totalMapped = 0
$totalSupplied = 0
$totalVerses = 0

foreach ($vLine in ($dbVersesRaw -split "`r?`n")) {
    if ($vLine -match '^([^|]+)\|(\d+)\|(\d+)$') {
        $verseId = $matches[1]
        $ch = [int]$matches[2]
        $vNum = [int]$matches[3]
        $totalVerses++
        
        # 1. Get Hebrew words from XML
        $osisIds = Get-OsisIdForVerse $ch $vNum
        $hebrewWords = @()
        $heIndex = 1
        foreach ($oid in $osisIds) {
            $vNode = $doc.SelectSingleNode("//osis:verse[@osisID='$oid']", $nsmgr)
            if ($vNode) {
                $wNodes = $vNode.SelectNodes("osis:w", $nsmgr)
                foreach ($w in $wNodes) {
                    $lemmaAttr = $w.GetAttribute("lemma")
                    $sid = ""
                    if ($lemmaAttr -match '(\d+)') {
                        $sid = "H" + $matches[1]
                    }
                    $lemmaWord = if ($strongsLemmas.ContainsKey($sid)) { $strongsLemmas[$sid] } else { $w.InnerText.Replace("/", "") }
                    $hebrewWords += [PSCustomObject]@{
                        Pos = $heIndex
                        Strongs = $sid
                        OrigWord = $lemmaWord
                        Text = $w.InnerText.Replace("/", "")
                        Used = $false
                    }
                    $heIndex++
                }
            }
        }
        
        # 2. Get Arabic words from DB
        $arMappingsRaw = .\sqlite_dist\sqlite3.exe mobile/assets/bible_study.db "SELECT id, ar_word_position, ar_word FROM word_mappings WHERE verse_id = '$verseId' ORDER BY ar_word_position;"
        $arWords = @()
        foreach ($mLine in ($arMappingsRaw -split "`r?`n")) {
            if ($mLine -match '^([^|]+)\|(\d+)\|(.*)$') {
                $arWords += [PSCustomObject]@{
                    Id = $matches[1]
                    Pos = [int]$matches[2]
                    Word = $matches[3]
                }
            }
        }
        
        # 3. Match Arabic words to Hebrew words
        $lastMatchedHePos = 0
        for ($i = 0; $i -lt $arWords.Count; $i++) {
            $aw = $arWords[$i]
            $wClean = $aw.Word.Trim()
            $wNorm = NormalizeArabic $wClean
            
            $bestCandidate = $null
            $bestScore = -999999
            
            for ($j = 0; $j -lt $hebrewWords.Count; $j++) {
                $hw = $hebrewWords[$j]
                if (-not $hw.Strongs) { continue }
                
                $score = 0
                $pairKey = "$wClean|$($hw.Strongs)"
                if ($dict.ContainsKey($pairKey)) {
                    $score += 1000 + ($dict[$pairKey] * 10)
                } else {
                    $testKey = "$wNorm|$($hw.Strongs)"
                    if ($dict.ContainsKey($testKey)) {
                        $score += 800 + ($dict[$testKey] * 5)
                    }
                }
                
                if ($score -gt 0) {
                    # Monotonic position penalty
                    $posDiff = [Math]::Abs(($i / [Math]::Max(1, $arWords.Count)) - ($j / [Math]::Max(1, $hebrewWords.Count)))
                    $score -= ($posDiff * 200)
                    
                    if ($hw.Pos -lt $lastMatchedHePos) {
                        $score -= 300
                    }
                    
                    if ($hw.Used) {
                        $score -= 150
                    }
                    
                    if ($score -gt $bestScore) {
                        $bestScore = $score
                        $bestCandidate = $hw
                    }
                }
            }
            
            if ($bestCandidate -and $bestScore -gt 100) {
                $bestCandidate.Used = $true
                $lastMatchedHePos = $bestCandidate.Pos
                $sidEsc = $bestCandidate.Strongs
                $origEsc = $bestCandidate.OrigWord.Replace("'", "''")
                $hePos = $bestCandidate.Pos
                
                $writer.WriteLine("UPDATE word_mappings SET orig_word = '$origEsc', orig_word_lang = 'hebrew', strongs_id = '$sidEsc', orig_word_position = $hePos, is_verified = 1 WHERE id = '$($aw.Id)';")
                $totalMapped++
            } else {
                # Mark as supplied word (no Hebrew token)
                $writer.WriteLine("UPDATE word_mappings SET orig_word = '---', orig_word_lang = 'hebrew', strongs_id = NULL, orig_word_position = 0, is_verified = 1 WHERE id = '$($aw.Id)';")
                $totalSupplied++
            }
        }
    }
}

$writer.WriteLine("COMMIT;")
$writer.Close()

Write-Output "Alignment complete for $totalVerses verses!"
Write-Output "Total words mapped to Strong's: $totalMapped"
Write-Output "Total words marked supplied: $totalSupplied"
Write-Output "Total processed: $($totalMapped + $totalSupplied)"