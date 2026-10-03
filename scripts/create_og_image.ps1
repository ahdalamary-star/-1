Add-Type -AssemblyName System.Drawing

$width = 1200
$height = 630
$bmp = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Background Gradient
$rect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
$c1 = [System.Drawing.Color]::FromArgb(255, 10, 15, 30)
$c2 = [System.Drawing.Color]::FromArgb(255, 30, 27, 75)
$gradientBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $c1, $c2, [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
$g.FillRectangle($gradientBrush, $rect)

# Draw decorative glowing circle in top right
$glowColor = [System.Drawing.Color]::FromArgb(40, 99, 102, 241)
$glowBrush = New-Object System.Drawing.SolidBrush $glowColor
$g.FillEllipse($glowBrush, 850, -100, 500, 500)
$g.FillEllipse($glowBrush, -150, 350, 450, 450)

# Inner Glassmorphism Card
$cardRect = New-Object System.Drawing.Rectangle 80, 60, 1040, 510
$cardBg = [System.Drawing.Color]::FromArgb(180, 20, 24, 45)
$cardBrush = New-Object System.Drawing.SolidBrush $cardBg
$cardPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(80, 129, 140, 248)), 2
$g.FillRectangle($cardBrush, $cardRect)
$g.DrawRectangle($cardPen, $cardRect)

# Fonts
$fontFamily = "Segoe UI"
$titleFont = New-Object System.Drawing.Font $fontFamily, 44, [System.Drawing.FontStyle]::Bold
$subFont = New-Object System.Drawing.Font $fontFamily, 22, [System.Drawing.FontStyle]::Regular
$badgeFont = New-Object System.Drawing.Font $fontFamily, 14, [System.Drawing.FontStyle]::Bold
$brandFont = New-Object System.Drawing.Font $fontFamily, 16, [System.Drawing.FontStyle]::Regular

# Brushes
$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$accentBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 167, 139, 250))
$mutedBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 199, 210, 254))

$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center

# Brand Tag
$g.DrawString("AL-AHAD PRODUCTION PLATFORM | منظومة العهد", $brandFont, $accentBrush, 600, 130, $format)

# Main Title
$g.DrawString("منظومة العهد لإدارة الاستوديوهات والإنتاج", $titleFont, $whiteBrush, 600, 210, $format)

# Subtitle
$g.DrawString("المنصة الذكية المتكاملة للحجوزات، طواقم التصوير، العقود، والعمليات الميدانية", $subFont, $mutedBrush, 600, 285, $format)

# Feature Badges
$badges = @(
    "إدارة الحجوزات والمواعيد",
    "بوابة المصورين والمهام",
    "بوابة العميل التفاعلية",
    "الماليات والعقود الرقمية",
    "الذكاء الاصطناعي LensFlow AI"
)

$startX = 160
$badgeWidth = 160
$gap = 20
$badgeY = 380

for ($i = 0; $i -lt $badges.Length; $i++) {
    $bx = $startX + ($i * ($badgeWidth + $gap))
    $bRect = New-Object System.Drawing.Rectangle $bx, $badgeY, $badgeWidth, 54
    $bBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(120, 67, 56, 202))
    $bPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(150, 129, 140, 248)), 1.5
    $g.FillRectangle($bBg, $bRect)
    $g.DrawRectangle($bPen, $bRect)
    
    $badgeTextRect = New-Object System.Drawing.RectangleF $bx, $badgeY, $badgeWidth, 54
    $g.DrawString($badges[$i], $badgeFont, $whiteBrush, $badgeTextRect, $format)
}

# Footer status
$footerFormat = New-Object System.Drawing.StringFormat
$footerFormat.Alignment = [System.Drawing.StringAlignment]::Center
$g.DrawString("Progressive Web App (PWA) | دعم كامل لجميع الأجهزة والمواقع والسوشيال ميديا", $brandFont, $mutedBrush, 600, 500, $footerFormat)

$outputPath = "C:\Users\HONOR\.gemini\antigravity\scratch\al-ahad-app\public\og-image.png"
$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$bmp.Dispose()
$g.Dispose()

Write-Host "Created Open Graph social preview image at: $outputPath"
