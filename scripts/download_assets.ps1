Param(
  [string]$manifest = "snapshots\asset-list.json",
  [string]$outDir = "assets"
)
if(-not (Test-Path $manifest)){
  Write-Error "Manifest not found: $manifest"
  exit 1
}
$data = Get-Content $manifest -Raw | ConvertFrom-Json
mkdir $outDir -ErrorAction SilentlyContinue | Out-Null
$urls = @()
if ($data.assets) { $urls += $data.assets }
if ($data.source_download_urls) { $urls += $data.source_download_urls }
foreach($u in $urls){
  try{
    $file = [System.IO.Path]::GetFileName([uri]$u).Split('?')[0]
    if(-not $file){ $file = [System.Guid]::NewGuid().ToString() }
    $dest = Join-Path $outDir $file
    if(-not (Test-Path $dest)){
      Write-Host "Downloading $u -> $dest"
      Invoke-WebRequest -Uri $u -OutFile $dest -UseBasicParsing -ErrorAction Stop
    } else {
      Write-Host "Exists: $dest"
    }
  } catch{
    Write-Warning "Failed: $u ($_)"
  }
}
