using System.Drawing;

namespace Collager.Models;

public sealed class CollageOptions
{
    public int OutputWidth { get; init; } = 1080;

    public int OutputHeight { get; init; } = 1920;

    public int Gap { get; init; } = 18;

    public int OuterPadding { get; init; } = 28;

    public int CornerRadius { get; init; } = 18;

    public Color BackgroundColor { get; init; } = Color.White;

    public Color ShadowColor { get; init; } = Color.FromArgb(45, 0, 0, 0);

    public CollageMode Mode { get; init; } = CollageMode.Auto;

    public string TemplateId { get; init; } = "auto";

    public int TemplateColumns { get; init; } = 6;

    public int TemplateRows { get; init; } = 6;

    public double EqualGridRatio { get; init; } = 1;

    public IReadOnlyList<TemplateCell> TemplateCells { get; init; } = [];

    public IReadOnlyList<ImagePlacement> Placements { get; init; } = [];
}
