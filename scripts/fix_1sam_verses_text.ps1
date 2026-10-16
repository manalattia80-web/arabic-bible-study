$doc = New-Object System.Xml.XmlDocument
$doc.Load((Resolve-Path "scripts/data/1Sam_morphhb.xml"))
$nsmgr = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
$nsmgr.AddNamespace("osis", "http://www.bibletechnologies.net/2003/OSIS/namespace")

function Get-HebrewVerseText([string]$osisId) {
    $vNode = $doc.SelectSingleNode("//osis:verse[@osisID='$osisId']", $nsmgr)
    if (-not $vNode) { return $null }
    
    $words = @()
    foreach ($child in $vNode.ChildNodes) {
        if ($child.Name -eq "w") {
            # inner text without slashes
            $wText = $child.InnerText.Replace("/", "")
            $words += $wText
        } elseif ($child.Name -eq "seg" -and $child.GetAttribute("type") -eq "x-maqqef") {
            if ($words.Count -gt 0) {
                $words[$words.Count - 1] += [char]0x05BE # Maqqef ־
            }
        } elseif ($child.Name -eq "seg" -and $child.GetAttribute("type") -eq "x-sof-pasuq") {
            if ($words.Count -gt 0) {
                $words[$words.Count - 1] += [char]0x05C3 # Sof Pasuq ׃
            }
        }
    }
    
    $res = ""
    $maqqefChar = [string][char]0x05BE
    for ($i = 0; $i -lt $words.Count; $i++) {
        $w = $words[$i]
        $res += $w
        if ($i -lt $words.Count - 1 -and -not $w.EndsWith($maqqefChar)) {
            $res += " "
        }
    }
    return $res
}

$sqlFile = "scripts/update_1sam_shifted_verses.sql"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$writer = [System.IO.StreamWriter]::new($sqlFile, $false, $utf8NoBom)
$writer.WriteLine("BEGIN TRANSACTION;")

# 1. 1Sam 20:42: MT 20:42 + MT 21:1
$t20_42 = Get-HebrewVerseText "1Sam.20.42"
$t21_1  = Get-HebrewVerseText "1Sam.21.1"
$sofPasuqChar = [char]0x05C3
$t20_42_clean = $t20_42.TrimEnd($sofPasuqChar).Trim()
$full20_42 = "$t20_42_clean $t21_1"
$full20_42_esc = $full20_42.Replace("'", "''")
$writer.WriteLine("UPDATE verses SET text_original = '$full20_42_esc', text_original_lang = 'hebrew' WHERE book_id = 9 AND chapter_num = 20 AND verse_num = 42;")

# 2. 1Sam 21:1..15 -> MT 21:2..16
for ($v = 1; $v -le 15; $v++) {
    $mtV = $v + 1
    $t = Get-HebrewVerseText "1Sam.21.$mtV"
    $t_esc = $t.Replace("'", "''")
    $writer.WriteLine("UPDATE verses SET text_original = '$t_esc', text_original_lang = 'hebrew' WHERE book_id = 9 AND chapter_num = 21 AND verse_num = $v;")
}

# 3. 1Sam 23:29 -> MT 24:1
$t24_1 = Get-HebrewVerseText "1Sam.24.1"
$t24_1_esc = $t24_1.Replace("'", "''")
$writer.WriteLine("UPDATE verses SET text_original = '$t24_1_esc', text_original_lang = 'hebrew' WHERE book_id = 9 AND chapter_num = 23 AND verse_num = 29;")

# 4. 1Sam 24:1..22 -> MT 24:2..23
for ($v = 1; $v -le 22; $v++) {
    $mtV = $v + 1
    $t = Get-HebrewVerseText "1Sam.24.$mtV"
    $t_esc = $t.Replace("'", "''")
    $writer.WriteLine("UPDATE verses SET text_original = '$t_esc', text_original_lang = 'hebrew' WHERE book_id = 9 AND chapter_num = 24 AND verse_num = $v;")
}

$writer.WriteLine("COMMIT;")
$writer.Close()

Write-Output "Generated SQL file: $sqlFile"
