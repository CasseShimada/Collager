namespace MeiTool.Models;

public sealed class TemplateCell
{
    public int Column { get; init; }

    public int Row { get; init; }

    public int ColumnSpan { get; init; }

    public int RowSpan { get; init; }
}
