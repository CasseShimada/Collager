using System.Drawing;

namespace MeiTool.Services;

public static class CollageTemplateCatalog
{
    private static readonly Dictionary<string, GridTemplate> Templates = CreateTemplates();

    public static bool TryCreateLayout(string templateId, int imageCount, RectangleF content, int gap, out List<RectangleF> layout)
    {
        layout = [];

        if (!Templates.TryGetValue(templateId, out var template) || template.ImageCount != imageCount)
        {
            return false;
        }

        var unitWidth = (content.Width - gap * (template.Columns - 1)) / template.Columns;
        var unitHeight = (content.Height - gap * (template.Rows - 1)) / template.Rows;

        layout = template.Cells
            .Select(cell => new RectangleF(
                content.X + cell.Column * (unitWidth + gap),
                content.Y + cell.Row * (unitHeight + gap),
                cell.ColumnSpan * unitWidth + (cell.ColumnSpan - 1) * gap,
                cell.RowSpan * unitHeight + (cell.RowSpan - 1) * gap))
            .ToList();

        return true;
    }

    private static Dictionary<string, GridTemplate> CreateTemplates()
    {
        var templates = new[]
        {
            T("2-vsplit", 2, 6, 6, C(0, 0, 3, 6), C(3, 0, 3, 6)),
            T("2-hsplit", 2, 6, 6, C(0, 0, 6, 3), C(0, 3, 6, 3)),
            T("2-poster", 2, 6, 6, C(0, 0, 6, 4), C(0, 4, 6, 2)),
            T("2-corner", 2, 6, 6, C(0, 0, 4, 6), C(4, 3, 2, 3)),
            T("2-offset", 2, 6, 6, C(0, 0, 4, 4), C(2, 2, 4, 4)),

            T("3-left", 3, 6, 6, C(0, 0, 3, 6), C(3, 0, 3, 3), C(3, 3, 3, 3)),
            T("3-bottom", 3, 6, 6, C(0, 0, 6, 4), C(0, 4, 3, 2), C(3, 4, 3, 2)),
            T("3-top", 3, 6, 6, C(0, 0, 3, 3), C(3, 0, 3, 3), C(0, 3, 6, 3)),
            T("3-columns", 3, 6, 6, C(0, 0, 2, 6), C(2, 0, 2, 6), C(4, 0, 2, 6)),
            T("3-rows", 3, 6, 6, C(0, 0, 6, 2), C(0, 2, 6, 2), C(0, 4, 6, 2)),
            T("3-feature", 3, 6, 6, C(0, 0, 4, 6), C(4, 0, 2, 3), C(4, 3, 2, 3)),

            T("4-grid", 4, 6, 6, C(0, 0, 3, 3), C(3, 0, 3, 3), C(0, 3, 3, 3), C(3, 3, 3, 3)),
            T("4-mosaic", 4, 6, 6, C(0, 0, 4, 4), C(4, 0, 2, 2), C(4, 2, 2, 2), C(0, 4, 6, 2)),
            T("4-side", 4, 6, 6, C(0, 0, 3, 6), C(3, 0, 3, 2), C(3, 2, 3, 2), C(3, 4, 3, 2)),
            T("4-banner", 4, 6, 6, C(0, 0, 6, 2), C(0, 2, 2, 4), C(2, 2, 2, 4), C(4, 2, 2, 4)),
            T("4-stripes", 4, 6, 6, C(0, 0, 6, 1), C(0, 1, 6, 2), C(0, 3, 6, 1), C(0, 4, 6, 2)),
            T("4-vertical", 4, 6, 6, C(0, 0, 2, 6), C(2, 0, 1, 6), C(3, 0, 1, 6), C(4, 0, 2, 6)),
            T("4-stack", 4, 6, 6, C(0, 0, 6, 2), C(0, 2, 6, 2), C(0, 4, 3, 2), C(3, 4, 3, 2)),

            T("5-grid", 5, 6, 6, C(0, 0, 2, 3), C(2, 0, 2, 3), C(4, 0, 2, 3), C(0, 3, 3, 3), C(3, 3, 3, 3)),
            T("5-hero", 5, 6, 6, C(0, 0, 4, 4), C(4, 0, 2, 2), C(4, 2, 2, 2), C(0, 4, 3, 2), C(3, 4, 3, 2)),
            T("5-right", 5, 6, 6, C(0, 0, 3, 6), C(3, 0, 3, 2), C(3, 2, 3, 2), C(3, 4, 2, 2), C(5, 4, 1, 2)),
            T("5-banner", 5, 6, 6, C(0, 0, 6, 2), C(0, 2, 3, 2), C(3, 2, 3, 2), C(0, 4, 3, 2), C(3, 4, 3, 2)),
            T("5-bottom", 5, 6, 6, C(0, 0, 6, 3), C(0, 3, 2, 3), C(2, 3, 2, 3), C(4, 3, 1, 3), C(5, 3, 1, 3)),
            T("5-ladder", 5, 6, 6, C(0, 0, 3, 2), C(3, 0, 3, 3), C(0, 2, 3, 2), C(3, 3, 3, 3), C(0, 4, 3, 2)),

            T("6-grid", 6, 6, 6, C(0, 0, 2, 3), C(2, 0, 2, 3), C(4, 0, 2, 3), C(0, 3, 2, 3), C(2, 3, 2, 3), C(4, 3, 2, 3)),
            T("6-feature", 6, 6, 6, C(0, 0, 3, 3), C(3, 0, 3, 2), C(3, 2, 3, 2), C(0, 3, 2, 3), C(2, 3, 2, 3), C(4, 4, 2, 2)),
            T("6-banner", 6, 6, 6, C(0, 0, 6, 2), C(0, 2, 2, 2), C(2, 2, 2, 2), C(4, 2, 2, 2), C(0, 4, 3, 2), C(3, 4, 3, 2)),
            T("6-left", 6, 6, 6, C(0, 0, 3, 6), C(3, 0, 3, 2), C(3, 2, 3, 2), C(3, 4, 1, 2), C(4, 4, 1, 2), C(5, 4, 1, 2)),
            T("6-stripes", 6, 6, 6, C(0, 0, 1, 6), C(1, 0, 1, 6), C(2, 0, 1, 6), C(3, 0, 1, 6), C(4, 0, 1, 6), C(5, 0, 1, 6)),
            T("6-mosaic", 6, 6, 6, C(0, 0, 2, 2), C(2, 0, 4, 2), C(0, 2, 3, 2), C(3, 2, 3, 2), C(0, 4, 2, 2), C(2, 4, 4, 2)),

            D("28-hero", 28, C(0, 0, 3, 3)),
            D("28-center", 28, C(2, 2, 3, 3)),

            D("29-hero", 29, C(0, 0, 2, 3), C(5, 3, 1, 3)),
            D("29-side", 29, C(4, 0, 2, 3), C(0, 3, 1, 3)),

            D("30-duo", 30, C(0, 0, 2, 2), C(4, 4, 2, 2)),
            D("30-stack", 30, C(0, 0, 2, 2), C(0, 4, 2, 2)),

            D("31-hero", 31, C(0, 0, 2, 3)),
            D("31-corner", 31, C(4, 3, 2, 3))
        };

        return templates.ToDictionary(template => template.Id, StringComparer.OrdinalIgnoreCase);
    }

    private static GridTemplate T(string id, int imageCount, int columns, int rows, params GridCell[] cells)
    {
        return new GridTemplate(id, imageCount, columns, rows, cells);
    }

    private static GridTemplate D(string id, int imageCount, params GridCell[] mergedCells)
    {
        return T(id, imageCount, 6, 6, CreateDenseCells(mergedCells).ToArray());
    }

    private static IEnumerable<GridCell> CreateDenseCells(IReadOnlyCollection<GridCell> mergedCells)
    {
        foreach (var cell in mergedCells)
        {
            yield return cell;
        }

        for (var row = 0; row < 6; row++)
        {
            for (var column = 0; column < 6; column++)
            {
                if (!mergedCells.Any(cell => Contains(cell, column, row)))
                {
                    yield return C(column, row, 1, 1);
                }
            }
        }
    }

    private static bool Contains(GridCell cell, int column, int row)
    {
        return column >= cell.Column
            && column < cell.Column + cell.ColumnSpan
            && row >= cell.Row
            && row < cell.Row + cell.RowSpan;
    }

    private static GridCell C(int column, int row, int columnSpan, int rowSpan)
    {
        return new GridCell(column, row, columnSpan, rowSpan);
    }

    private sealed record GridTemplate(string Id, int ImageCount, int Columns, int Rows, IReadOnlyList<GridCell> Cells);

    private sealed record GridCell(int Column, int Row, int ColumnSpan, int RowSpan);
}
