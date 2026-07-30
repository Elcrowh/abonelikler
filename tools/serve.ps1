# Uygulamayi yerelde denemek icin kucuk bir statik dosya sunucusu.
# Node/Python gerekmez. Durdurmak icin Ctrl+C.
#
#   powershell -ExecutionPolicy Bypass -File tools\serve.ps1
#
# Ardindan tarayicida: http://localhost:8080

param([int]$Port = 8080)

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.webmanifest' = 'application/manifest+json; charset=utf-8'
  '.png'  = 'image/png'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.sql'  = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Sunucu hazir: http://localhost:$Port   (kok: $root)"
Write-Host "Durdurmak icin Ctrl+C"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }

    $full = Join-Path $root ($rel -replace '/', '\')

    # Kok disina cikilmasini engelle.
    $resolved = $null
    try { $resolved = (Resolve-Path -LiteralPath $full -ErrorAction Stop).Path } catch {}

    if ($resolved -and $resolved.StartsWith($root) -and (Test-Path -LiteralPath $resolved -PathType Leaf)) {
      $ext = [System.IO.Path]::GetExtension($resolved).ToLower()
      $type = $mime[$ext]
      if (-not $type) { $type = 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($resolved)
      $ctx.Response.ContentType = $type
      $ctx.Response.Headers.Add('Cache-Control', 'no-cache')
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      Write-Host "200 /$rel"
    } else {
      $ctx.Response.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes('404')
      $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
      Write-Host "404 /$rel"
    }
    $ctx.Response.OutputStream.Close()
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
