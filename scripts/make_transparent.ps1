Add-Type -ReferencedAssemblies "System.Drawing" -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;

public class ImageProcessor {
    public static void Process(string inputPath, string outputPath) {
        using (Bitmap src = new Bitmap(inputPath)) {
            int w = src.Width;
            int h = src.Height;
            Bitmap dst = new Bitmap(w, h, PixelFormat.Format32bppArgb);

            // Read all pixels into buffer
            BitmapData srcData = src.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            BitmapData dstData = dst.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

            int stride = srcData.Stride;
            int bytes = Math.Abs(stride) * h;
            byte[] rgbValues = new byte[bytes];
            byte[] dstValues = new byte[bytes];

            System.Runtime.InteropServices.Marshal.Copy(srcData.Scan0, rgbValues, 0, bytes);
            src.UnlockBits(srcData);

            // Sample corner background color (0,0)
            byte bgB = rgbValues[0];
            byte bgG = rgbValues[1];
            byte bgR = rgbValues[2];

            // BFS flood fill from borders to identify outer background
            bool[,] isBg = new bool[w, h];
            bool[,] visited = new bool[w, h];
            Queue<Point> q = new Queue<Point>();

            for (int x = 0; x < w; x++) {
                q.Enqueue(new Point(x, 0));
                q.Enqueue(new Point(x, h - 1));
                visited[x, 0] = true;
                visited[x, h - 1] = true;
            }
            for (int y = 0; y < h; y++) {
                if (!visited[0, y]) { q.Enqueue(new Point(0, y)); visited[0, y] = true; }
                if (!visited[w - 1, y]) { q.Enqueue(new Point(w - 1, y)); visited[w - 1, y] = true; }
            }

            int[] dx = { 1, -1, 0, 0 };
            int[] dy = { 0, 0, 1, -1 };

            while (q.Count > 0) {
                Point pt = q.Dequeue();
                int idx = pt.Y * stride + pt.X * 4;
                byte b = rgbValues[idx];
                byte g = rgbValues[idx + 1];
                byte r = rgbValues[idx + 2];

                // Check if background pixel: near corner or near-white / soft shadow (R,G,B > 220)
                int diff = Math.Max(Math.Abs(r - bgR), Math.Max(Math.Abs(g - bgG), Math.Abs(b - bgB)));
                bool bgMatch = diff <= 40 || (r >= 220 && g >= 220 && b >= 220 && Math.Abs(r - b) <= 12 && Math.Abs(g - b) <= 12);

                if (bgMatch) {
                    isBg[pt.X, pt.Y] = true;

                    for (int i = 0; i < 4; i++) {
                        int nx = pt.X + dx[i];
                        int ny = pt.Y + dy[i];
                        if (nx >= 0 && nx < w && ny >= 0 && ny < h && !visited[nx, ny]) {
                            visited[nx, ny] = true;
                            q.Enqueue(new Point(nx, ny));
                        }
                    }
                }
            }

            // Copy to dst
            for (int y = 0; y < h; y++) {
                for (int x = 0; x < w; x++) {
                    int idx = y * stride + x * 4;
                    if (isBg[x, y]) {
                        dstValues[idx] = 255;     // B
                        dstValues[idx + 1] = 255; // G
                        dstValues[idx + 2] = 255; // R
                        dstValues[idx + 3] = 0;   // Alpha = 0 (completely transparent)
                    } else {
                        dstValues[idx] = rgbValues[idx];
                        dstValues[idx + 1] = rgbValues[idx + 1];
                        dstValues[idx + 2] = rgbValues[idx + 2];
                        dstValues[idx + 3] = 255; // Alpha = 255
                    }
                }
            }

            System.Runtime.InteropServices.Marshal.Copy(dstValues, 0, dstData.Scan0, bytes);
            dst.UnlockBits(dstData);

            dst.Save(outputPath, ImageFormat.Png);
            dst.Dispose();
        }
        Console.WriteLine("Successfully created transparent image: " + outputPath);
    }
}
"@

$srcPayments = "C:\Users\XYZ-Studio\.gemini\antigravity-ide\brain\750fa5bf-50f8-47ea-a768-5e11a92dce2c\pure_white_empty_payments_1791955556731.jpg"
$srcVisits = "C:\Users\XYZ-Studio\.gemini\antigravity-ide\brain\750fa5bf-50f8-47ea-a768-5e11a92dce2c\pure_white_empty_visits_clean_1791955656715.jpg"

[ImageProcessor]::Process($srcPayments, (Resolve-Path "assets/images/empty-payments.png").Path)
[ImageProcessor]::Process($srcVisits, (Resolve-Path "assets/images/empty-visits.png").Path)
