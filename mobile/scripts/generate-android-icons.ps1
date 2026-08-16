param(
  [string]$SourceLogo = (Join-Path $PSScriptRoot '..\..\logo.jpg')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$resRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\android\app\src\main\res'))
$sourcePath = [System.IO.Path]::GetFullPath($SourceLogo)
if (-not (Test-Path -LiteralPath $sourcePath)) {
  throw "Logo not found: $sourcePath"
}

$densitySizes = [ordered]@{
  'mipmap-mdpi' = 108
  'mipmap-hdpi' = 162
  'mipmap-xhdpi' = 216
  'mipmap-xxhdpi' = 324
  'mipmap-xxxhdpi' = 432
}

function Add-RoundedRectanglePath {
  param(
    [System.Drawing.Drawing2D.GraphicsPath]$Path,
    [System.Drawing.RectangleF]$Rectangle,
    [float]$Radius
  )

  $diameter = $Radius * 2
  $Path.AddArc($Rectangle.X, $Rectangle.Y, $diameter, $diameter, 180, 90)
  $Path.AddArc($Rectangle.Right - $diameter, $Rectangle.Y, $diameter, $diameter, 270, 90)
  $Path.AddArc($Rectangle.Right - $diameter, $Rectangle.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $Path.AddArc($Rectangle.X, $Rectangle.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $Path.CloseFigure()
}

function New-LauncherBitmap {
  param(
    [System.Drawing.Image]$Source,
    [int]$CanvasSize,
    [double]$LogoScale,
    [bool]$TransparentBackground
  )

  $bitmap = New-Object System.Drawing.Bitmap($CanvasSize, $CanvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    if ($TransparentBackground) {
      $graphics.Clear([System.Drawing.Color]::Transparent)
    } else {
      $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#071F4D'))
    }

    $logoSize = [float]($CanvasSize * $LogoScale)
    $offset = [float](($CanvasSize - $logoSize) / 2)
    $destination = New-Object System.Drawing.RectangleF($offset, $offset, $logoSize, $logoSize)
    $clipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    try {
      Add-RoundedRectanglePath -Path $clipPath -Rectangle $destination -Radius ([float]($logoSize * 0.17))
      $graphics.SetClip($clipPath)
      $graphics.DrawImage($Source, $destination)
      $graphics.ResetClip()
    } finally {
      $clipPath.Dispose()
    }
  } finally {
    $graphics.Dispose()
  }
  return $bitmap
}

$source = [System.Drawing.Image]::FromFile($sourcePath)
try {
  foreach ($entry in $densitySizes.GetEnumerator()) {
    $directory = Join-Path $resRoot $entry.Key
    $foreground = New-LauncherBitmap -Source $source -CanvasSize $entry.Value -LogoScale 0.68 -TransparentBackground $true
    $legacy = New-LauncherBitmap -Source $source -CanvasSize $entry.Value -LogoScale 0.84 -TransparentBackground $false
    try {
      $foreground.Save((Join-Path $directory 'ic_launcher_foreground.png'), [System.Drawing.Imaging.ImageFormat]::Png)
      $legacy.Save((Join-Path $directory 'ic_launcher.png'), [System.Drawing.Imaging.ImageFormat]::Png)
      $legacy.Save((Join-Path $directory 'ic_launcher_round.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $foreground.Dispose()
      $legacy.Dispose()
    }
  }
} finally {
  $source.Dispose()
}

Write-Output "Generated Android launcher icons from $sourcePath"
