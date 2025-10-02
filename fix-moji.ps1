$utf8 = [System.Text.UTF8Encoding]::new($false)

Get-ChildItem -Recurse -Filter *.html | Where-Object { $_.FullName -notmatch '\\_includes\\' } | ForEach-Object {
    $p = $_.FullName
    $t = [System.IO.File]::ReadAllText($p)

    $t = $t -replace 'â€™', "'"
    $t = $t -replace 'â€˜', "'"
    $t = $t -replace 'â€œ', '"'
    $t = $t -replace 'â€ ', '"'
    $t = $t -replace 'â€', '"'
    $t = $t -replace 'â€“', '-'
    $t = $t -replace 'â€”', '--'
    $t = $t -replace 'â€¦', '...'
    $t = $t -replace 'Ã‚Â', ''
    $t = $t -replace 'Â', ''

    [System.IO.File]::WriteAllText($p, $t, $utf8)
    "✓ cleaned -> $($_.Name)"
}
