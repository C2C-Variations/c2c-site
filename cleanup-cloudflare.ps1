# =============================
# CLOUDFLARE PAGES CLEANUP
# Deletes all deployments for a Pages project, then deletes the project
# =============================

$token = $env:CLOUDFLARE_API_TOKEN
$accountId = "5c090f201cb5966cfc2bce36da6b0326"   # your account id
$project = "c2c-site"                             # your Pages project name

if (-not $token) { throw "CLOUDFLARE_API_TOKEN environment variable not set." }

$Headers = @{ "Authorization" = "Bearer $token" }

# 1) Delete deployments (100 at a time)
do {
    $listUrl = "https://api.cloudflare.com/client/v4/accounts/$accountId/pages/projects/$project/deployments?per_page=100&page=1"
    $list = Invoke-RestMethod -Method GET -Uri $listUrl -Headers $Headers
    $items = @($list.result)
    if ($items.Count -eq 0) { break }
    Write-Host "Deleting $($items.Count) deployment(s)..."
    foreach ($d in $items) {
        $id = $d.id
        $delUrl = "https://api.cloudflare.com/client/v4/accounts/$accountId/pages/projects/$project/deployments/$id"
        Invoke-RestMethod -Method DELETE -Uri $delUrl -Headers $Headers | Out-Null
        Write-Host "  Deleted $id"
    }
} while ($true)

# 2) Delete the Pages project
$projUrl = "https://api.cloudflare.com/client/v4/accounts/$accountId/pages/projects/$project"
Invoke-RestMethod -Method DELETE -Uri $projUrl -Headers $Headers | Out-Null
Write-Host "DONE: Deleted Pages project '$project'"
