Add-Type -AssemblyName System.Drawing

$resDir = "android\app\src\main\res"

$mipmapSizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

$pinkColor = [System.Drawing.ColorTranslator]::FromHtml("#FF2E79")
$whiteColor = [System.Drawing.Color]::White

foreach ($folder in $mipmapSizes.Keys) {
    $size = $mipmapSizes[$folder]
    $dirPath = Join-Path $resDir $folder

    # 1. Square Icon (ic_launcher.png)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    # Fill pink background with rounded rect
    $g.Clear([System.Drawing.Color]::Transparent)
    $radius = [int]($size * 0.22)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $radius, $radius, 180, 90)
    $path.AddArc($size - $radius - 1, 0, $radius, $radius, 270, 90)
    $path.AddArc($size - $radius - 1, $size - $radius - 1, $radius, $radius, 0, 90)
    $path.AddArc(0, $size - $radius - 1, $radius, $radius, 90, 90)
    $path.CloseFigure()
    
    $brush = New-Object System.Drawing.SolidBrush($pinkColor)
    $g.FillPath($brush, $path)
    
    # Draw White Monogram C & Heart
    $penWidth = [Math]::Max(2, [int]($size * 0.08))
    $whitePen = New-Object System.Drawing.Pen($whiteColor, $penWidth)
    $whitePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $whitePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    
    # Draw C curve
    $cRect = New-Object System.Drawing.Rectangle([int]($size * 0.2), [int]($size * 0.2), [int]($size * 0.6), [int]($size * 0.6))
    $g.DrawArc($whitePen, $cRect, 40, 280)
    
    # Draw Heart inside
    $heartBrush = New-Object System.Drawing.SolidBrush($whiteColor)
    $hSize = [int]($size * 0.28)
    $hx = [int]($size * 0.5)
    $hy = [int]($size * 0.5)
    
    $hPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $hPath.AddBezier($hx, $hy + [int]($hSize * 0.45), $hx - [int]($hSize * 0.5), $hy, $hx - [int]($hSize * 0.4), $hy - [int]($hSize * 0.4), $hx, $hy - [int]($hSize * 0.1))
    $hPath.AddBezier($hx, $hy - [int]($hSize * 0.1), $hx + [int]($hSize * 0.4), $hy - [int]($hSize * 0.4), $hx + [int]($hSize * 0.5), $hy, $hx, $hy + [int]($hSize * 0.45))
    $g.FillPath($heartBrush, $hPath)
    
    $bmp.Save((Join-Path $dirPath "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()

    # 2. Round Icon (ic_launcher_round.png)
    $bmpR = New-Object System.Drawing.Bitmap($size, $size)
    $gR = [System.Drawing.Graphics]::FromImage($bmpR)
    $gR.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $gR.Clear([System.Drawing.Color]::Transparent)
    $gR.FillEllipse($brush, 0, 0, $size - 1, $size - 1)
    $gR.DrawArc($whitePen, $cRect, 40, 280)
    $gR.FillPath($heartBrush, $hPath)
    $bmpR.Save((Join-Path $dirPath "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $gR.Dispose()
    $bmpR.Dispose()

    # 3. Foreground Icon (ic_launcher_foreground.png)
    $bmpF = New-Object System.Drawing.Bitmap($size, $size)
    $gF = [System.Drawing.Graphics]::FromImage($bmpF)
    $gF.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $gF.Clear([System.Drawing.Color]::Transparent)
    $gF.DrawArc($whitePen, $cRect, 40, 280)
    $gF.FillPath($heartBrush, $hPath)
    $bmpF.Save((Join-Path $dirPath "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $gF.Dispose()
    $bmpF.Dispose()
}
Write-Host "All Android icons generated successfully!"
