namespace Collager.Models;

public sealed class TemplateDefinition
{
    public string Id { get; init; } = "";

    public string Name { get; init; } = "";

    public string Source { get; init; } = "custom";

    public int ImageCount { get; init; }

    public int Columns { get; init; } = 6;

    public int Rows { get; init; } = 6;

    public string? Icon { get; init; }

    public string? IconUrl { get; init; }

    public IReadOnlyList<TemplateCell> Cells { get; init; } = [];
}
