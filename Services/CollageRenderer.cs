using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using Collager.Models;

namespace Collager.Services;

public sealed class CollageRenderer
{
    public async Task RenderAsync(
        IReadOnlyCollection<IFormFile> files,
        CollageOptions options,
        Stream output,
        CancellationToken cancellationToken)
    {
        if (files.Count == 0)
        {
            throw new InvalidDataException("请至少选择一张图片。");
        }

        var imageBuffers = new List<MemoryStream>();
        var images = new List<Image>();

        try
        {
            foreach (var file in files)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var buffer = new MemoryStream();
                await using (var source = file.OpenReadStream())
                {
                    await source.CopyToAsync(buffer, cancellationToken);
                }

                buffer.Position = 0;
                imageBuffers.Add(buffer);
                images.Add(Image.FromStream(buffer, useEmbeddedColorManagement: true, validateImageData: true));
            }

            using var bitmap = Render(images, options);
            bitmap.Save(output, ImageFormat.Png);
            output.Position = 0;
        }
        finally
        {
            foreach (var image in images)
            {
                image.Dispose();
            }

            foreach (var buffer in imageBuffers)
            {
                buffer.Dispose();
            }
        }
    }

    private static Bitmap Render(IReadOnlyList<Image> images, CollageOptions options)
    {
        var layout = CreateLayout(images, options);
        var canvas = new Bitmap(options.OutputWidth, options.OutputHeight, PixelFormat.Format32bppArgb);
        canvas.SetResolution(96, 96);

        using var graphics = Graphics.FromImage(canvas);
        graphics.SmoothingMode = SmoothingMode.AntiAlias;
        graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
        graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
        graphics.CompositingQuality = CompositingQuality.HighQuality;
        graphics.Clear(options.BackgroundColor);

        for (var index = 0; index < images.Count; index++)
        {
            var placement = index < options.Placements.Count ? options.Placements[index] : null;
            DrawImageCard(graphics, images[index], layout[index], options, placement);
        }

        return canvas;
    }

    private static List<RectangleF> CreateLayout(IReadOnlyList<Image> images, CollageOptions options)
    {
        if (IsEqualGridTemplate(options.TemplateId))
        {
            return CreateEqualGridLayout(images.Count, options);
        }

        if (images.Count > 1 && !IsAutoTemplate(options.TemplateId))
        {
            var content = GetContentBounds(options);
            if (TryCreateCustomTemplateLayout(options, images.Count, content, out var customTemplateLayout))
            {
                return customTemplateLayout;
            }

            if (CollageTemplateCatalog.TryCreateLayout(options.TemplateId, images.Count, content, options.Gap, out var templateLayout))
            {
                return templateLayout;
            }
        }

        return CreateAutoGridLayout(images, options);
    }

    private static List<RectangleF> CreateEqualGridLayout(int count, CollageOptions options)
    {
        var content = GetContentBounds(options);
        var ratio = Math.Clamp(options.EqualGridRatio, 0.35d, 2.8d);
        var columns = ChooseEqualGridColumns(count, content, options.Gap, ratio);
        var rows = (int)Math.Ceiling(count / (double)columns);
        var cellWidthByContent = (content.Width - options.Gap * Math.Max(0, columns - 1)) / columns;
        var cellHeightByContent = (content.Height - options.Gap * Math.Max(0, rows - 1)) / rows;
        var cellWidth = (float)Math.Max(1, Math.Min(cellWidthByContent, cellHeightByContent * ratio));
        var cellHeight = (float)Math.Max(1, cellWidth / ratio);
        var gridHeight = cellHeight * rows + options.Gap * Math.Max(0, rows - 1);
        var y = content.Y + Math.Max(0, (content.Height - gridHeight) / 2f);
        var rectangles = new List<RectangleF>(count);

        for (var index = 0; index < count; index++)
        {
            var row = index / columns;
            var column = index % columns;
            var remaining = count - row * columns;
            var cellsInRow = Math.Min(columns, remaining);
            var rowWidth = cellWidth * cellsInRow + options.Gap * Math.Max(0, cellsInRow - 1);
            var x = content.X + Math.Max(0, (content.Width - rowWidth) / 2f);

            rectangles.Add(new RectangleF(
                x + column * (cellWidth + options.Gap),
                y + row * (cellHeight + options.Gap),
                cellWidth,
                cellHeight));
        }

        return rectangles;
    }

    private static int ChooseEqualGridColumns(int count, RectangleF content, int gap, double ratio)
    {
        var bestColumns = 1;
        var bestScore = double.MaxValue;

        for (var columns = 1; columns <= count; columns++)
        {
            var rows = (int)Math.Ceiling(count / (double)columns);
            var cellWidthByContent = (content.Width - gap * Math.Max(0, columns - 1)) / columns;
            var cellHeightByContent = (content.Height - gap * Math.Max(0, rows - 1)) / rows;
            if (cellWidthByContent <= 0 || cellHeightByContent <= 0)
            {
                continue;
            }

            var cellWidth = Math.Min(cellWidthByContent, cellHeightByContent * ratio);
            var cellHeight = cellWidth / ratio;
            var gridWidth = cellWidth * columns + gap * Math.Max(0, columns - 1);
            var gridHeight = cellHeight * rows + gap * Math.Max(0, rows - 1);
            var unusedArea = Math.Max(0, content.Width * content.Height - gridWidth * gridHeight) / Math.Max(1, content.Width * content.Height);
            var shapeScore = Math.Abs(Math.Log((gridWidth / Math.Max(1, gridHeight)) / (content.Width / Math.Max(1, content.Height))));
            var balanceScore = GetEqualGridBalanceScore(count, columns);
            var score = unusedArea + shapeScore * 0.22d + balanceScore;

            if (score < bestScore)
            {
                bestScore = score;
                bestColumns = columns;
            }
        }

        return bestColumns;
    }

    private static double GetEqualGridBalanceScore(int count, int columns)
    {
        var rows = (int)Math.Ceiling(count / (double)columns);
        var lastRowCount = count - columns * (rows - 1);
        var rowDifference = columns - lastRowCount;
        var orphanPenalty = rows > 1 && lastRowCount == 1 ? 1.2d : 0d;
        var sparseLastRowPenalty = rows > 1 ? Math.Pow(rowDifference / (double)columns, 2) * 0.9d : 0d;
        var columnRowBalance = Math.Abs(columns - rows) / (double)Math.Max(columns, rows) * 0.08d;

        return orphanPenalty + sparseLastRowPenalty + columnRowBalance;
    }

    private static bool TryCreateCustomTemplateLayout(
        CollageOptions options,
        int imageCount,
        RectangleF content,
        out List<RectangleF> layout)
    {
        layout = [];

        if (options.TemplateCells.Count != imageCount)
        {
            return false;
        }

        var columns = Math.Max(1, options.TemplateColumns);
        var rows = Math.Max(1, options.TemplateRows);
        var unitWidth = (content.Width - options.Gap * (columns - 1)) / columns;
        var unitHeight = (content.Height - options.Gap * (rows - 1)) / rows;
        var rectangles = new List<RectangleF>(imageCount);

        foreach (var cell in options.TemplateCells)
        {
            if (cell.Column < 0
                || cell.Row < 0
                || cell.ColumnSpan <= 0
                || cell.RowSpan <= 0
                || cell.Column + cell.ColumnSpan > columns
                || cell.Row + cell.RowSpan > rows)
            {
                layout = [];
                return false;
            }

            rectangles.Add(new RectangleF(
                content.X + cell.Column * (unitWidth + options.Gap),
                content.Y + cell.Row * (unitHeight + options.Gap),
                cell.ColumnSpan * unitWidth + (cell.ColumnSpan - 1) * options.Gap,
                cell.RowSpan * unitHeight + (cell.RowSpan - 1) * options.Gap));
        }

        layout = rectangles;
        return true;
    }

    private static List<RectangleF> CreateAutoGridLayout(IReadOnlyList<Image> images, CollageOptions options)
    {
        var count = images.Count;
        var content = GetContentBounds(options);
        var rectangles = new List<RectangleF>(count);
        var imageAspects = images
            .Select(image => ClampAspect(image.Width / (double)Math.Max(1, image.Height)))
            .ToList();
        var rows = CreateAspectRows(imageAspects, content, options);
        var totalGapHeight = options.Gap * Math.Max(0, rows.Count - 1);
        var availableHeight = Math.Max(1, content.Height - totalGapHeight);
        var naturalHeights = rows
            .Select(row => GetNaturalRowHeight(row, content.Width, options.Gap))
            .ToList();
        var totalNaturalHeight = Math.Max(1, naturalHeights.Sum());
        var heightScale = Math.Min(1, availableHeight / totalNaturalHeight);
        var finalHeight = totalNaturalHeight * heightScale + totalGapHeight;
        var y = content.Y + Math.Max(0, (content.Height - (float)finalHeight) / 2f);

        for (var rowIndex = 0; rowIndex < rows.Count; rowIndex++)
        {
            var row = rows[rowIndex];
            var rowHeight = Math.Max(1, (float)(naturalHeights[rowIndex] * heightScale));
            var imageWidths = Enumerable.Range(row.Start, row.Count)
                .Select(index => (float)(imageAspects[index] * rowHeight))
                .ToList();
            var rowWidth = imageWidths.Sum() + options.Gap * Math.Max(0, row.Count - 1);
            var x = content.X + Math.Max(0, (content.Width - rowWidth) / 2f);

            for (var offset = 0; offset < row.Count; offset++)
            {
                var width = imageWidths[offset];
                rectangles.Add(new RectangleF(x, y, width, rowHeight));
                x += width + options.Gap;
            }

            y += rowHeight + options.Gap;
        }

        return rectangles;
    }

    private static List<AutoGridRow> CreateAspectRows(
        IReadOnlyList<double> imageAspects,
        RectangleF content,
        CollageOptions options)
    {
        var count = imageAspects.Count;
        if (count == 1)
        {
            return [new AutoGridRow(0, 1, imageAspects[0])];
        }

        var targetAspect = options.Mode switch
        {
            CollageMode.Square => 1d,
            CollageMode.Portrait => 0.75d,
            CollageMode.Landscape => 1.6d,
            _ => content.Width / Math.Max(1d, content.Height)
        };
        var targetRows = Math.Max(1, (int)Math.Round(Math.Sqrt(count / Math.Max(0.2d, targetAspect))));
        var minRows = Math.Max(1, targetRows - 2);
        var maxRows = Math.Min(count, targetRows + 2);
        List<AutoGridRow> bestRows = [];
        var bestScore = double.MaxValue;

        for (var rowCount = minRows; rowCount <= maxRows; rowCount++)
        {
            var rows = PartitionRows(imageAspects, content, options.Gap, rowCount);
            var rowHeights = rows.Select(row => GetNaturalRowHeight(row, content.Width, options.Gap)).ToList();
            var totalHeight = rowHeights.Sum() + options.Gap * Math.Max(0, rows.Count - 1);
            var heightScore = Math.Abs(Math.Log(totalHeight / Math.Max(1d, content.Height)));
            var balanceScore = rowHeights.Average(height => Math.Abs(Math.Log(height / Math.Max(1d, content.Height / rowCount))));
            var score = heightScore + balanceScore * 0.35d;

            if (score < bestScore)
            {
                bestScore = score;
                bestRows = rows;
            }
        }

        return bestRows;
    }

    private static List<AutoGridRow> PartitionRows(
        IReadOnlyList<double> imageAspects,
        RectangleF content,
        int gap,
        int rowCount)
    {
        var count = imageAspects.Count;
        var prefix = new double[count + 1];
        for (var index = 0; index < count; index++)
        {
            prefix[index + 1] = prefix[index] + imageAspects[index];
        }

        var costs = new double[rowCount + 1, count + 1];
        var breaks = new int[rowCount + 1, count + 1];
        for (var row = 0; row <= rowCount; row++)
        {
            for (var index = 0; index <= count; index++)
            {
                costs[row, index] = double.PositiveInfinity;
            }
        }

        costs[0, 0] = 0;
        var targetHeight = Math.Max(1d, (content.Height - gap * Math.Max(0, rowCount - 1)) / rowCount);

        for (var row = 1; row <= rowCount; row++)
        {
            for (var index = row; index <= count; index++)
            {
                for (var previous = row - 1; previous < index; previous++)
                {
                    var aspectSum = prefix[index] - prefix[previous];
                    var itemCount = index - previous;
                    var naturalHeight = Math.Max(1d, (content.Width - gap * Math.Max(0, itemCount - 1)) / aspectSum);
                    var rowScore = Math.Pow(Math.Log(naturalHeight / targetHeight), 2);
                    var score = costs[row - 1, previous] + rowScore;

                    if (score < costs[row, index])
                    {
                        costs[row, index] = score;
                        breaks[row, index] = previous;
                    }
                }
            }
        }

        var rows = new List<AutoGridRow>(rowCount);
        var end = count;
        for (var row = rowCount; row >= 1; row--)
        {
            var start = breaks[row, end];
            rows.Add(new AutoGridRow(start, end - start, prefix[end] - prefix[start]));
            end = start;
        }

        rows.Reverse();
        return rows;
    }

    private static double GetNaturalRowHeight(AutoGridRow row, float contentWidth, int gap)
    {
        return Math.Max(1d, (contentWidth - gap * Math.Max(0, row.Count - 1)) / row.AspectSum);
    }

    private static RectangleF GetContentBounds(CollageOptions options)
    {
        return new RectangleF(
            options.OuterPadding,
            options.OuterPadding,
            Math.Max(1, options.OutputWidth - options.OuterPadding * 2),
            Math.Max(1, options.OutputHeight - options.OuterPadding * 2));
    }

    private static bool IsAutoTemplate(string? templateId)
    {
        return string.IsNullOrWhiteSpace(templateId)
            || string.Equals(templateId, "auto", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsEqualGridTemplate(string? templateId)
    {
        return string.Equals(templateId, "equal-grid", StringComparison.OrdinalIgnoreCase);
    }

    private static double ClampAspect(double aspect)
    {
        return Math.Clamp(aspect, 0.2d, 5d);
    }

    private static void DrawImageCard(
        Graphics graphics,
        Image image,
        RectangleF destination,
        CollageOptions options,
        ImagePlacement? placement)
    {
        var shadow = destination;
        shadow.Offset(0, Math.Max(2, options.Gap / 4f));
        using var shadowPath = RoundedRectangle(shadow, options.CornerRadius);
        using var shadowBrush = new SolidBrush(options.ShadowColor);
        graphics.FillPath(shadowBrush, shadowPath);

        using var clipPath = RoundedRectangle(destination, options.CornerRadius);
        var state = graphics.Save();
        graphics.SetClip(clipPath);
        graphics.DrawImage(image, destination, CreateCropFillSource(image, destination, placement), GraphicsUnit.Pixel);
        graphics.Restore(state);
    }

    private static RectangleF CreateCropFillSource(Image image, RectangleF destination, ImagePlacement? placement)
    {
        var sourceAspect = image.Width / (float)image.Height;
        var destinationAspect = destination.Width / destination.Height;
        var offsetX = Math.Clamp(placement?.OffsetX ?? 0, -1, 1);
        var offsetY = Math.Clamp(placement?.OffsetY ?? 0, -1, 1);
        var scale = Math.Clamp(placement?.Scale ?? 1, 1, 4);

        if (sourceAspect > destinationAspect)
        {
            var width = image.Height * destinationAspect / scale;
            var height = image.Height / scale;
            var maxX = image.Width - width;
            var maxY = image.Height - height;
            var x = maxX * (offsetX + 1f) / 2f;
            var y = maxY * (offsetY + 1f) / 2f;
            return new RectangleF(x, y, width, height);
        }

        var widthFallback = image.Width / scale;
        var heightFallback = image.Width / destinationAspect / scale;
        var maxXFallback = image.Width - widthFallback;
        var xFallback = maxXFallback * (offsetX + 1f) / 2f;
        var maxYFallback = image.Height - heightFallback;
        var yFallback = maxYFallback * (offsetY + 1f) / 2f;
        return new RectangleF(xFallback, yFallback, widthFallback, heightFallback);
    }

    private static GraphicsPath RoundedRectangle(RectangleF bounds, float radius)
    {
        var path = new GraphicsPath();
        var diameter = Math.Max(0, radius * 2);

        if (diameter <= 0)
        {
            path.AddRectangle(bounds);
            path.CloseFigure();
            return path;
        }

        diameter = Math.Min(diameter, Math.Min(bounds.Width, bounds.Height));
        var arc = new RectangleF(bounds.Location, new SizeF(diameter, diameter));

        path.AddArc(arc, 180, 90);
        arc.X = bounds.Right - diameter;
        path.AddArc(arc, 270, 90);
        arc.Y = bounds.Bottom - diameter;
        path.AddArc(arc, 0, 90);
        arc.X = bounds.Left;
        path.AddArc(arc, 90, 90);
        path.CloseFigure();

        return path;
    }

    private sealed record AutoGridRow(int Start, int Count, double AspectSum);
}
