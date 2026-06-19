using Collager.Models;
using System.Drawing;

namespace Collager.Services;

public static class CollageTemplateCatalog
{
    public static IReadOnlyList<TemplateDefinition> BuiltInTemplates { get; } = CreateTemplates();

    private static readonly Dictionary<string, TemplateDefinition> Templates = BuiltInTemplates
        .ToDictionary(template => template.Id, StringComparer.OrdinalIgnoreCase);

    public static bool TryCreateLayout(string templateId, int imageCount, RectangleF content, int gap, out List<RectangleF> layout)
    {
        layout = [];

        if (!Templates.TryGetValue(templateId, out var template) || template.ImageCount != imageCount)
        {
            return false;
        }

        layout = CreateLayout(template, content, gap);
        return true;
    }

    public static List<RectangleF> CreateLayout(TemplateDefinition template, RectangleF content, int gap)
    {
        var unitWidth = (content.Width - gap * (template.Columns - 1)) / template.Columns;
        var unitHeight = (content.Height - gap * (template.Rows - 1)) / template.Rows;

        return template.Cells
            .Select(cell => new RectangleF(
                content.X + cell.Column * (unitWidth + gap),
                content.Y + cell.Row * (unitHeight + gap),
                cell.ColumnSpan * unitWidth + (cell.ColumnSpan - 1) * gap,
                cell.RowSpan * unitHeight + (cell.RowSpan - 1) * gap))
            .ToList();
    }

    private static IReadOnlyList<TemplateDefinition> CreateTemplates()
    {
        return
        [
            T("2-vsplit", "竖分", 2, C(0, 0, 3, 6), C(3, 0, 3, 6)),
            T("2-hsplit", "横分", 2, C(0, 0, 6, 3), C(0, 3, 6, 3)),
            T("2-poster", "海报", 2, C(0, 0, 6, 4), C(0, 4, 6, 2)),
            T("2-corner", "角落", 2, C(0, 0, 4, 6), C(4, 3, 2, 3)),
            T("2-offset", "叠放", 2, C(0, 0, 4, 4), C(2, 2, 4, 4)),

            T("3-left", "主图左", 3, C(0, 0, 3, 6), C(3, 0, 3, 3), C(3, 3, 3, 3)),
            T("3-bottom", "底栏", 3, C(0, 0, 6, 4), C(0, 4, 3, 2), C(3, 4, 3, 2)),
            T("3-top", "顶部双图", 3, C(0, 0, 3, 3), C(3, 0, 3, 3), C(0, 3, 6, 3)),
            T("3-columns", "三列", 3, C(0, 0, 2, 6), C(2, 0, 2, 6), C(4, 0, 2, 6)),
            T("3-rows", "三行", 3, C(0, 0, 6, 2), C(0, 2, 6, 2), C(0, 4, 6, 2)),
            T("3-feature", "大图", 3, C(0, 0, 4, 6), C(4, 0, 2, 3), C(4, 3, 2, 3)),
            T("3-tall-side", "竖边栏", 3, C(0, 0, 4, 6), C(4, 0, 2, 3), C(4, 3, 2, 3)),
            T("3-stacked", "双横栏", 3, C(0, 0, 6, 2), C(0, 2, 6, 2), C(0, 4, 6, 2)),

            T("4-grid", "四宫格", 4, C(0, 0, 3, 3), C(3, 0, 3, 3), C(0, 3, 3, 3), C(3, 3, 3, 3)),
            T("4-mosaic", "拼接", 4, C(0, 0, 4, 4), C(4, 0, 2, 2), C(4, 2, 2, 2), C(0, 4, 6, 2)),
            T("4-side", "侧栏", 4, C(0, 0, 3, 6), C(3, 0, 3, 2), C(3, 2, 3, 2), C(3, 4, 3, 2)),
            T("4-banner", "横幅", 4, C(0, 0, 6, 2), C(0, 2, 2, 4), C(2, 2, 2, 4), C(4, 2, 2, 4)),
            T("4-stripes", "条纹", 4, C(0, 0, 6, 1), C(0, 1, 6, 2), C(0, 3, 6, 1), C(0, 4, 6, 2)),
            T("4-vertical", "竖条", 4, C(0, 0, 2, 6), C(2, 0, 1, 6), C(3, 0, 1, 6), C(4, 0, 2, 6)),
            T("4-stack", "堆叠", 4, C(0, 0, 6, 2), C(0, 2, 6, 2), C(0, 4, 3, 2), C(3, 4, 3, 2)),
            T("4-left-mini", "左大右三", 4, C(0, 0, 3, 6), C(3, 0, 3, 2), C(3, 2, 3, 2), C(3, 4, 3, 2)),
            T("4-top-trio", "三小一横", 4, C(0, 0, 2, 3), C(2, 0, 2, 3), C(4, 0, 2, 3), C(0, 3, 6, 3)),
            T("4-frame", "框形", 4, C(0, 0, 3, 3), C(3, 0, 3, 2), C(0, 3, 2, 3), C(2, 2, 4, 4)),

            T("5-grid", "五格", 5, C(0, 0, 2, 3), C(2, 0, 2, 3), C(4, 0, 2, 3), C(0, 3, 3, 3), C(3, 3, 3, 3)),
            T("5-hero", "主图", 5, C(0, 0, 4, 4), C(4, 0, 2, 2), C(4, 2, 2, 2), C(0, 4, 3, 2), C(3, 4, 3, 2)),
            T("5-right", "右栏", 5, C(0, 0, 3, 6), C(3, 0, 3, 2), C(3, 2, 3, 2), C(3, 4, 2, 2), C(5, 4, 1, 2)),
            T("5-banner", "横向", 5, C(0, 0, 6, 2), C(0, 2, 3, 2), C(3, 2, 3, 2), C(0, 4, 3, 2), C(3, 4, 3, 2)),
            T("5-bottom", "大上图", 5, C(0, 0, 6, 3), C(0, 3, 2, 3), C(2, 3, 2, 3), C(4, 3, 1, 3), C(5, 3, 1, 3)),
            T("5-ladder", "阶梯", 5, C(0, 0, 3, 2), C(3, 0, 3, 3), C(0, 2, 3, 2), C(3, 3, 3, 3), C(0, 4, 3, 2)),
            T("5-stripes", "五横条", 5, C(0, 0, 6, 1), C(0, 1, 6, 1), C(0, 2, 6, 1), C(0, 3, 6, 1), C(0, 4, 6, 2)),
            T("5-center", "中心块", 5, C(0, 0, 2, 3), C(2, 0, 2, 2), C(4, 0, 2, 3), C(2, 2, 2, 2), C(0, 3, 6, 3)),

            T("6-grid", "六宫格", 6, C(0, 0, 2, 3), C(2, 0, 2, 3), C(4, 0, 2, 3), C(0, 3, 2, 3), C(2, 3, 2, 3), C(4, 3, 2, 3)),
            T("6-feature", "错落", 6, C(0, 0, 3, 3), C(3, 0, 3, 2), C(3, 2, 3, 2), C(0, 3, 2, 3), C(2, 3, 2, 3), C(4, 4, 2, 2)),
            T("6-banner", "横幅", 6, C(0, 0, 6, 2), C(0, 2, 2, 2), C(2, 2, 2, 2), C(4, 2, 2, 2), C(0, 4, 3, 2), C(3, 4, 3, 2)),
            T("6-left", "主图左", 6, C(0, 0, 3, 6), C(3, 0, 3, 2), C(3, 2, 3, 2), C(3, 4, 1, 2), C(4, 4, 1, 2), C(5, 4, 1, 2)),
            T("6-stripes", "竖条", 6, C(0, 0, 1, 6), C(1, 0, 1, 6), C(2, 0, 1, 6), C(3, 0, 1, 6), C(4, 0, 1, 6), C(5, 0, 1, 6)),
            T("6-mosaic", "拼接", 6, C(0, 0, 2, 2), C(2, 0, 4, 2), C(0, 2, 3, 2), C(3, 2, 3, 2), C(0, 4, 2, 2), C(2, 4, 4, 2)),
            T("6-top-large", "上大下排", 6, C(0, 0, 6, 3), C(0, 3, 1, 3), C(1, 3, 1, 3), C(2, 3, 1, 3), C(3, 3, 1, 3), C(4, 3, 2, 3)),
            T("6-right-large", "右大左列", 6, C(0, 0, 2, 2), C(0, 2, 2, 2), C(0, 4, 2, 2), C(2, 0, 2, 3), C(2, 3, 2, 3), C(4, 0, 2, 6)),

            D("7-balanced", "均衡", 7, C(0, 0, 3, 3), C(3, 0, 3, 3), C(0, 3, 2, 3), C(2, 3, 2, 3), C(4, 3, 2, 2)),
            D("7-side", "侧栏", 7, C(0, 0, 2, 6), C(2, 0, 2, 3), C(4, 0, 2, 3), C(2, 3, 2, 3), C(4, 3, 2, 2)),
            D("7-banner", "横幅", 7, C(0, 0, 6, 2), C(0, 2, 3, 2), C(3, 2, 3, 2), C(0, 4, 2, 2), C(2, 4, 3, 2)),

            D("8-hero", "主图", 8, C(0, 0, 3, 3), C(3, 0, 3, 2), C(0, 3, 2, 3), C(2, 3, 2, 3), C(4, 2, 2, 3)),
            D("8-banner", "横幅", 8, C(0, 0, 6, 2), C(0, 2, 2, 4), C(2, 2, 2, 3), C(4, 2, 2, 3)),
            D("8-mosaic", "拼接", 8, C(0, 0, 3, 3), C(3, 0, 3, 3), C(0, 3, 2, 2), C(2, 3, 2, 2), C(4, 3, 2, 2), C(0, 5, 4, 1)),

            T("9-grid", "九宫格", 9, C(0, 0, 2, 2), C(2, 0, 2, 2), C(4, 0, 2, 2), C(0, 2, 2, 2), C(2, 2, 2, 2), C(4, 2, 2, 2), C(0, 4, 2, 2), C(2, 4, 2, 2), C(4, 4, 2, 2)),
            D("9-hero", "主图", 9, C(0, 0, 3, 3), C(3, 0, 3, 3), C(0, 3, 2, 3), C(2, 3, 2, 2), C(4, 3, 2, 2)),
            D("9-banner", "横幅", 9, C(0, 0, 6, 2), C(0, 2, 2, 4), C(2, 2, 2, 2), C(4, 2, 2, 2), C(2, 4, 2, 2)),

            D("10-hero", "主图", 10, C(0, 0, 3, 3), C(3, 0, 3, 2), C(0, 3, 2, 3), C(2, 3, 2, 3), C(4, 2, 2, 2)),
            D("10-stripes", "条带", 10, C(0, 0, 6, 1), C(0, 1, 6, 1), C(0, 2, 2, 4), C(2, 2, 2, 2), C(4, 2, 2, 2), C(2, 4, 2, 2)),
            D("10-frame", "框形", 10, C(0, 0, 6, 2), C(0, 2, 2, 2), C(4, 2, 2, 2), C(0, 4, 2, 2), C(2, 4, 2, 2), C(4, 4, 2, 2)),

            D("11-hero", "主图", 11, C(0, 0, 3, 3), C(3, 0, 3, 2), C(0, 3, 2, 3), C(2, 3, 2, 2), C(4, 2, 2, 2), C(4, 4, 1, 2)),
            D("11-banner", "横幅", 11, C(0, 0, 6, 2), C(0, 2, 2, 3), C(2, 2, 2, 3), C(4, 2, 2, 2), C(4, 4, 2, 1)),
            D("11-stack", "堆叠", 11, C(0, 0, 3, 2), C(3, 0, 3, 2), C(0, 2, 2, 3), C(2, 2, 2, 2), C(4, 2, 2, 2), C(2, 4, 2, 2), C(4, 4, 2, 1)),

            D("12-hero", "主图", 12, C(0, 0, 3, 3), C(3, 0, 3, 2), C(0, 3, 2, 3), C(2, 3, 2, 2), C(4, 2, 2, 2)),
            D("12-stripes", "条带", 12, C(0, 0, 6, 1), C(0, 1, 6, 1), C(0, 2, 2, 4), C(2, 2, 2, 2), C(4, 2, 2, 2), C(2, 4, 2, 1)),
            D("12-mosaic", "拼接", 12, C(0, 0, 3, 2), C(3, 0, 3, 2), C(0, 2, 2, 2), C(2, 2, 2, 2), C(4, 2, 2, 2), C(0, 4, 2, 2), C(2, 4, 3, 1)),

            D("13-hero", "主图", 13, C(0, 0, 3, 3), C(3, 0, 3, 2), C(0, 3, 2, 2), C(2, 3, 2, 2), C(4, 2, 2, 2), C(4, 4, 1, 2)),
            D("13-mosaic", "拼接", 13, C(0, 0, 3, 2), C(3, 0, 3, 2), C(0, 2, 2, 2), C(2, 2, 2, 2), C(4, 2, 2, 2), C(0, 4, 2, 2), C(2, 4, 2, 1)),
            D("13-grid", "网格", 13, C(0, 0, 2, 2), C(2, 0, 2, 2), C(4, 0, 2, 2), C(0, 2, 2, 2), C(2, 2, 2, 2), C(4, 2, 2, 2), C(0, 4, 2, 2), C(2, 4, 3, 1)),

            D("14-frame", "框形", 14, C(0, 0, 3, 2), C(3, 0, 3, 2), C(0, 2, 2, 3), C(2, 2, 2, 2), C(4, 2, 2, 2), C(2, 4, 2, 1)),
            D("14-mosaic", "拼接", 14, C(0, 0, 3, 2), C(3, 0, 3, 2), C(0, 2, 2, 2), C(2, 2, 2, 2), C(4, 2, 2, 2), C(0, 4, 3, 1), C(3, 4, 2, 1)),
            D("14-grid", "网格", 14, C(0, 0, 2, 2), C(2, 0, 2, 2), C(4, 0, 2, 2), C(0, 2, 2, 2), C(2, 2, 2, 2), C(4, 2, 2, 2), C(0, 4, 3, 1), C(3, 4, 3, 1)),

            D("15-frame", "框形", 15, C(0, 0, 3, 2), C(3, 0, 3, 2), C(0, 2, 2, 2), C(2, 2, 2, 2), C(4, 2, 2, 2), C(0, 4, 3, 1)),
            D("15-grid", "网格", 15, C(0, 0, 2, 2), C(2, 0, 2, 2), C(4, 0, 2, 2), C(0, 2, 2, 2), C(2, 2, 2, 2), C(4, 2, 2, 2), C(0, 4, 2, 2)),
            D("15-mosaic", "拼接", 15, C(0, 0, 2, 2), C(2, 0, 2, 2), C(4, 0, 2, 2), C(0, 2, 2, 2), C(2, 2, 2, 2), C(4, 2, 2, 2), C(0, 4, 3, 1), C(3, 4, 2, 1)),

            D("16-frame", "框形", 16, C(0, 0, 3, 2), C(3, 0, 3, 2), C(0, 2, 2, 2), C(2, 2, 2, 2), C(4, 2, 2, 1), C(0, 4, 2, 2)),
            D("16-grid", "网格", 16, C(0, 0, 2, 2), C(2, 0, 2, 2), C(4, 0, 2, 2), C(0, 2, 2, 2), C(2, 2, 2, 2), C(4, 2, 2, 2), C(0, 4, 3, 1)),
            D("16-mosaic", "拼接", 16, C(0, 0, 2, 2), C(2, 0, 2, 2), C(4, 0, 2, 2), C(0, 2, 2, 2), C(2, 2, 2, 2), C(4, 2, 2, 2), C(0, 4, 2, 1), C(2, 4, 2, 1)),

            D("27-heart-left", "心形左", 27, C(0, 0, 2, 2), C(4, 0, 2, 2), C(2, 3, 2, 2)),
            D("27-heart-wide", "心形宽", 27, C(0, 0, 2, 2), C(4, 0, 2, 2), C(0, 4, 2, 2), C(5, 5, 1, 1)),
            D("28-hero", "大主图", 28, C(0, 0, 3, 3)),
            D("28-center", "中心主图", 28, C(2, 2, 3, 3)),
            D("29-hero", "主图加竖栏", 29, C(0, 0, 2, 3), C(5, 3, 1, 3)),
            D("29-side", "侧边强调", 29, C(4, 0, 2, 3), C(0, 3, 1, 3)),
            D("30-duo", "双主图", 30, C(0, 0, 2, 2), C(4, 4, 2, 2)),
            D("30-stack", "上下主图", 30, C(0, 0, 2, 2), C(0, 4, 2, 2)),
            D("31-hero", "一张主图", 31, C(0, 0, 2, 3)),
            D("31-corner", "角落主图", 31, C(4, 3, 2, 3))
        ];
    }

    private static TemplateDefinition T(string id, string name, int imageCount, params TemplateCell[] cells)
    {
        return new TemplateDefinition
        {
            Id = id,
            Name = name,
            Source = "builtin",
            ImageCount = imageCount,
            Columns = 6,
            Rows = 6,
            Cells = cells
        };
    }

    private static TemplateDefinition D(string id, string name, int imageCount, params TemplateCell[] mergedCells)
    {
        return T(id, name, imageCount, CreateDenseCells(mergedCells).ToArray());
    }

    private static IEnumerable<TemplateCell> CreateDenseCells(IReadOnlyCollection<TemplateCell> mergedCells)
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

    private static bool Contains(TemplateCell cell, int column, int row)
    {
        return column >= cell.Column
            && column < cell.Column + cell.ColumnSpan
            && row >= cell.Row
            && row < cell.Row + cell.RowSpan;
    }

    private static TemplateCell C(int column, int row, int columnSpan, int rowSpan)
    {
        return new TemplateCell
        {
            Column = column,
            Row = row,
            ColumnSpan = columnSpan,
            RowSpan = rowSpan
        };
    }
}
