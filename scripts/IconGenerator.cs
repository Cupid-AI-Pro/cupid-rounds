using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public class MipmapItem {
    public string Folder;
    public int IconSize;
    public int FgSize;
    public MipmapItem(string f, int i, int fg) { Folder = f; IconSize = i; FgSize = fg; }
}

public class SplashItem {
    public string Folder;
    public int W;
    public int H;
    public SplashItem(string f, int w, int h) { Folder = f; W = w; H = h; }
}

public class IconGenerator {
    public static Bitmap CreateCupidIcon(int width, int height, bool isRound, bool isForegroundOnly) {
        Bitmap bmp = new Bitmap(width, height);
        using (Graphics g = Graphics.FromImage(bmp)) {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;

            Color crimson = ColorTranslator.FromHtml("#FF2D55");
            Color white = Color.White;

            if (!isForegroundOnly) {
                g.Clear(Color.Transparent);
                using (SolidBrush bgBrush = new SolidBrush(white)) {
                    if (isRound) {
                        g.FillEllipse(bgBrush, 1, 1, width - 2, height - 2);
                    } else {
                        using (GraphicsPath path = new GraphicsPath()) {
                            int r = Math.Max(4, (int)(width * 0.22));
                            int d = r * 2;
                            Rectangle rect = new Rectangle(1, 1, width - 2, height - 2);
                            path.AddArc(rect.X, rect.Y, d, d, 180, 90);
                            path.AddArc(rect.Right - d, rect.Y, d, d, 270, 90);
                            path.AddArc(rect.Right - d, rect.Bottom - d, d, d, 0, 90);
                            path.AddArc(rect.X, rect.Bottom - d, d, d, 90, 90);
                            path.CloseFigure();
                            g.FillPath(bgBrush, path);
                        }
                    }
                }
            } else {
                g.Clear(Color.Transparent);
            }

            float cx = width / 2f;
            float cy = height / 2f;
            float scale = width / 100f;

            // 1. Draw Outer C arc
            float strokeW = Math.Max(2f, 7.5f * scale);
            using (Pen pen = new Pen(crimson, strokeW)) {
                pen.StartCap = LineCap.Round;
                pen.EndCap = LineCap.Round;
                float cRadius = 26f * scale;
                g.DrawArc(pen, cx - cRadius, cy - cRadius, cRadius * 2, cRadius * 2, 45f, 270f);
            }

            // 2. Draw Centered Solid Heart
            using (SolidBrush hBrush = new SolidBrush(crimson)) {
                using (GraphicsPath hPath = new GraphicsPath()) {
                    float hs = scale * 0.85f;
                    float hx = cx;
                    float hy = cy - (2f * scale);

                    PointF pBottom = new PointF(hx, hy + (16f * hs));
                    PointF pLeftLobe = new PointF(hx - (16f * hs), hy - (5f * hs));
                    PointF pCleft = new PointF(hx, hy - (7f * hs));
                    PointF pRightLobe = new PointF(hx + (16f * hs), hy - (5f * hs));

                    hPath.AddBezier(
                        pBottom,
                        new PointF(hx - (1f * hs), hy + (15f * hs)),
                        new PointF(hx - (16f * hs), hy + (4f * hs)),
                        pLeftLobe
                    );
                    hPath.AddBezier(
                        pLeftLobe,
                        new PointF(hx - (16f * hs), hy - (12f * hs)),
                        new PointF(hx - (4f * hs), hy - (14f * hs)),
                        pCleft
                    );
                    hPath.AddBezier(
                        pCleft,
                        new PointF(hx + (4f * hs), hy - (14f * hs)),
                        new PointF(hx + (16f * hs), hy - (12f * hs)),
                        pRightLobe
                    );
                    hPath.AddBezier(
                        pRightLobe,
                        new PointF(hx + (16f * hs), hy + (4f * hs)),
                        new PointF(hx + (1f * hs), hy + (15f * hs)),
                        pBottom
                    );
                    hPath.CloseFigure();
                    g.FillPath(hBrush, hPath);
                }
            }
        }
        return bmp;
    }

    public static Bitmap CreateCupidSplash(int width, int height) {
        Bitmap bmp = new Bitmap(width, height);
        using (Graphics g = Graphics.FromImage(bmp)) {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;

            Color bg = ColorTranslator.FromHtml("#0b1120");
            Color crimson = ColorTranslator.FromHtml("#FF2D55");
            Color white = Color.White;

            g.Clear(bg);

            float minDim = Math.Min(width, height);
            float cx = width / 2f;
            float cy = (height / 2f) - (minDim * 0.04f);
            float scale = minDim / 380f;

            // 1. Draw Outer C arc
            float strokeW = Math.Max(3f, 10f * scale);
            using (Pen pen = new Pen(crimson, strokeW)) {
                pen.StartCap = LineCap.Round;
                pen.EndCap = LineCap.Round;
                float cRadius = 36f * scale;
                g.DrawArc(pen, cx - cRadius, cy - cRadius, cRadius * 2, cRadius * 2, 45f, 270f);
            }

            // 2. Draw Centered Solid Heart
            using (SolidBrush hBrush = new SolidBrush(crimson)) {
                using (GraphicsPath hPath = new GraphicsPath()) {
                    float hs = scale * 1.15f;
                    float hx = cx;
                    float hy = cy - (2f * scale);

                    PointF pBottom = new PointF(hx, hy + (16f * hs));
                    PointF pLeftLobe = new PointF(hx - (16f * hs), hy - (5f * hs));
                    PointF pCleft = new PointF(hx, hy - (7f * hs));
                    PointF pRightLobe = new PointF(hx + (16f * hs), hy - (5f * hs));

                    hPath.AddBezier(
                        pBottom,
                        new PointF(hx - (1f * hs), hy + (15f * hs)),
                        new PointF(hx - (16f * hs), hy + (4f * hs)),
                        pLeftLobe
                    );
                    hPath.AddBezier(
                        pLeftLobe,
                        new PointF(hx - (16f * hs), hy - (12f * hs)),
                        new PointF(hx - (4f * hs), hy - (14f * hs)),
                        pCleft
                    );
                    hPath.AddBezier(
                        pCleft,
                        new PointF(hx + (4f * hs), hy - (14f * hs)),
                        new PointF(hx + (16f * hs), hy - (12f * hs)),
                        pRightLobe
                    );
                    hPath.AddBezier(
                        pRightLobe,
                        new PointF(hx + (16f * hs), hy + (4f * hs)),
                        new PointF(hx + (1f * hs), hy + (15f * hs)),
                        pBottom
                    );
                    hPath.CloseFigure();
                    g.FillPath(hBrush, hPath);
                }
            }

            // 3. Draw Wordmark Text
            float fontSize = Math.Max(14f, 32f * scale);
            using (Font font = new Font("Arial", fontSize, FontStyle.Bold)) {
                using (SolidBrush textBrush = new SolidBrush(white)) {
                    using (StringFormat sf = new StringFormat()) {
                        sf.Alignment = StringAlignment.Center;
                        sf.LineAlignment = StringAlignment.Center;
                        float textY = cy + (36f * scale) + (28f * scale);
                        g.DrawString("cupid.", font, textBrush, cx, textY, sf);
                    }
                }
            }
        }
        return bmp;
    }

    public static void GenerateAll(string baseResDir) {
        // 1. Mipmap Icons
        MipmapItem[] mipmaps = new MipmapItem[] {
            new MipmapItem("mipmap-mdpi", 48, 108),
            new MipmapItem("mipmap-hdpi", 72, 162),
            new MipmapItem("mipmap-xhdpi", 96, 216),
            new MipmapItem("mipmap-xxhdpi", 144, 324),
            new MipmapItem("mipmap-xxxhdpi", 192, 432)
        };

        foreach (MipmapItem m in mipmaps) {
            string dir = Path.Combine(baseResDir, m.Folder);
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

            using (Bitmap bmp = CreateCupidIcon(m.IconSize, m.IconSize, false, false)) {
                bmp.Save(Path.Combine(dir, "ic_launcher.png"), ImageFormat.Png);
            }
            using (Bitmap bmp = CreateCupidIcon(m.IconSize, m.IconSize, true, false)) {
                bmp.Save(Path.Combine(dir, "ic_launcher_round.png"), ImageFormat.Png);
            }
            using (Bitmap bmp = CreateCupidIcon(m.FgSize, m.FgSize, false, true)) {
                bmp.Save(Path.Combine(dir, "ic_launcher_foreground.png"), ImageFormat.Png);
            }
            Console.WriteLine("Generated: " + m.Folder);
        }

        // 2. Splash Screens
        SplashItem[] splashes = new SplashItem[] {
            new SplashItem("drawable", 480, 800),
            new SplashItem("drawable-port-mdpi", 320, 480),
            new SplashItem("drawable-port-hdpi", 480, 800),
            new SplashItem("drawable-port-xhdpi", 720, 1280),
            new SplashItem("drawable-port-xxhdpi", 1080, 1920),
            new SplashItem("drawable-port-xxxhdpi", 1440, 2560),
            new SplashItem("drawable-land-mdpi", 480, 320),
            new SplashItem("drawable-land-hdpi", 800, 480),
            new SplashItem("drawable-land-xhdpi", 1280, 720),
            new SplashItem("drawable-land-xxhdpi", 1920, 1080),
            new SplashItem("drawable-land-xxxhdpi", 2560, 1440)
        };

        foreach (SplashItem s in splashes) {
            string dir = Path.Combine(baseResDir, s.Folder);
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

            using (Bitmap bmp = CreateCupidSplash(s.W, s.H)) {
                bmp.Save(Path.Combine(dir, "splash.png"), ImageFormat.Png);
            }
            Console.WriteLine("Generated Splash: " + s.Folder + " (" + s.W + "x" + s.H + ")");
        }
    }
}
