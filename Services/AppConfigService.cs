using Collager.Models;
using System.Text.Json;

namespace Collager.Services;

public sealed class AppConfigService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    private readonly object _syncRoot = new();
    private AppConfig _config;

    public AppConfigService()
    {
        ConfigPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            AppBrand.Name,
            "config.json");
        _config = LoadFromDisk(ConfigPath);
    }

    public string ConfigPath { get; }

    public AppConfig Current
    {
        get
        {
            lock (_syncRoot)
            {
                return Clone(_config);
            }
        }
    }

    public AppConfig Update(AppConfig next)
    {
        lock (_syncRoot)
        {
            _config = Normalize(next);
            SaveToDisk(_config);
            return Clone(_config);
        }
    }

    private AppConfig LoadFromDisk(string path)
    {
        try
        {
            if (!File.Exists(path))
            {
                var created = Normalize(new AppConfig());
                SaveToDisk(created);
                return created;
            }

            var json = File.ReadAllText(path);
            return Normalize(JsonSerializer.Deserialize<AppConfig>(json, JsonOptions) ?? new AppConfig());
        }
        catch
        {
            return Normalize(new AppConfig());
        }
    }

    private void SaveToDisk(AppConfig config)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(ConfigPath)!);
        File.WriteAllText(ConfigPath, JsonSerializer.Serialize(config, JsonOptions));
    }

    private static AppConfig Normalize(AppConfig config)
    {
        var settings = config.Settings ?? new CollageSettingsConfig();
        return new AppConfig
        {
            Port = Math.Clamp(config.Port, 1024, 65535),
            Settings = new CollageSettingsConfig
            {
                Width = Math.Clamp(settings.Width, 400, 6000),
                Height = Math.Clamp(settings.Height, 400, 6000),
                Gap = Math.Clamp(settings.Gap, 0, 120),
                Padding = Math.Clamp(settings.Padding, 0, 200),
                Radius = Math.Clamp(settings.Radius, 0, 80),
                Background = IsHexColor(settings.Background) ? settings.Background : "#ffffff",
                Mode = string.IsNullOrWhiteSpace(settings.Mode) ? "Portrait" : settings.Mode,
                Template = string.IsNullOrWhiteSpace(settings.Template) ? "auto" : settings.Template,
                EqualGridRatio = Math.Clamp(settings.EqualGridRatio, 0.35, 2.8)
            }
        };
    }

    private static bool IsHexColor(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length != 7 || value[0] != '#')
        {
            return false;
        }

        return value.Skip(1).All(Uri.IsHexDigit);
    }

    private static AppConfig Clone(AppConfig config)
    {
        return new AppConfig
        {
            Port = config.Port,
            Settings = new CollageSettingsConfig
            {
                Width = config.Settings.Width,
                Height = config.Settings.Height,
                Gap = config.Settings.Gap,
                Padding = config.Settings.Padding,
                Radius = config.Settings.Radius,
                Background = config.Settings.Background,
                Mode = config.Settings.Mode,
                Template = config.Settings.Template,
                EqualGridRatio = config.Settings.EqualGridRatio
            }
        };
    }
}
