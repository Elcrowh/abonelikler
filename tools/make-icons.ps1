# Uygulama ikonlarını üretir (Windows'ta ek araç gerekmeden, System.Drawing ile).
# Çalıştırmak için:  powershell -ExecutionPolicy Bypass -File tools\make-icons.ps1

Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot '..\icons'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

function New-RoundedPath([single]$x, [single]$y, [single]$w, [single]$h, [single]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-Icon([int]$size, [string]$file, [single]$inset, [bool]$roundBackground) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  $bg = [System.Drawing.Color]::FromArgb(11, 16, 32)
  $g.Clear($bg)

  if ($roundBackground) {
    # Köşeleri yuvarlat (maskable olmayan ikonlar için).
    $g.Clear([System.Drawing.Color]::Transparent)
    $bgPath = New-RoundedPath 0 0 $size $size ($size * 0.22)
    $bgBrush = New-Object System.Drawing.SolidBrush($bg)
    $g.FillPath($bgBrush, $bgPath)
    $bgBrush.Dispose(); $bgPath.Dispose()
  }

  # Abonelik kartı: eğimli mavi degrade, hafif döndürülmüş iki katman.
  $cw = $size * (1 - $inset * 2)
  $ch = $cw * 0.66
  $cx = ($size - $cw) / 2
  $cy = ($size - $ch) / 2
  $radius = $cw * 0.13

  # Arkadaki soluk katman (üst üste binen abonelikler hissi).
  $backPath = New-RoundedPath ($cx + $cw * 0.06) ($cy - $ch * 0.20) ($cw * 0.88) $ch $radius
  $backBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90, 91, 140, 255))
  $g.FillPath($backBrush, $backPath)
  $backBrush.Dispose(); $backPath.Dispose()

  # Öndeki ana kart.
  $cardPath = New-RoundedPath $cx $cy $cw $ch $radius
  $rect = New-Object System.Drawing.RectangleF($cx, $cy, $cw, $ch)
  $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 91, 140, 255),
    [System.Drawing.Color]::FromArgb(255, 150, 100, 255),
    45.0)
  $g.FillPath($grad, $cardPath)
  $grad.Dispose(); $cardPath.Dispose()

  # Kart üzerindeki iki satır.
  $lineBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 255, 255, 255))
  $lh = $ch * 0.10
  $l1 = New-RoundedPath ($cx + $cw * 0.12) ($cy + $ch * 0.55) ($cw * 0.46) $lh ($lh / 2)
  $g.FillPath($lineBrush, $l1); $l1.Dispose()
  $l2 = New-RoundedPath ($cx + $cw * 0.12) ($cy + $ch * 0.74) ($cw * 0.28) $lh ($lh / 2)
  $faint = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(150, 255, 255, 255))
  $g.FillPath($faint, $l2); $l2.Dispose()
  $lineBrush.Dispose(); $faint.Dispose()

  # Sağ üstte tekrar/yenilenme noktası.
  $dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 61, 220, 151))
  $dr = $cw * 0.09
  $g.FillEllipse($dotBrush, ($cx + $cw * 0.74), ($cy + $ch * 0.20), $dr, $dr)
  $dotBrush.Dispose()

  $path = Join-Path $outDir $file
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Host "yazildi: $file ($size x $size)"
}

New-Icon 192 'icon-192.png'          0.16 $true
New-Icon 512 'icon-512.png'          0.16 $true
New-Icon 512 'maskable-512.png'      0.26 $false
New-Icon 180 'apple-touch-icon.png'  0.16 $false   # iOS zaten kendi kirpmasini yapiyor
