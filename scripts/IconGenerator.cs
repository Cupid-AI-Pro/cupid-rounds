using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public class MipmapItem {
    public string Folder;
    public int Size;
    public MipmapItem(string f, int s) { Folder = f; Size = s; }
}

public class IconGenerator {
    // Creates the Cupid icon: White circle bg + BOLD crimson C arc + solid crimson heart
    public static Bitmap CreateCupidIcon(int size) {
        Bitmap bmp = new Bitmap(size, size, PixelFormat.Format32bppArgb);
        using (Graphics g = Graphics.FromImage(bmp)) {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.Clear(Color.Transparent);

            Color crimson = ColorTranslator.FromHtml("#FF2D55");
            float cx = size / 2f;
            float cy = size / 2f;
            float r = size / 2f;

            // --- 1. White rounded square background (fills entire icon) ---
            using (SolidBrush bgBrush = new SolidBrush(Color.White)) {
                float corner = size * 0.22f;
                DrawRoundedRect(g, bgBrush, 0, 0, size, size, corner);
            }

            // --- 2. Bold 'C' arc ---
            // C arc radius: 35% of icon size
            float arcRadius = size * 0.30f;
            // Stroke: 14% of icon size — VERY BOLD
            float strokeW = size * 0.13f;

            using (Pen pen = new Pen(crimson, strokeW)) {
                pen.StartCap = LineCap.Round;
                pen.EndCap = LineCap.Round;
                // Draw arc from 50° to 310° (260° sweep) = open C facing right
                float left = cx - arcRadius;
                float top = cy - arcRadius;
                float diameter = arcRadius * 2f;
                // startAngle=50, sweepAngle=260 → opens to the right like "C"
                g.DrawArc(pen, left, top, diameter, diameter, 50f, 260f);
            }

            // --- 3. Solid Heart centered ---
            float hs = size * 0.18f;  // heart half-width scale
            float hcx = cx;
            float hcy = cy + (size * 0.02f); // slightly below center

            using (SolidBrush hBrush = new SolidBrush(crimson)) {
                GraphicsPath heart = BuildHeart(hcx, hcy, hs);
                g.FillPath(hBrush, heart);
                heart.Dispose();
            }
        }
        return bmp;
    }

    static void DrawRoundedRect(Graphics g, Brush brush, float x, float y, float w, float h, float r) {
        using (GraphicsPath path = new GraphicsPath()) {
            path.AddArc(x, y, r * 2, r * 2, 180, 90);
            path.AddArc(x + w - r * 2, y, r * 2, r * 2, 270, 90);
            path.AddArc(x + w - r * 2, y + h - r * 2, r * 2, r * 2, 0, 90);
            path.AddArc(x, y + h - r * 2, r * 2, r * 2, 90, 90);
            path.CloseFigure();
            g.FillPath(brush, path);
        }
    }

    static GraphicsPath BuildHeart(float cx, float cy, float scale) {
        GraphicsPath p = new GraphicsPath();
        // Two bezier lobes forming a heart
        float w = scale;
        float h = scale;
        // Left lobe
        p.AddBezier(
            new PointF(cx, cy + h * 0.9f),
            new PointF(cx - w * 1.1f, cy + h * 0.5f),
            new PointF(cx - w * 1.4f, cy - h * 0.5f),
            new PointF(cx, cy - h * 0.15f)
        );
        // Right lobe
        p.AddBezier(
            new PointF(cx, cy - h * 0.15f),
            new PointF(cx + w * 1.4f, cy - h * 0.5f),
            new PointF(cx + w * 1.1f, cy + h * 0.5f),
            new PointF(cx, cy + h * 0.9f)
        );
        p.CloseFigure();
        return p;
    }

    public static Bitmap CreateSplash(int width, int height) {
        Bitmap bmp = new Bitmap(width, height);
        using (Graphics g = Graphics.FromImage(bmp)) {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.Clear(ColorTranslator.FromHtml("#0b1120"));

            Color crimson = ColorTranslator.FromHtml("#FF2D55");
            float minDim = Math.Min(width, height);
            float cx = width / 2f;
            float cy = height / 2f - (minDim * 0.06f);
            float iconSize = minDim * 0.32f;

            float left = cx - iconSize / 2f;
            float top = cy - iconSize / 2f;

            // White circle bg
            using (SolidBrush wb = new SolidBrush(Color.White)) {
                g.FillEllipse(wb, left, top, iconSize, iconSize);
            }

            // Bold C arc
            float arcRadius = iconSize * 0.30f;
            float strokeW = iconSize * 0.13f;
            using (Pen pen = new Pen(crimson, strokeW)) {
                pen.StartCap = LineCap.Round;
                pen.EndCap = LineCap.Round;
                g.DrawArc(pen, cx - arcRadius, cy - arcRadius, arcRadius * 2f, arcRadius * 2f, 50f, 260f);
            }

            // Heart
            float hs = iconSize * 0.18f;
            using (SolidBrush hBrush = new SolidBrush(crimson)) {
                GraphicsPath heart = BuildHeart(cx, cy + (iconSize * 0.02f), hs);
                g.FillPath(hBrush, heart);
                heart.Dispose();
            }

            // "cupid." wordmark
            float fontSize = Math.Max(12f, minDim * 0.065f);
            using (Font font = new Font("Arial", fontSize, FontStyle.Bold))
            using (SolidBrush tb = new SolidBrush(Color.White))
            using (StringFormat sf = new StringFormat()) {
                sf.Alignment = StringAlignment.Center;
                sf.LineAlignment = StringAlignment.Center;
                g.DrawString("cupid.", font, tb, cx, cy + iconSize * 0.7f, sf);
            }
        }
        return bmp;
    }

    public static void GenerateAll(string baseResDir) {
        MipmapItem[] mipmaps = new MipmapItem[] {
            new MipmapItem("mipmap-mdpi",    48),
            new MipmapItem("mipmap-hdpi",    72),
            new MipmapItem("mipmap-xhdpi",   96),
            new MipmapItem("mipmap-xxhdpi",  144),
            new MipmapItem("mipmap-xxxhdpi", 192)
        };

        foreach (MipmapItem m in mipmaps) {
            string dir = Path.Combine(baseResDir, m.Folder);
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

            // Square version
            using (Bitmap bmp = CreateCupidIcon(m.Size)) {
                bmp.Save(Path.Combine(dir, "ic_launcher.png"), ImageFormat.Png);
            }
            // Round version (same design, Android clips to circle)
            using (Bitmap bmp = CreateCupidIcon(m.Size)) {
                bmp.Save(Path.Combine(dir, "ic_launcher_round.png"), ImageFormat.Png);
            }
            // Foreground PNG for adaptive icon (transparent bg)
            using (Bitmap bmp = CreateCupidIconForeground(m.Size * 2)) {
                bmp.Save(Path.Combine(dir, "ic_launcher_foreground.png"), ImageFormat.Png);
            }
            Console.WriteLine("Generated: " + m.Folder + " @ " + m.Size + "px");
        }

        // Splash screens
        int[][] splashes = new int[][] {
            new int[]{480,800}, new int[]{720,1280}, new int[]{1080,1920}, new int[]{1440,2560}
        };
        string drawableDir = Path.Combine(baseResDir, "drawable");
        if (!Directory.Exists(drawableDir)) Directory.CreateDirectory(drawableDir);
        using (Bitmap bmp = CreateSplash(1080, 1920)) {
            bmp.Save(Path.Combine(drawableDir, "splash.png"), ImageFormat.Png);
            Console.WriteLine("Generated: splash.png");
        }
        Console.WriteLine("ALL DONE!");
    }

    // Foreground-only (transparent background) for adaptive icon
    public static Bitmap CreateCupidIconForeground(int size) {
        Bitmap bmp = new Bitmap(size, size, PixelFormat.Format32bppArgb);
        using (Graphics g = Graphics.FromImage(bmp)) {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.Clear(Color.Transparent);

            Color crimson = ColorTranslator.FromHtml("#FF2D55");
            float cx = size / 2f;
            float cy = size / 2f;

            // Sized to fit within 72dp safe zone (66% of 108dp canvas)
            float safeFactor = 0.40f;
            float arcRadius = size * safeFactor * 0.50f;
            float strokeW = size * safeFactor * 0.22f;

            using (Pen pen = new Pen(crimson, strokeW)) {
                pen.StartCap = LineCap.Round;
                pen.EndCap = LineCap.Round;
                g.DrawArc(pen, cx - arcRadius, cy - arcRadius, arcRadius * 2f, arcRadius * 2f, 50f, 260f);
            }

            float hs = size * safeFactor * 0.30f;
            using (SolidBrush hBrush = new SolidBrush(crimson)) {
                GraphicsPath heart = BuildHeart(cx, cy + (size * 0.025f), hs);
                g.FillPath(hBrush, heart);
                heart.Dispose();
            }
        }
        return bmp;
    }
}
