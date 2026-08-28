Add-Type -AssemblyName System.Drawing

function Draw-CupidIcon([int]$width, [int]$height, [bool]$isRound, [bool]$isForegroundOnly) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $crimson = [System.Drawing.ColorTranslator]::FromHtml("#FF2D55")
    $white = [System.Drawing.Color]::White

    if (-not $isForegroundOnly) {
        $g.Clear([System.Drawing.Color]::Transparent)
        $bgBrush = New-Object System.Drawing.SolidBrush($white)
        if ($isRound) {
            $g.FillEllipse($bgBrush, 1, 1, $width - 2, $height - 2)
        } else {
            # Rounded rect background (approx 22% corner radius)
            $rect = New-Object System.Drawing.Rectangle(1, 1, $width - 2, $height - 2)
            $path = New-Object System.Drawing.Drawing2D.GraphicsPath
            $r = [Math]::Max(4, [int]($width * 0.22))
            $d = $r * 2
            $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
            $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
            $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
            $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
            $path.CloseFigure()
            $g.FillPath($bgBrush, $path)
        }
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    # Center coordinates & scale
    $cx = $width / 2.0
    $cy = $height / 2.0
    $scale = $width / 100.0

    # Draw Outer C arc
    $strokeWidth = [Math]::Max(2.0, 7.5 * $scale)
    $pen = New-Object System.Drawing.Pen($crimson, $strokeWidth)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    $cRadius = 26.0 * $scale
    $cRect = New-Object System.Drawing.RectangleF($cx - $cRadius, $cy - $cRadius, $cRadius * 2, $cRadius * 2)
    # Arc from -45 degrees sweeping 270 degrees counter-clockwise (or clockwise from 45 to 315)
    $g.DrawArc($pen, $cRect, 45, 270)

    # Draw Center Solid Heart
    $heartBrush = New-Object System.Drawing.SolidBrush($crimson)
    $hPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    
    # Accurate heart bezier curve points scaled to center
    $hScale = $scale * 0.85
    $hx = $cx
    $hy = $cy - (2.0 * $scale)

    $pBottom = New-Object System.Drawing.PointF($hx, $hy + (16.0 * $hScale))
    $pLeftCtrl1 = New-Object System.Drawing.PointF($hx - (1.0 * $hScale), $hy + (15.0 * $hScale))
    $pLeftCtrl2 = New-Object System.Drawing.PointF($hx - (16.0 * $hScale), $hy + (4.0 * $hScale))
    $pLeftLobe = New-Object System.Drawing.PointF($hx - (16.0 * $hScale), $hy - (5.0 * $hScale))
    
    $pTopLeftCtrl1 = New-Object System.Drawing.PointF($hx - (16.0 * $hScale), $hy - (12.0 * $hScale))
    $pTopLeftCtrl2 = New-Object System.Drawing.PointF($hx - (4.0 * $hScale), $hy - (14.0 * $hScale))
    $pCleft = New-Object System.Drawing.PointF($hx, $hy - (7.0 * $hScale))

    $pTopRightCtrl1 = New-Object System.Drawing.PointF($hx + (4.0 * $hScale), $hy - (14.0 * $hScale))
    $pTopRightCtrl2 = New-Object System.Drawing.PointF($hx + (16.0 * $hScale), $hy - (12.0 * $hScale))
    $pRightLobe = New-Object System.Drawing.PointF($hx + (16.0 * $hScale), $hy - (5.0 * $hScale))

    $pRightCtrl1 = New-Object System.Drawing.PointF($hx + (16.0 * $hScale), $hy + (4.0 * $hScale))
    $pRightCtrl2 = New-Object System.Drawing.PointF($hx + (1.0 * $hScale), $hy + (15.0 * $hScale))

    $hPath.AddBezier($pBottom, $pLeftCtrl1, $pLeftCtrl2, $pLeftLobe)
    $hPath.AddBezier($pLeftLobe, $pTopLeftCtrl1, $pTopLeftCtrl2, $pCleft)
    $hPath.AddBezier($pCleft, $pTopRightCtrl1, $pTopRightCtrl2, $pRightLobe)
    $hPath.AddBezier($pRightLobe, $pRightCtrl1, $pRightCtrl2, $pBottom)
    $hPath.CloseFigure()

    $g.FillPath($heartBrush, $hPath)

    $g.Dispose()
    return $bmp
}

function Draw-CupidSplash([int]$width, [int]$height) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $bg = [System.Drawing.ColorTranslator]::FromHtml("#0b1120")
    $crimson = [System.Drawing.ColorTranslator]::FromHtml("#FF2D55")
    $white = [System.Drawing.Color]::White

    # Background
    $g.Clear($bg)

    $minDim = [Math]::Min($width, $height)
    $cx = $width / 2.0
    $cy = ($height / 2.0) - ($minDim * 0.04)
    $scale = $minDim / 380.0

    # Draw Outer C arc
    $strokeWidth = [Math]::Max(3.0, 10.0 * $scale)
    $pen = New-Object System.Drawing.Pen($crimson, $strokeWidth)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    $cRadius = 36.0 * $scale
    $cRect = New-Object System.Drawing.RectangleF($cx - $cRadius, $cy - $cRadius, $cRadius * 2, $cRadius * 2)
    $g.DrawArc($pen, $cRect, 45, 270)

    # Draw Center Solid Heart
    $heartBrush = New-Object System.Drawing.SolidBrush($crimson)
    $hPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $hScale = $scale * 1.15
    $hx = $cx
    $hy = $cy - (2.0 * $scale)

    $pBottom = New-Object System.Drawing.PointF($hx, $hy + (16.0 * $hScale))
    $pLeftCtrl1 = New-Object System.Drawing.PointF($hx - (1.0 * $hScale), $hy + (15.0 * $hScale))
    $pLeftCtrl2 = New-Object System.Drawing.PointF($hx - (16.0 * $hScale), $hy + (4.0 * $hScale))
    $pLeftLobe = New-Object System.Drawing.PointF($hx - (16.0 * $hScale), $hy - (5.0 * $hScale))
    
    $pTopLeftCtrl1 = New-Object System.Drawing.PointF($hx - (16.0 * $hScale), $hy - (12.0 * $hScale))
    $pTopLeftCtrl2 = New-Object System.Drawing.PointF($hx - (4.0 * $hScale), $hy - (14.0 * $hScale))
    $pCleft = New-Object System.Drawing.PointF($hx, $hy - (7.0 * $hScale))

    $pTopRightCtrl1 = New-Object System.Drawing.PointF($hx + (4.0 * $hScale), $hy - (14.0 * $hScale))
    $pTopRightCtrl2 = New-Object System.Drawing.PointF($hx + (16.0 * $hScale), $hy - (12.0 * $hScale))
    $pRightLobe = New-Object System.Drawing.PointF($hx + (16.0 * $hScale), $hy - (5.0 * $hScale))

    $pRightCtrl1 = New-Object System.Drawing.PointF($hx + (16.0 * $hScale), $hy + (4.0 * $hScale))
    $pRightCtrl2 = New-Object System.Drawing.PointF($hx + (1.0 * $hScale), $hy + (15.0 * $hScale))

    $hPath.AddBezier($pBottom, $pLeftCtrl1, $pLeftCtrl2, $pLeftLobe)
    $hPath.AddBezier($pLeftLobe, $pTopLeftCtrl1, $pTopLeftCtrl2, $pCleft)
    $hPath.AddBezier($pCleft, $pTopRightCtrl1, $pTopRightCtrl2, $pRightLobe)
    $hPath.AddBezier($pRightLobe, $pRightCtrl1, $pRightCtrl2, $pBottom)
    $hPath.CloseFigure()

    $g.FillPath($heartBrush, $hPath)

    # Wordmark text "cupid."
    $fontSize = [Math]::Max(14.0, 32.0 * $scale)
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush($white)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $textY = $cy + $cRadius + (28.0 * $scale)
    $g.DrawString("cupid.", $font, $textBrush, $cx, $textY, $sf)

    $g.Dispose()
    return $bmp
}

$baseDir = "android\app\src\main\res"

# Mipmap dimensions
$mipmapSizes = @{
    "mipmap-mdpi" = @{ icon = 48; fg = 108 }
    "mipmap-hdpi" = @{ icon = 72; fg = 162 }
    "mipmap-xhdpi" = @{ icon = 96; fg = 216 }
    "mipmap-xxhdpi" = @{ icon = 144; fg = 324 }
    "mipmap-xxxhdpi" = @{ icon = 192; fg = 432 }
}

foreach ($folder in $mipmapSizes.Keys) {
    $sizes = $mipmapSizes[$folder]
    $folderPath = Join-Path $baseDir $folder
    if (-not (Test-Path $folderPath)) { New-Item -ItemType Directory -Path $folderPath -Force | Out-Null }

    # Standard icon
    $icon = Draw-CupidIcon $sizes.icon $sizes.icon $false $false
    $icon.Save((Join-Path $folderPath "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $icon.Dispose()

    # Round icon
    $roundIcon = Draw-CupidIcon $sizes.icon $sizes.icon $true $false
    $roundIcon.Save((Join-Path $folderPath "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $roundIcon.Dispose()

    # Foreground icon
    $fgIcon = Draw-CupidIcon $sizes.fg $sizes.fg $false $true
    $fgIcon.Save((Join-Path $folderPath "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $fgIcon.Dispose()

    Write-Host "Generated icons for $folder"
}

# Splash screen dimensions
$splashSizes = @{
    "drawable" = @{ w = 480; h = 800 }
    "drawable-port-mdpi" = @{ w = 320; h = 480 }
    "drawable-port-hdpi" = @{ w = 480; h = 800 }
    "drawable-port-xhdpi" = @{ w = 720; h = 1280 }
    "drawable-port-xxhdpi" = @{ w = 1080; h = 1920 }
    "drawable-port-xxxhdpi" = @{ w = 1440; h = 2560 }
    "drawable-land-mdpi" = @{ w = 480; h = 320 }
    "drawable-land-hdpi" = @{ w = 800; h = 480 }
    "drawable-land-xhdpi" = @{ w = 1280; h = 720 }
    "drawable-land-xxhdpi" = @{ w = 1920; h = 1080 }
    "drawable-land-xxxhdpi" = @{ w = 2560; h = 1440 }
}

foreach ($folder in $splashSizes.Keys) {
    $dim = $splashSizes[$folder]
    $folderPath = Join-Path $baseDir $folder
    if (-not (Test-Path $folderPath)) { New-Item -ItemType Directory -Path $folderPath -Force | Out-Null }

    $splash = Draw-CupidSplash $dim.w $dim.h
    $splash.Save((Join-Path $folderPath "splash.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $splash.Dispose()

    Write-Host "Generated splash for $folder ($($dim.w)x$($dim.h))"
}

Write-Host "All Android Icons & Splash screens successfully generated!"
