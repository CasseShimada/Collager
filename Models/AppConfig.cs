namespace Collager.Models;

public sealed class AppConfig
{
    public int Port { get; set; } = 5123;

    public CollageSettingsConfig Settings { get; set; } = new();
}

public sealed class CollageSettingsConfig
{
    public int Width { get; set; } = 1080;

    public int Height { get; set; } = 1920;

    public int Gap { get; set; } = 18;

    public int Padding { get; set; } = 28;

    public int Radius { get; set; } = 18;

    public string Background { get; set; } = "#ffffff";

    public string Mode { get; set; } = "Portrait";

    public string Template { get; set; } = "auto";

    public double EqualGridRatio { get; set; } = 1;

    public int TargetPageCount { get; set; } = 1;
}
