using Collager.Models;
using System.Text.Json;

namespace Collager.Services;

public sealed class TemplateModService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    private static readonly HashSet<string> AllowedIconExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".gif",
        ".svg"
    };

    private readonly string _templateDirectory;

    public TemplateModService()
    {
        _templateDirectory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            AppBrand.Name,
            "templates");
        Directory.CreateDirectory(_templateDirectory);
        EnsureExampleTemplate();
    }

    public string TemplateDirectory => _templateDirectory;

    public IReadOnlyList<TemplateDefinition> GetTemplates()
    {
        var templates = new List<TemplateDefinition>();
        templates.AddRange(CollageTemplateCatalog.BuiltInTemplates);
        templates.AddRange(LoadCustomTemplates());
        return templates;
    }

    public bool TryGetIcon(string relativePath, out string fullPath, out string contentType)
    {
        fullPath = "";
        contentType = "application/octet-stream";

        if (string.IsNullOrWhiteSpace(relativePath)
            || relativePath.Contains("..", StringComparison.Ordinal)
            || Path.IsPathRooted(relativePath))
        {
            return false;
        }

        var candidate = Path.GetFullPath(Path.Combine(_templateDirectory, relativePath));
        var root = Path.GetFullPath(_templateDirectory);
        if (!candidate.StartsWith(root, StringComparison.OrdinalIgnoreCase) || !File.Exists(candidate))
        {
            return false;
        }

        var extension = Path.GetExtension(candidate);
        if (!AllowedIconExtensions.Contains(extension))
        {
            return false;
        }

        fullPath = candidate;
        contentType = extension.ToLowerInvariant() switch
        {
            ".svg" => "image/svg+xml",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            _ => "application/octet-stream"
        };
        return true;
    }

    private IEnumerable<TemplateDefinition> LoadCustomTemplates()
    {
        foreach (var path in Directory.EnumerateFiles(_templateDirectory, "*.json", SearchOption.AllDirectories))
        {
            TemplateDefinition? template;
            try
            {
                var json = File.ReadAllText(path);
                template = JsonSerializer.Deserialize<TemplateDefinition>(json, JsonOptions);
            }
            catch (IOException)
            {
                continue;
            }
            catch (JsonException)
            {
                continue;
            }

            if (template is null || !IsValidTemplate(template))
            {
                continue;
            }

            var id = template.Id.Trim();
            yield return new TemplateDefinition
            {
                Id = id.StartsWith("custom:", StringComparison.OrdinalIgnoreCase) ? id : $"custom:{id}",
                Name = string.IsNullOrWhiteSpace(template.Name) ? id : template.Name.Trim(),
                Source = "custom",
                ImageCount = template.ImageCount,
                Columns = Math.Clamp(template.Columns, 1, 24),
                Rows = Math.Clamp(template.Rows, 1, 24),
                Icon = template.Icon,
                IconUrl = ResolveIconUrl(path, template.Icon ?? template.IconUrl),
                Cells = template.Cells
            };
        }
    }

    private static bool IsValidTemplate(TemplateDefinition template)
    {
        if (string.IsNullOrWhiteSpace(template.Id)
            || template.ImageCount <= 0
            || template.Columns <= 0
            || template.Rows <= 0
            || template.Cells.Count != template.ImageCount)
        {
            return false;
        }

        return template.Cells.All(cell =>
            cell.Column >= 0
            && cell.Row >= 0
            && cell.ColumnSpan > 0
            && cell.RowSpan > 0
            && cell.Column + cell.ColumnSpan <= template.Columns
            && cell.Row + cell.RowSpan <= template.Rows);
    }

    private string? ResolveIconUrl(string templatePath, string? icon)
    {
        if (string.IsNullOrWhiteSpace(icon))
        {
            return null;
        }

        var directory = Path.GetDirectoryName(templatePath) ?? _templateDirectory;
        var fullPath = Path.GetFullPath(Path.Combine(directory, icon));
        var root = Path.GetFullPath(_templateDirectory);
        if (!fullPath.StartsWith(root, StringComparison.OrdinalIgnoreCase)
            || !File.Exists(fullPath)
            || !AllowedIconExtensions.Contains(Path.GetExtension(fullPath)))
        {
            return null;
        }

        var relativePath = Path.GetRelativePath(_templateDirectory, fullPath).Replace('\\', '/');
        return $"/api/templates/icon/{Uri.EscapeDataString(relativePath)}";
    }

    private void EnsureExampleTemplate()
    {
        var examplePath = Path.Combine(_templateDirectory, "example-four-panel.json");
        var iconPath = Path.Combine(_templateDirectory, "icon.svg");
        if (!File.Exists(iconPath))
        {
            File.WriteAllText(iconPath, """
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
                  <rect width="64" height="64" rx="12" fill="#224e87"/>
                  <rect x="10" y="10" width="28" height="28" rx="3" fill="#ffffff" opacity=".92"/>
                  <rect x="42" y="10" width="12" height="18" rx="2" fill="#ffffff" opacity=".72"/>
                  <rect x="42" y="32" width="12" height="22" rx="2" fill="#ffffff" opacity=".84"/>
                  <rect x="10" y="42" width="28" height="12" rx="2" fill="#ffffff" opacity=".72"/>
                </svg>
                """);
        }

        if (File.Exists(examplePath))
        {
            return;
        }

        var example = new TemplateDefinition
        {
            Id = "example-four-panel",
            Name = "示例四格",
            Source = "custom",
            ImageCount = 4,
            Columns = 6,
            Rows = 6,
            Icon = "icon.svg",
            Cells =
            [
                new TemplateCell { Column = 0, Row = 0, ColumnSpan = 4, RowSpan = 4 },
                new TemplateCell { Column = 4, Row = 0, ColumnSpan = 2, RowSpan = 2 },
                new TemplateCell { Column = 4, Row = 2, ColumnSpan = 2, RowSpan = 2 },
                new TemplateCell { Column = 0, Row = 4, ColumnSpan = 6, RowSpan = 2 }
            ]
        };

        File.WriteAllText(examplePath, JsonSerializer.Serialize(example, JsonOptions));
    }
}
