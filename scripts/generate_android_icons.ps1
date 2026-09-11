Add-Type -AssemblyName System.Drawing

$srcImage = "public\logo\cupid-logo.png"
if (-not (Test-Path $srcImage)) {
    Write-Error "Source logo image not found at $srcImage"
    exit 1
}

$src = [System.Drawing.Image]::FromFile((Get-Item $srcImage).FullName)

$resDir = "android\app\src\main\res"

$mipmapSizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($folder in $mipmapSizes.Keys) {
    $size = $mipmapSizes[$folder]
    $dirPath = Join-Path $resDir $folder

    # 1. Square Launcher Icon (ic_launcher.png)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::White)
    $g.DrawImage($src, 0, 0, $size, $size)
    $bmp.Save((Join-Path $dirPath "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()

    # 2. Round Launcher Icon (ic_launcher_round.png)
    $bmpR = New-Object System.Drawing.Bitmap($size, $size)
    $gR = [System.Drawing.Graphics]::FromImage($bmpR)
    $gR.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gR.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gR.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gR.Clear([System.Drawing.Color]::Transparent)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $size, $size)
    $gR.SetClip($path)
    $gR.Clear([System.Drawing.Color]::White)
    $gR.DrawImage($src, 0, 0, $size, $size)
    $bmpR.Save((Join-Path $dirPath "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $gR.Dispose()
    $bmpR.Dispose()

    # 3. Foreground Icon for Adaptive (ic_launcher_foreground.png)
    # Shrink slightly to fit safe area padding inside adaptive icon
    $bmpF = New-Object System.Drawing.Bitmap($size, $size)
    $gF = [System.Drawing.Graphics]::FromImage($bmpF)
    $gF.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gF.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gF.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gF.Clear([System.Drawing.Color]::Transparent)
    
    $pad = [int]($size * 0.12)
    $drawSize = $size - ($pad * 2)
    $gF.DrawImage($src, $pad, $pad, $drawSize, $drawSize)
    
    $bmpF.Save((Join-Path $dirPath "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $gF.Dispose()
    $bmpF.Dispose()
}

$src.Dispose()
Write-Host "All Android icons generated directly from uploaded logo image successfully!"
